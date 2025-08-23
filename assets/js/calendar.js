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
        calendarIntegrationBtn: document.getElementById('calendarIntegrationBtn'),
        todayBtn: document.getElementById('todayBtn'),
        currentMonthEl: document.getElementById('currentMonth'),
        grid: document.getElementById('calendar-grid'),
        monthPicker: document.getElementById('monthPicker'),
        yearPicker: document.getElementById('yearPicker'),
        monthPickerYear: document.getElementById('monthPickerYear'),
        monthIndicator: document.getElementById('currentMonthIndicator'),
        // Day modal elements
        dayDetailModal: document.getElementById('dayDetailModal'),
        closeDayModal: document.getElementById('closeDayModal'),
        dayModalDate: document.getElementById('dayModalDate'),
        dayModalInfo: document.getElementById('dayModalInfo'),
        dayTaskInput: document.getElementById('dayTaskInput'),
        addDayTaskBtn: document.getElementById('addDayTaskBtn'),
        dayTaskCount: document.getElementById('dayTaskCount'),
        dayEventCount: document.getElementById('dayEventCount'),
        dayTasksList: document.getElementById('dayTasksList'),
        dayEventsList: document.getElementById('dayEventsList')
    };

    // --- State ---
    let currentDate = new Date();
    let calendarInitialized = false;
    let selectedDate = null; // For day modal
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
            
            // Add click handler for day modal
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => openDayModal(new Date(year, month, d)));
            
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
        els.grid.style.display = isCal ? 'grid' : 'none';
        els.monthPicker?.classList.toggle('hidden', pickerView!=='months');
        els.yearPicker?.classList.toggle('hidden', pickerView!=='years');
    }
    function refreshActiveCalendarMode(){
        generateMonthView();
        updateCalendarTitle();
    }
    function updateCalendarTitle(){ 
        if(!els.currentMonthEl) return; 
        els.currentMonthEl.textContent=`${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`; 
    }

    /* ================= NAVIGATION ================= */
        function navPrev(){
            if(pickerView!=='calendar'){
                if(pickerView==='months'){ currentDate.setFullYear(currentDate.getFullYear()-1); buildMonthPicker(); }
                else { currentDate.setFullYear(currentDate.getFullYear()-12); buildYearPicker(); }
                return;
            }
            currentDate.setMonth(currentDate.getMonth()-1);
            generateMonthView();
            syncMonthSelector();
        }
        function navNext(){
            if(pickerView!=='calendar'){
                if(pickerView==='months'){ currentDate.setFullYear(currentDate.getFullYear()+1); buildMonthPicker(); }
                else { currentDate.setFullYear(currentDate.getFullYear()+12); buildYearPicker(); }
                return;
            }
            currentDate.setMonth(currentDate.getMonth()+1);
            generateMonthView();
            syncMonthSelector();
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
      
      // View mode shortcuts removed - only month view is available
    });
  }

  function attachSwipe(el){ 
    if(!el) return; 
    // Basic fallback for individual elements
    el.addEventListener('touchstart',e=>{const t=e.touches[0]; swipeStart(t.clientX,t.clientY);},{passive:true}); 
    el.addEventListener('touchend',e=>{const t=e.changedTouches[0]; swipeEnd(t.clientX,t.clientY);},{passive:true}); 
  }

    /* ================= DAY MODAL FUNCTIONS ================= */
    function openDayModal(date) {
        if (!els.dayDetailModal) return;
        
        selectedDate = new Date(date);
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        
        // Update modal title
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        els.dayModalDate.textContent = selectedDate.toLocaleDateString('en-US', options);
        
        // Update day info
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
        const compareDate = new Date(selectedDate);
        compareDate.setHours(0, 0, 0, 0);
        
        const diffTime = compareDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        let dayInfo = '';
        if (diffDays === 0) dayInfo = 'Today';
        else if (diffDays === 1) dayInfo = 'Tomorrow';
        else if (diffDays === -1) dayInfo = 'Yesterday';
        else if (diffDays > 0) dayInfo = `${diffDays} days away`;
        else dayInfo = `${Math.abs(diffDays)} days ago`;
        
        els.dayModalInfo.textContent = dayInfo;
        
        // Clear input and reset dropdowns
        if (els.dayTaskInput) els.dayTaskInput.value = '';
        const dayTaskType = document.getElementById('dayTaskType');
        const dayTaskPriority = document.getElementById('dayTaskPriority');
        if (dayTaskType) dayTaskType.value = 'general';
        if (dayTaskPriority) dayTaskPriority.value = 'normal';
        
        // Load tasks and events for this day
        loadDayContent(dateKey);
        
        // Prevent background scroll
        document.body.classList.add('modal-open');
        
        // Show modal
        els.dayDetailModal.classList.remove('hidden');
        
        // Focus on input
        setTimeout(() => els.dayTaskInput?.focus(), 100);
    }
    
    function closeDayModal() {
        if (!els.dayDetailModal) return;
        els.dayDetailModal.classList.add('hidden');
        selectedDate = null;
        
        // Restore background scroll
        document.body.classList.remove('modal-open');
    }
    
    function loadDayContent(dateKey) {
        // Load tasks
        const tasks = window.StorageService ? (StorageService.getDailyTasks(dateKey) || []) : [];
        updateDayTasksList(tasks);
        
        // Load events (calendar events, holidays, etc.)
        loadDayEvents(dateKey);
    }
    
    function updateDayTasksList(tasks) {
        if (!els.dayTasksList || !els.dayTaskCount) return;
        
        els.dayTaskCount.textContent = tasks.length;
        
        if (tasks.length === 0) {
            els.dayTasksList.innerHTML = '<div class="day-empty">No tasks for this day</div>';
            return;
        }
        
        els.dayTasksList.innerHTML = '';
        tasks.forEach((task, index) => {
            const taskEl = document.createElement('div');
            taskEl.className = 'day-task-item';
            taskEl.innerHTML = `
                <input type="checkbox" class="day-task-checkbox" ${task.done ? 'checked' : ''}>
                <span class="day-task-text ${task.done ? 'completed' : ''}">${task.text}</span>
                <span class="day-task-meta">
                    <span class="day-task-type" title="Type">${task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : 'General'}</span>
                    <span class="day-task-priority" title="Priority">${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal'}</span>
                </span>
                <button class="day-task-delete" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            // Add event listeners
            const checkbox = taskEl.querySelector('.day-task-checkbox');
            const deleteBtn = taskEl.querySelector('.day-task-delete');
            checkbox.addEventListener('change', () => toggleDayTask(index));
            deleteBtn.addEventListener('click', () => deleteDayTask(index));
            els.dayTasksList.appendChild(taskEl);
        });
    }
    
    async function loadDayEvents(dateKey) {
        if (!els.dayEventsList || !els.dayEventCount) return;
        
        let events = [];
        
        // Load external calendar events
        if (window.CONFIG?.APP?.SHOW_GCAL_EVENTS && window.CalendarService && window.FirebaseService?.user) {
            try {
                const startDate = new Date(selectedDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(selectedDate);
                endDate.setHours(23, 59, 59, 999);
                
                const calEvents = await CalendarService.fetchEvents(startDate.toISOString(), endDate.toISOString()) || [];
                events.push(...calEvents);
            } catch (error) {
                console.log('Error loading calendar events:', error);
            }
        }
        
        // Load holidays
        if (window.HolidayService) {
            const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
            const holidays = HolidayService.getEventsForDate(dateKey) || [];
            events.push(...holidays);
        }
        
        updateDayEventsList(events);
    }
    
    function updateDayEventsList(events) {
        if (!els.dayEventsList || !els.dayEventCount) return;
        
        els.dayEventCount.textContent = events.length;
        
        if (events.length === 0) {
            els.dayEventsList.innerHTML = '<div class="day-empty">No events for this day</div>';
            return;
        }
        
        els.dayEventsList.innerHTML = '';
        events.forEach(event => {
            const eventEl = document.createElement('div');
            let className = 'day-event-item';
            
            if (event.type === 'holiday') className += ' holiday';
            else if (event.type === 'poya') className += ' poya';
            else if (event.isRecurring) className += ' recurring';
            
            eventEl.className = className;
            eventEl.textContent = event.title || event.summary || '(No title)';
            
            els.dayEventsList.appendChild(eventEl);
        });
    }
    
    function addDayTask() {
        if (!els.dayTaskInput || !selectedDate || !window.StorageService) return;
        const text = els.dayTaskInput.value.trim();
        if (!text) return;
        const type = document.getElementById('dayTaskType')?.value || 'general';
        const priority = document.getElementById('dayTaskPriority')?.value || 'normal';
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        const task = {
            text,
            done: false,
            type,
            priority,
            category: type,
            createdAt: new Date().toISOString()
        };
        
        StorageService.addDailyTask(dateKey, task);
        els.dayTaskInput.value = '';
        
        // Optionally create Google Calendar event
        if (window.CONFIG?.APP?.AUTO_CREATE_CAL_EVENTS && 
            window.CalendarService && 
            window.FirebaseService?.googleAccessToken) {
            
            // Create calendar event for the selected date
            const eventTask = {
                text: task.text,
                date: selectedDate
            };
            
            window.CalendarService.createEventForTask(eventTask).then(event => {
                if (event) {
                    window.NotificationService?.show?.('✅ Task added to Google Calendar', 'success');
                    // Refresh calendar to show the new event
                    window.CalendarService._cache = { rangeKey: null, events: [] };
                    refreshActiveCalendarMode();
                }
            }).catch(error => {
                console.log('Calendar event creation failed:', error);
            });
        }
        
        // Refresh the day content
        loadDayContent(dateKey);
        
        // Refresh the calendar view to show the new task
        refreshActiveCalendarMode();
    }
    
    function toggleDayTask(index) {
        if (!selectedDate || !window.StorageService) return;
        
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        StorageService.toggleDailyTask(dateKey, index);
        
        // Refresh the day content
        loadDayContent(dateKey);
        
        // Refresh the calendar view
        refreshActiveCalendarMode();
    }
    
    function deleteDayTask(index) {
        if (!selectedDate || !window.StorageService) return;
        
        const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        StorageService.deleteDailyTask(dateKey, index);
        
        // Refresh the day content
        loadDayContent(dateKey);
        
        // Refresh the calendar view
        refreshActiveCalendarMode();
    }

    /* ================= CALENDAR INTEGRATION ================= */
    function updateCalendarIntegrationStatus() {
        if (!els.calendarIntegrationBtn) return;
        
        const isSignedIn = window.FirebaseService?.user;
        const hasCalendarAccess = window.FirebaseService?.googleAccessToken || localStorage.getItem('googleAccessToken');
        
        if (!isSignedIn) {
            els.calendarIntegrationBtn.style.display = 'none';
            return;
        }
        
        els.calendarIntegrationBtn.style.display = 'flex';
        
        if (hasCalendarAccess) {
            els.calendarIntegrationBtn.classList.add('connected');
            els.calendarIntegrationBtn.title = 'Google Calendar Connected';
            els.calendarIntegrationBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>Connected</span>';
        } else {
            els.calendarIntegrationBtn.classList.remove('connected');
            els.calendarIntegrationBtn.title = 'Connect Google Calendar';
            els.calendarIntegrationBtn.innerHTML = '<i class="fab fa-google"></i><span>Calendar</span>';
        }
    }
    
    async function handleCalendarIntegration() {
        if (!window.FirebaseService?.user) {
            // Redirect to home page for sign-in instead of showing separate calendar auth
            window.NotificationService?.show?.('Please sign in to connect Google Calendar', 'warning');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        // Check if calendar access is already available
        if (window.FirebaseService.googleAccessToken) {
            window.NotificationService?.show?.('Google Calendar is already connected!', 'info');
            return;
        }
        
        // Show message that calendar access needs to be re-authorized
        window.NotificationService?.show?.('Calendar access needs authorization. Please sign in again to grant calendar permissions.', 'warning');
        
        // Redirect to home page for re-authentication with calendar scope
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }

    /* ================= EVENT LISTENERS ================= */
    els.addMonthlyTaskBtn?.addEventListener('click', addMonthlyTask);
    els.monthlyTaskInput?.addEventListener('keypress', e=>{ if(e.key==='Enter') addMonthlyTask(); });
    els.monthSelector?.addEventListener('change', ()=>renderMonthlyTodo());
    els.prevMonth?.addEventListener('click', navPrev);
    els.nextMonth?.addEventListener('click', navNext);
    els.todayBtn?.addEventListener('click', goToday);
    els.refreshEvents?.addEventListener('click', ()=>{ if(window.CalendarService) CalendarService._cache={rangeKey:null,events:[]}; refreshActiveCalendarMode(); NotificationService?.show?.('Calendar refreshed','info'); });
    els.calendarIntegrationBtn?.addEventListener('click', handleCalendarIntegration);
    els.currentMonthEl?.addEventListener('click', ()=>{ if(pickerView==='calendar') showMonthPicker(); else if(pickerView==='months') showYearPicker(); else showCalendarView(); });
    els.monthPickerYear?.addEventListener('click', showYearPicker);
    
    // Day modal event listeners
    els.closeDayModal?.addEventListener('click', closeDayModal);
    els.addDayTaskBtn?.addEventListener('click', addDayTask);
    els.dayTaskInput?.addEventListener('keypress', e => { if(e.key === 'Enter') addDayTask(); });
    
    // Close modal when clicking outside
    els.dayDetailModal?.addEventListener('click', (e) => {
        if (e.target === els.dayDetailModal) closeDayModal();
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !els.dayDetailModal?.classList.contains('hidden')) {
            closeDayModal();
        }
    });
    
    // View button event listeners removed - only month view is available

    document.addEventListener('data-imported', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });
    document.addEventListener('data-cleared', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });
    document.addEventListener('google-drive-data-loaded', ()=>{ renderMonthlyTodo(); refreshActiveCalendarMode(); });
    document.addEventListener('firebase-auth-ready', ()=>{ updateCalendarIntegrationStatus(); });
    
    // Update calendar integration status when auth state changes
    if (window.FirebaseService) {
        const originalOnAuthStateChanged = window.FirebaseService.auth?.onAuthStateChanged;
        if (originalOnAuthStateChanged) {
            window.FirebaseService.auth.onAuthStateChanged((user) => {
                updateCalendarIntegrationStatus();
            });
        }
    }

  // Swipe attach
  setupComprehensiveSwipeGestures();
  [els.grid, els.monthPicker, els.yearPicker].forEach(attachSwipe);    /* ================= INIT ================= */
    function initialRender(){ 
        if(!calendarInitialized){ 
            calendarInitialized=true; 
            
            // Restore access token from localStorage if available
            const accessToken = localStorage.getItem('googleAccessToken');
            if (accessToken && window.FirebaseService && !window.FirebaseService.googleAccessToken) {
                window.FirebaseService.googleAccessToken = accessToken;
                console.log('Restored Google access token from localStorage');
            }
            
            generateMonthView(); 
            syncMonthSelector(); 
        } 
        renderMonthlyTodo(); 
        updateCalendarIntegrationStatus(); // Check calendar integration status
    }
    function showMonthPicker(){ pickerView='months'; toggleViews(); buildMonthPicker(); }
    function showYearPicker(){ pickerView='years'; toggleViews(); buildYearPicker(); }
    function showCalendarView(){ pickerView='calendar'; toggleViews(); refreshActiveCalendarMode(); }

    initialRender();
});
