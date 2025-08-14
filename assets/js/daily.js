document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const progressPercentEl = document.getElementById('progressPercent');
    
    // New overview panel elements
    const mainTotalTasksEl = document.getElementById('mainTotalTasks');
    const mainPendingTasksEl = document.getElementById('mainPendingTasks');
    const mainCompletedTasksEl = document.getElementById('mainCompletedTasks');
    const mainProgressRateEl = document.getElementById('mainProgressRate');
    const progressFillEl = document.getElementById('progressFill');
    const progressTextEl = document.getElementById('progressText');
    const todayTaskCountEl = document.getElementById('todayTaskCount');
    const completionRateEl = document.getElementById('completionRate');
    
    // Mini stats elements
    const miniProgressTextEl = document.getElementById('miniProgressText');
    const miniTodayTaskCountEl = document.getElementById('miniTodayTaskCount');
    const miniCompletionRateEl = document.getElementById('miniCompletionRate');
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    const currentDateEl = document.getElementById('current-date');

    let currentCategory = 'all';

    function getTodayDateString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    function handleAddTask() {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const today = getTodayDateString();
            const category = currentCategory === 'all' ? 'personal' : currentCategory;
            StorageService.addDailyTask(today, { text: taskText, category });
            // Auto calendar event creation if enabled
            if (CONFIG.APP.AUTO_CREATE_CAL_EVENTS && window.CalendarService && FirebaseService?.user) {
                try {
                    const tasks = StorageService.getDailyTasks(today);
                    const newTaskIndex = tasks.length - 1;
                    const newTask = tasks[newTaskIndex];
                    CalendarService.createEventForTask(newTask).then(ev => {
                        if (ev && ev.id) {
                            const data = StorageService.getAllData();
                            data.dailyTasks[today][newTaskIndex].calendarEventId = ev.id;
                            StorageService.setAllData(data);
                            NotificationService.show('📅 Event created automatically', 'success');
                        }
                    }).catch(()=>{});
                } catch(e) { /* silent */ }
            }
            taskInput.value = '';
            renderTasks();
        }
    }

    function handleToggleTask(date, index) {
        StorageService.toggleDailyTask(date, index);
        renderTasks();
    }

    function handleDeleteTask(date, index) {
        StorageService.deleteDailyTask(date, index);
        renderTasks();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        const today = getTodayDateString();
        const tasksForToday = StorageService.getDailyTasks(today);

        const filteredTasks = tasksForToday.filter(task => currentCategory === 'all' || task.category === currentCategory);

        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-8 text-gray-500';
            emptyState.innerHTML = '<p>No tasks for today. Add one to get started!</p>';
            taskList.appendChild(emptyState);
        } else {
            filteredTasks.forEach((task, index) => {
                // Find the original index in the unfiltered list to pass to the handler
                const originalIndex = tasksForToday.findIndex(t => t === task);

                const taskItem = document.createElement('div');
                taskItem.className = `task-item category-${task.category}`;
                taskItem.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}>
                    <div class="task-text ${task.done ? 'completed' : ''}">${task.text}</div>
                    <div class="task-date">Today</div>
                    <button class="task-calendar" title="Add to Google Calendar">📅</button>
                    <button class="task-delete" title="Delete"><i class="fas fa-trash"></i></button>
                `;
                taskItem.querySelector('.task-checkbox').addEventListener('change', () => handleToggleTask(today, originalIndex));
                taskItem.querySelector('.task-delete').addEventListener('click', () => handleDeleteTask(today, originalIndex));
                taskItem.querySelector('.task-calendar').addEventListener('click', async () => {
                    try {
                        const fullTasks = StorageService.getDailyTasks(today);
                        const t = fullTasks[originalIndex];
                        const event = await CalendarService.createEventForTask(t);
                        if (event && event.id) {
                            t.calendarEventId = event.id;
                            // Persist
                            const data = StorageService.getAllData();
                            data.dailyTasks[today][originalIndex] = t;
                            StorageService.setAllData(data);
                            NotificationService.show('✅ Task added to Calendar', 'success');
                        }
                    } catch(e){
                        console.error(e);
                        NotificationService.show('❌ Could not create calendar event', 'error');
                    }
                });
                taskList.appendChild(taskItem);
            });
        }
        updateTaskStats();
    }

    function updateTaskStats() {
        const today = getTodayDateString();
        const tasksForToday = StorageService.getDailyTasks(today);
        const totalTasks = tasksForToday.length;
        const completedTasks = tasksForToday.filter(task => task.done).length;
        const pendingTasks = totalTasks - completedTasks;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Update old stats if they exist
        if (totalTasksEl) totalTasksEl.textContent = totalTasks;
        if (completedTasksEl) completedTasksEl.textContent = completedTasks;
        if (progressPercentEl) progressPercentEl.textContent = `${progress}%`;

        // Update new overview panel stats
        if (mainTotalTasksEl) mainTotalTasksEl.textContent = totalTasks;
        if (mainPendingTasksEl) mainPendingTasksEl.textContent = pendingTasks;
        if (mainCompletedTasksEl) mainCompletedTasksEl.textContent = completedTasks;
        if (mainProgressRateEl) mainProgressRateEl.textContent = `${progress}%`;
        
        // Update progress bar
        if (progressFillEl) {
            progressFillEl.style.width = `${progress}%`;
        }
        if (progressTextEl) {
            progressTextEl.textContent = `${progress}% Complete`;
        }
        
        // Update quick stats
        if (todayTaskCountEl) todayTaskCountEl.textContent = totalTasks;
        if (completionRateEl) completionRateEl.textContent = `${progress}%`;
        
        // Update mini stats at top
        if (miniProgressTextEl) miniProgressTextEl.textContent = `${progress}% Complete`;
        if (miniTodayTaskCountEl) miniTodayTaskCountEl.textContent = totalTasks;
        if (miniCompletionRateEl) miniCompletionRateEl.textContent = `${progress}%`;
        
        // Add some visual feedback for completed tasks
        updateProgressAnimation(progress);
    }

    function updateProgressAnimation(progress) {
        if (progressFillEl) {
            // Add completion celebration effect
            if (progress === 100 && progressFillEl.style.width !== '100%') {
                progressFillEl.classList.add('completed');
                setTimeout(() => {
                    progressFillEl.classList.remove('completed');
                }, 1000);
            }
        }
    }

    function setCategory(category) {
        currentCategory = category;
        categoryBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        renderTasks();
    }

    function renderAll() {
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        renderTasks();
    }

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => setCategory(btn.dataset.category));
    });

    // Listen for global data changes
    document.addEventListener('data-imported', renderAll);
    document.addEventListener('data-cleared', renderAll);
    document.addEventListener('google-drive-data-loaded', renderAll);

    // Initial render
    renderAll();
});
