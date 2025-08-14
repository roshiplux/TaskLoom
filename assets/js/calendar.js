// Rebuilt clean calendar script
document.addEventListener('DOMContentLoaded', () => {
    // --- Element refs ---
    const els = {
        monthlyTaskInput: document.getElementById('monthlyTaskInput'),
        addMonthlyTaskBtn: document.getElementById('addMonthlyTaskBtn'),
        monthlyTodoList: document.getElementById('monthlyTodoList'),
        monthSelector: document.getElementById('monthSelector'),
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),
        refreshEvents: document.getElementById('refreshEvents'),
        todayBtn: document.getElementById('todayBtn'),
        currentMonthEl: document.getElementById('currentMonth'),
        grid: document.getElementById('calendar-grid'),
        monthPicker: document.getElementById('monthPicker'),
        yearPicker: document.getElementById('yearPicker'),
        monthPickerYear: document.getElementById('monthPickerYear'),
        weekView: document.getElementById('weekView'),
        dayView: document.getElementById('dayView'),
        viewButtons: document.querySelectorAll('.view-btn'),
        monthIndicator: document.getElementById('currentMonthIndicator')
    };

    // --- State ---
    let currentDate = new Date();
    let calendarInitialized = false;
    let calendarViewMode = 'month'; // month|week|day
    let pickerView = 'calendar'; // calendar|months|years
    let isGenerating = false;

    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    /* ================= MONTHLY TODO ================= */
    function updateMonthIndicator(month = currentDate.getMonth(), year = currentDate.getFullYear()) {
        if (els.monthIndicator) els.monthIndicator.textContent = `${MONTHS[month]} ${year}`;
    }

    function loadMonthlyTasksRaw() {
        if (!window.StorageService) return [];
        try { return StorageService.getMonthlyTasks() || []; } catch { return []; }
    }

    function renderMonthlyTodo() {
        updateMonthIndicator();
        if (!els.monthlyTodoList || !els.monthSelector) return;
        const all = loadMonthlyTasksRaw();
        const sel = els.monthSelector.value;
        const curM = currentDate.getMonth();
        const curY = currentDate.getFullYear();
        let filtered = all.filter(t => typeof t === 'object');
        if (sel !== 'current') {
            const m = parseInt(sel,10);
            filtered = filtered.filter(t => (t.month ?? curM) === m && (t.year ?? curY) === curY);
        } else {
            filtered = filtered.filter(t => (t.month ?? curM) === curM && (t.year ?? curY) === curY);
        }
        els.monthlyTodoList.innerHTML = '';
        if (!filtered.length) {
            const div = document.createElement('div');
            div.className='monthly-todo-empty';
            div.textContent='No tasks for this month';
            els.monthlyTodoList.appendChild(div);
            return;
        }
        filtered.forEach(task => {
            const idx = all.indexOf(task);
            const row = document.createElement('div');
            row.className = `monthly-todo-item ${task.done?'completed':''}`;
            row.innerHTML = `
                <input type="checkbox" ${task.done?'checked':''} aria-label="Toggle task">
                <span class="task-text"></span>
                <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>`;
            row.querySelector('.task-text').textContent = task.text;
            row.querySelector('input').addEventListener('change', ()=>toggleMonthlyTask(idx));
            row.querySelector('button').addEventListener('click', ()=>removeMonthlyTask(idx));
            els.monthlyTodoList.appendChild(row);
        });
    }

    function addMonthlyTask() {
        if (!els.monthlyTaskInput || !window.StorageService) return;
        const text = els.monthlyTaskInput.value.trim();
        if (!text) return;
        const sel = els.monthSelector?.value || 'current';
        const baseMonth = sel==='current'?currentDate.getMonth():parseInt(sel,10);
        const task = { text, done:false, month:baseMonth, year: currentDate.getFullYear(), createdAt: new Date().toISOString() };
        StorageService.addMonthlyTask(task);
        els.monthlyTaskInput.value='';
        renderMonthlyTodo();
    }
    function toggleMonthlyTask(idx){ if(!window.StorageService)return; StorageService.toggleMonthlyTask(idx); renderMonthlyTodo(); }
    function removeMonthlyTask(idx){ if(!window.StorageService)return; StorageService.deleteMonthlyTask(idx); renderMonthlyTodo(); }
    window.handleRemoveMonthlyTask = removeMonthlyTask; // legacy safety

    /* ================= CALENDAR (MONTH) ================= */
    async function generateMonthView(month=currentDate.getMonth(), year=currentDate.getFullYear()) {
        if (!els.grid || isGenerating) return;
        isGenerating = true;
        els.grid.innerHTML='';
        updateMonthIndicator(month,year);
        const firstDow = new Date(year,month,1).getDay();
        const daysInMonth = new Date(year,month+1,0).getDate();
        // headers
        DOW.forEach(d=>{ const h=document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; els.grid.appendChild(h); });
        // leading blanks
        for(let i=0;i<firstDow;i++){ const e=document.createElement('div'); e.className='calendar-day other-month'; els.grid.appendChild(e);}    
        // external events map
        let extMap={};
        if (window.CONFIG?.APP?.SHOW_GCAL_EVENTS && window.CalendarService && window.FirebaseService?.user) {
            try {
                const rangeStart = new Date(year,month,1).toISOString();
                const rangeEnd = new Date(year,month,daysInMonth,23,59,59).toISOString();
                const events = await CalendarService.fetchEvents(rangeStart,rangeEnd) || [];
                events.forEach(ev=>{ let key=ev.start; if(key?.length>10) key=key.slice(0,10); (extMap[key] ||= []).push(ev); });
            } catch {}
        }
        if (window.HolidayService){
            const hol = HolidayService.getEventsForMonth(year,month)||{};
            Object.entries(hol).forEach(([k,v])=>{ (extMap[k] ||= []).push(...v); });
        }
        const today = new Date();
        for(let d=1; d<=daysInMonth; d++) {
            const cell=document.createElement('div'); cell.className='calendar-day';
            if (year===today.getFullYear() && month===today.getMonth() && d===today.getDate()) cell.classList.add('today');
            const num=document.createElement('div'); num.className='calendar-day-number'; num.textContent=d; cell.appendChild(num);
            const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            // daily tasks
            if (window.StorageService){
                const dTasks = StorageService.getDailyTasks(dateKey)||[];
                if (dTasks.length){ const wrap=document.createElement('div'); wrap.className='day-tasks'; dTasks.slice(0,3).forEach(t=>{const te=document.createElement('div'); te.className=`calendar-task category-${t.category||'general'}`; te.textContent=t.text; wrap.appendChild(te);}); if(dTasks.length>3){const more=document.createElement('div'); more.className='calendar-task more'; more.textContent=`+${dTasks.length-3}`; wrap.appendChild(more);} cell.appendChild(wrap);} }
            // external events
            const ext = extMap[dateKey];
            if (ext?.length){ const ew=document.createElement('div'); ew.className='ext-events'; ext.slice(0,3).forEach(ev=>{const evd=document.createElement('div'); let cls='calendar-event-ext'; if(ev.type==='holiday')cls+=' holiday'; else if(ev.type==='poya')cls+=' poya'; else if(ev.isRecurring)cls+=' recurring'; evd.className=cls; const title=ev.title||ev.summary||'(No title)'; evd.title=title; evd.textContent= title.length>14?title.slice(0,14)+'…':title; ew.appendChild(evd);} ); if(ext.length>3){const more=document.createElement('div'); more.className='calendar-event-ext more'; more.textContent=`+${ext.length-3}`; ew.appendChild(more);} cell.appendChild(ew); if(ext.some(ev=>ev.type==='holiday'||ev.type==='poya')) cell.classList.add('special-day'); }
            els.grid.appendChild(cell);
        }
        if (els.currentMonthEl) els.currentMonthEl.textContent = `${MONTHS[month]} ${year}`;
        isGenerating = false;
    }

    /* ================= WEEK VIEW ================= */
    async function generateWeekView() {
        if (!els.weekView) return;
        const start = new Date(currentDate); start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start); end.setDate(start.getDate()+6);
        const header = els.weekView.querySelector('.week-header');
        const grid = els.weekView.querySelector('.week-grid');
        header.innerHTML=''; grid.innerHTML='';
        const today = new Date();
        for(let i=0;i<7;i++){
            const dt=new Date(start); dt.setDate(start.getDate()+i);
            const h=document.createElement('div'); h.className='week-header-day'; h.innerHTML=`<div>${DOW[i]}</div><div class="wd-num">${dt.getDate()}</div>`; header.appendChild(h);
            const col=document.createElement('div'); col.className='week-day';
            if(dt.toDateString()===today.toDateString()) col.classList.add('today');
            if(dt.getMonth()!==currentDate.getMonth()) col.classList.add('other-month');
            const label=document.createElement('div'); label.className='week-day-number'; label.textContent=dt.getDate(); col.appendChild(label);
            const dateKey = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            if (window.StorageService){ (StorageService.getDailyTasks(dateKey)||[]).slice(0,5).forEach(t=>{const te=document.createElement('div'); te.className='calendar-task'; te.textContent=t.text; col.appendChild(te);}); }
            grid.appendChild(col);
        }
        updateCalendarTitle();
    }

    /* ================= DAY VIEW ================= */
    async function generateDayView() {
        if (!els.dayView) return;
        const header = els.dayView.querySelector('.day-header');
        const content = els.dayView.querySelector('.day-content');
        header.innerHTML = `<div class="day-date">${currentDate.getDate()}</div><div class="day-weekday">${DOW[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}</div>`;
        const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
        const tasks = window.StorageService? StorageService.getDailyTasks(dateKey): [];
        content.innerHTML = `<h3>Daily Tasks (${tasks.length})</h3>` + (tasks.length? tasks.map(t=>`<div class="day-task-item">${t.text}</div>`).join('') : '<div class="muted">No tasks</div>');
        updateCalendarTitle();
    }

    /* ================= PICKERS ================= */
    function showMonthPicker(){ pickerView='months'; toggleViews(); buildMonthPicker(); }
    function showYearPicker(){ pickerView='years'; toggleViews(); buildYearPicker(); }
    function showCalendarView(){ pickerView='calendar'; toggleViews(); refreshActiveCalendarMode(); }
    function buildMonthPicker(){ if(!els.monthPicker) return; const grid=els.monthPicker.querySelector('.month-grid'); if(!grid)return; grid.innerHTML=''; els.monthPickerYear.textContent=currentDate.getFullYear(); MONTHS_SHORT.forEach((m,i)=>{ const item=document.createElement('div'); item.className='month-item'+(i===currentDate.getMonth()?' current':''); item.textContent=m; item.title=MONTHS[i]; item.addEventListener('click',()=>{ currentDate.setMonth(i); showCalendarView(); }); grid.appendChild(item); }); }
    function buildYearPicker(){ if(!els.yearPicker) return; const grid=els.yearPicker.querySelector('.year-grid'); if(!grid) return; grid.innerHTML=''; const cy=currentDate.getFullYear(); const start=cy-6; for(let y=start;y<start+12;y++){ const item=document.createElement('div'); item.className='year-item'+(y===cy?' current':''); item.textContent=y; item.addEventListener('click',()=>{ currentDate.setFullYear(y); showCalendarView(); }); grid.appendChild(item);} }

    /* ================= VIEW CONTROL ================= */
    function toggleViews(){
        if (!els.grid) return;
        const isCal = pickerView==='calendar';
        els.grid.style.display = (isCal && calendarViewMode==='month')? 'grid':'none';
        els.weekView?.classList.toggle('hidden', !(isCal && calendarViewMode==='week'));
        els.dayView?.classList.toggle('hidden', !(isCal && calendarViewMode==='day'));
        els.monthPicker?.classList.toggle('hidden', pickerView!=='months');
        els.yearPicker?.classList.toggle('hidden', pickerView!=='years');
    }
    function refreshActiveCalendarMode(){
        if (calendarViewMode==='month') generateMonthView();
        else if (calendarViewMode==='week') generateWeekView();
        else generateDayView();
        updateCalendarTitle();
    }
    function updateCalendarTitle(){ if(!els.currentMonthEl) return; if(calendarViewMode==='month'){ els.currentMonthEl.textContent=`${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`; } else if (calendarViewMode==='week'){ const s=new Date(currentDate); s.setDate(currentDate.getDate()-currentDate.getDay()); const e=new Date(s); e.setDate(s.getDate()+6); const sameMonth=s.getMonth()===e.getMonth(); els.currentMonthEl.textContent = sameMonth? `${MONTHS[s.getMonth()]} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}` : `${MONTHS[s.getMonth()]} ${s.getDate()} - ${MONTHS[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`; } else { els.currentMonthEl.textContent=`${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`; } }

    /* ================= NAVIGATION ================= */
        function navPrev(){
            const beforeM = currentDate.getMonth();
            if(pickerView!=='calendar'){
                if(pickerView==='months'){ currentDate.setFullYear(currentDate.getFullYear()-1); buildMonthPicker(); }
                else { currentDate.setFullYear(currentDate.getFullYear()-12); buildYearPicker(); }
                return;
            }
            if(calendarViewMode==='month'){
                currentDate.setMonth(currentDate.getMonth()-1);
                generateMonthView();
                syncMonthSelector();
            } else if(calendarViewMode==='week'){
                currentDate.setDate(currentDate.getDate()-7);
                const afterM = currentDate.getMonth();
                generateWeekView();
                if(afterM!==beforeM) syncMonthSelector();
            } else { // day
                currentDate.setDate(currentDate.getDate()-1);
                const afterM = currentDate.getMonth();
                generateDayView();
                if(afterM!==beforeM) syncMonthSelector();
            }
        }
        function navNext(){
            const beforeM = currentDate.getMonth();
            if(pickerView!=='calendar'){
                if(pickerView==='months'){ currentDate.setFullYear(currentDate.getFullYear()+1); buildMonthPicker(); }
                else { currentDate.setFullYear(currentDate.getFullYear()+12); buildYearPicker(); }
                return;
            }
            if(calendarViewMode==='month'){
                currentDate.setMonth(currentDate.getMonth()+1);
                generateMonthView();
                syncMonthSelector();
            } else if(calendarViewMode==='week'){
                currentDate.setDate(currentDate.getDate()+7);
                const afterM = currentDate.getMonth();
                generateWeekView();
                if(afterM!==beforeM) syncMonthSelector();
            } else { // day
                currentDate.setDate(currentDate.getDate()+1);
                const afterM = currentDate.getMonth();
                generateDayView();
                if(afterM!==beforeM) syncMonthSelector();
            }
        }
    function goToday(){ currentDate = new Date(); if(pickerView!=='calendar') showCalendarView(); refreshActiveCalendarMode(); syncMonthSelector(); }
    function syncMonthSelector(){ if(!els.monthSelector) return; const today=new Date(); if(currentDate.getMonth()===today.getMonth() && currentDate.getFullYear()===today.getFullYear()) els.monthSelector.value='current'; else els.monthSelector.value=String(currentDate.getMonth()); renderMonthlyTodo(); }

  /* ================= SWIPE & GESTURE NAVIGATION ================= */
  let swipeStartX=0, swipeStartY=0; const MIN=50, MAXY=120; let swipeLock=false;
  let isMouseDown=false, mouseStartX=0, isDragging=false;

  function swipeStart(x,y){ swipeStartX=x; swipeStartY=y; }
  function swipeEnd(x,y){ 
    if(swipeLock) return; 
    const dx=x-swipeStartX; 
    const dy=Math.abs(y-swipeStartY); 
    if(Math.abs(dx)>MIN && dy<MAXY){ 
      swipeLock=true; 
      if(dx>0) navPrev(); else navNext(); 
      setTimeout(()=>swipeLock=false,300);
    } 
  }

  function setupComprehensiveSwipeGestures() {
    const container = els.grid?.parentElement || document.querySelector('.calendar-container');
    if (!container) return;

    // === TOUCH EVENTS ===
    container.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      swipeStart(touch.clientX, touch.clientY);
    }, {passive: true});

    container.addEventListener('touchend', e => {
      const touch = e.changedTouches[0];
      swipeEnd(touch.clientX, touch.clientY);
    }, {passive: true});

    // === MOUSE DRAG EVENTS ===
    container.addEventListener('mousedown', e => {
      isMouseDown = true;
      isDragging = false;
      mouseStartX = e.clientX;
      container.classList.add('grabbing', 'no-select');
      e.preventDefault();
    });

    container.addEventListener('mousemove', e => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - mouseStartX;
      if (Math.abs(deltaX) > 10) {
        isDragging = true;
      }
      e.preventDefault();
    });

    container.addEventListener('mouseup', e => {
      if (!isMouseDown) return;
      isMouseDown = false;
      container.classList.remove('grabbing', 'no-select');
      
      if (isDragging) {
        const deltaX = e.clientX - mouseStartX;
        if (Math.abs(deltaX) > MIN) {
          if (!swipeLock) {
            swipeLock = true;
            if (deltaX > 0) navPrev(); else navNext();
            setTimeout(() => swipeLock = false, 300);
          }
        }
      }
      isDragging = false;
    });

    container.addEventListener('mouseleave', () => {
      if (isMouseDown) {
        isMouseDown = false;
        isDragging = false;
        container.classList.remove('grabbing', 'no-select');
      }
    });

    // === WHEEL/TRACKPAD EVENTS ===
    container.addEventListener('wheel', e => {
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = isHorizontalScroll ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      
      if (Math.abs(delta) > 20 && !swipeLock) {
        e.preventDefault();
        swipeLock = true;
        if (delta > 0) navNext(); else navPrev();
        setTimeout(() => swipeLock = false, 400);
      }
    }, {passive: false});

    // === KEYBOARD SHORTCUTS ===
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      
      // Navigation shortcuts
      if (key === 'arrowleft' || key === 'h') {
        e.preventDefault();
        navPrev();
      } else if (key === 'arrowright' || key === 'l') {
        e.preventDefault();
        navNext();
      } else if (key === 't') {
        e.preventDefault();
        goToday();
      }
      
      // View mode shortcuts
      if (key === 'm') {
        calendarViewMode = 'month';
        refreshActiveCalendarMode();
        updateViewButtons();
      } else if (key === 'w') {
        calendarViewMode = 'week';
        refreshActiveCalendarMode();
        updateViewButtons();
      } else if (key === 'd' && !e.ctrlKey) {
        calendarViewMode = 'day';
        refreshActiveCalendarMode();
        updateViewButtons();
      }
    });
  }

  function updateViewButtons() {
    els.viewButtons?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === calendarViewMode);
    });
  }

  function attachSwipe(el){ 
    if(!el) return; 
    // Basic fallback for individual elements
    el.addEventListener('touchstart',e=>{const t=e.touches[0]; swipeStart(t.clientX,t.clientY);},{passive:true}); 
    el.addEventListener('touchend',e=>{const t=e.changedTouches[0]; swipeEnd(t.clientX,t.clientY);},{passive:true}); 
  }    /* ================= EVENT LISTENERS ================= */
    els.addMonthlyTaskBtn?.addEventListener('click', addMonthlyTask);
    els.monthlyTaskInput?.addEventListener('keypress', e=>{ if(e.key==='Enter') addMonthlyTask(); });
    els.monthSelector?.addEventListener('change', ()=>renderMonthlyTodo());
    els.prevMonth?.addEventListener('click', navPrev);
    els.nextMonth?.addEventListener('click', navNext);
    els.todayBtn?.addEventListener('click', goToday);
    els.refreshEvents?.addEventListener('click', ()=>{ if(window.CalendarService) CalendarService._cache={rangeKey:null,events:[]}; refreshActiveCalendarMode(); NotificationService?.show?.('Calendar refreshed','info'); });
    els.currentMonthEl?.addEventListener('click', ()=>{ if(pickerView==='calendar') showMonthPicker(); else if(pickerView==='months') showYearPicker(); else showCalendarView(); });
    els.monthPickerYear?.addEventListener('click', showYearPicker);
    els.viewButtons?.forEach(btn=> btn.addEventListener('click', ()=>{ calendarViewMode=btn.dataset.view; els.viewButtons.forEach(b=>b.classList.toggle('active', b===btn)); showCalendarView(); }));

    document.addEventListener('data-imported', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });
    document.addEventListener('data-cleared', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });
    document.addEventListener('google-drive-data-loaded', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });

  // Swipe attach
  setupComprehensiveSwipeGestures();
  [els.grid, els.monthPicker, els.yearPicker].forEach(attachSwipe);    /* ================= INIT ================= */
    function initialRender(){ if(!calendarInitialized){ calendarInitialized=true; generateMonthView(); syncMonthSelector(); } renderMonthlyTodo(); }
    function showMonthPicker(){ pickerView='months'; toggleViews(); buildMonthPicker(); }
    function showYearPicker(){ pickerView='years'; toggleViews(); buildYearPicker(); }
    function showCalendarView(){ pickerView='calendar'; toggleViews(); refreshActiveCalendarMode(); }

    initialRender();
});
