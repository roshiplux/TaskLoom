document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const progressPercentEl = document.getElementById('progressPercent');
    
    // Date navigation elements
    const prevDateBtn = document.getElementById('prevDateBtn');
    const nextDateBtn = document.getElementById('nextDateBtn');
    const todayBtn = document.getElementById('todayBtn');
    const currentDayName = document.getElementById('currentDayName');
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    
    // New task modal elements
    const newTaskBtn = document.getElementById('newTaskBtn');
    const taskModal = document.getElementById('taskManagementModal');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const cancelTaskModal = document.getElementById('cancelTaskModal');
    const taskForm = document.getElementById('taskForm');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    const taskModalTitle = document.getElementById('taskModalTitle');
    
    // Modal form elements
    const modalTaskText = document.getElementById('modalTaskText');
    const modalTaskDate = document.getElementById('modalTaskDate');
    const modalTaskPriority = document.getElementById('modalTaskPriority');
    const modalTaskCategory = document.getElementById('modalTaskCategory');
    const modalTaskTime = document.getElementById('modalTaskTime');
    const modalTaskNotes = document.getElementById('modalTaskNotes');
    const modalCreateCalendarEvent = document.getElementById('modalCreateCalendarEvent');
    const modalSetReminder = document.getElementById('modalSetReminder');
    
    // Task management state
    let currentEditingTask = null;
    let isEditMode = false;
    let currentViewDate = new Date(); // Date currently being viewed
    
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

    // Date Navigation Functions
    function updateDateDisplay() {
        console.log('Updating date display for:', currentViewDate);
        
        // Get elements fresh each time to avoid stale references
        const currentDayNameEl = document.getElementById('currentDayName');
        const currentDateDisplayEl = document.getElementById('currentDateDisplay');
        
        if (!currentDayNameEl || !currentDateDisplayEl) {
            console.error('Date display elements not found');
            console.log('currentDayNameEl:', currentDayNameEl);
            console.log('currentDateDisplayEl:', currentDateDisplayEl);
            return;
        }
        
        // Ensure currentViewDate is valid
        if (!currentViewDate || isNaN(currentViewDate.getTime())) {
            console.error('Invalid currentViewDate, resetting to today');
            currentViewDate = new Date();
        }
        
        const today = new Date();
        const isToday = currentViewDate.toDateString() === today.toDateString();
        const isYesterday = currentViewDate.toDateString() === new Date(today.getTime() - 86400000).toDateString();
        const isTomorrow = currentViewDate.toDateString() === new Date(today.getTime() + 86400000).toDateString();
        
        // Update day name
        let dayText = '';
        if (isToday) {
            dayText = 'Today';
        } else if (isYesterday) {
            dayText = 'Yesterday';
        } else if (isTomorrow) {
            dayText = 'Tomorrow';
        } else {
            dayText = currentViewDate.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        // Update date display
        const dateText = currentViewDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        // Set the text content
        currentDayNameEl.textContent = dayText;
        currentDateDisplayEl.textContent = dateText;
        
        console.log('Date display updated:', dayText, dateText);
    }
    
    function goToPreviousDate() {
        currentViewDate.setDate(currentViewDate.getDate() - 1);
        console.log('Previous date:', currentViewDate);
        updateDateDisplay();
        renderTasks();
        renderMainTasksList();
    }
    
    function goToNextDate() {
        currentViewDate.setDate(currentViewDate.getDate() + 1);
        console.log('Next date:', currentViewDate);
        updateDateDisplay();
        renderTasks();
        renderMainTasksList();
    }
    
    function goToToday() {
        currentViewDate = new Date();
        console.log('Today date:', currentViewDate);
        updateDateDisplay();
        renderTasks();
        renderMainTasksList();
    }
    
    function getCurrentViewDateString() {
        return `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(currentViewDate.getDate()).padStart(2, '0')}`;
    }

    // Modal Management Functions
    function openTaskModal(mode = 'add', taskData = null) {
        isEditMode = mode === 'edit';
        currentEditingTask = taskData;
        
        // Update modal title
        taskModalTitle.textContent = isEditMode ? '✏️ Edit Task' : '📝 Add New Task';
        
        // Reset form
        taskForm.reset();
        
        // Set current view date as default date
        const viewDate = getCurrentViewDateString();
        modalTaskDate.value = viewDate;
        
        if (isEditMode && taskData) {
            // Populate form with existing task data
            modalTaskText.value = taskData.text || '';
            modalTaskDate.value = taskData.date || viewDate;
            modalTaskPriority.value = taskData.priority || 'medium';
            modalTaskCategory.value = taskData.category || 'personal';
            modalTaskTime.value = taskData.time || '';
            modalTaskNotes.value = taskData.notes || '';
            modalCreateCalendarEvent.checked = !!taskData.createCalendarEvent;
            modalSetReminder.checked = !!taskData.setReminder;
        }
        
        // Prevent background scroll
        document.body.classList.add('modal-open');
        
        // Show modal
        taskModal.classList.remove('hidden');
        
        // Focus on task text input
        setTimeout(() => modalTaskText.focus(), 100);
    }
    
    function closeTaskModalHandler() {
        taskModal.classList.add('hidden');
        currentEditingTask = null;
        isEditMode = false;
        taskForm.reset();
        
        // Restore background scroll
        document.body.classList.remove('modal-open');
    }
    
    function saveTaskHandler(e) {
        e.preventDefault();
        
        const taskText = modalTaskText.value.trim();
        if (!taskText) {
            modalTaskText.focus();
            return;
        }
        
        const taskData = {
            text: taskText,
            date: modalTaskDate.value || getTodayDateString(),
            priority: modalTaskPriority.value,
            category: modalTaskCategory.value,
            time: modalTaskTime.value,
            notes: modalTaskNotes.value,
            createCalendarEvent: modalCreateCalendarEvent.checked,
            setReminder: modalSetReminder.checked,
            done: isEditMode ? (currentEditingTask?.done || false) : false,
            createdAt: isEditMode ? (currentEditingTask?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (isEditMode && currentEditingTask) {
            // Update existing task
            updateTask(currentEditingTask.date, currentEditingTask.index, taskData);
        } else {
            // Add new task
            addNewTask(taskData);
        }
        
        closeTaskModalHandler();
    }
    
    function addNewTask(taskData) {
        const taskDate = taskData.date;
        StorageService.addDailyTask(taskDate, taskData);
        
        // Auto calendar event creation if enabled
        if (taskData.createCalendarEvent && CONFIG.APP.AUTO_CREATE_CAL_EVENTS && window.CalendarService && FirebaseService?.user) {
            try {
                const tasks = StorageService.getDailyTasks(taskDate);
                const newTaskIndex = tasks.length - 1;
                const newTask = tasks[newTaskIndex];
                CalendarService.createEventForTask(newTask).then(ev => {
                    if (ev && ev.id) {
                        const data = StorageService.getAllData();
                        data.dailyTasks[taskDate][newTaskIndex].calendarEventId = ev.id;
                        StorageService.setAllData(data);
                        NotificationService.show('📅 Task and calendar event created', 'success');
                    }
                }).catch(() => {
                    NotificationService.show('✅ Task created (calendar event failed)', 'warning');
                });
            } catch(e) {
                NotificationService.show('✅ Task created', 'success');
            }
        } else {
            NotificationService.show('✅ Task created successfully', 'success');
        }
        
        renderTasks();
        renderMainTasksList();
    }
    
    function updateTask(date, index, newTaskData) {
        const tasks = StorageService.getDailyTasks(date);
        if (tasks[index]) {
            // Preserve some original properties
            newTaskData.calendarEventId = tasks[index].calendarEventId;
            tasks[index] = newTaskData;
            
            const allData = StorageService.getAllData();
            allData.dailyTasks[date] = tasks;
            StorageService.setAllData(allData);
            
            NotificationService.show('✅ Task updated successfully', 'success');
            renderTasks();
            renderMainTasksList();
        }
    }
    
    function editTask(date, index) {
        const tasks = StorageService.getDailyTasks(date);
        if (tasks[index]) {
            const taskData = {
                ...tasks[index],
                date: date,
                index: index
            };
            openTaskModal('edit', taskData);
        }
    }

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
        const viewDate = getCurrentViewDateString();
        const tasksForDate = StorageService.getDailyTasks(viewDate);

        const filteredTasks = tasksForDate.filter(task => currentCategory === 'all' || task.category === currentCategory);

        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center py-8 text-gray-500';
            
            const today = new Date();
            const isToday = currentViewDate.toDateString() === today.toDateString();
            const dateLabel = isToday ? 'today' : 'this date';
            
            emptyState.innerHTML = `<p>No tasks for ${dateLabel}. Add one to get started!</p>`;
            taskList.appendChild(emptyState);
        } else {
            filteredTasks.forEach((task, index) => {
                // Find the original index in the unfiltered list to pass to the handler
                const originalIndex = tasksForDate.findIndex(t => t === task);

                const taskItem = document.createElement('div');
                taskItem.className = `task-item category-${task.category}`;
                
                const today = new Date();
                const isToday = currentViewDate.toDateString() === today.toDateString();
                const dateLabel = isToday ? 'Today' : currentViewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                taskItem.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''}>
                    <div class="task-text ${task.done ? 'completed' : ''}">${task.text}</div>
                    <div class="task-date">${dateLabel}</div>
                    <div class="task-actions">
                        <button class="task-edit" title="Edit task"><i class="fas fa-edit"></i></button>
                        <button class="task-calendar" title="Add to Google Calendar">📅</button>
                        <button class="task-delete" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                taskItem.querySelector('.task-checkbox').addEventListener('change', () => handleToggleTask(viewDate, originalIndex));
                taskItem.querySelector('.task-edit').addEventListener('click', () => editTask(viewDate, originalIndex));
                taskItem.querySelector('.task-delete').addEventListener('click', () => handleDeleteTask(viewDate, originalIndex));
                taskItem.querySelector('.task-calendar').addEventListener('click', async () => {
                    try {
                        const fullTasks = StorageService.getDailyTasks(viewDate);
                        const t = fullTasks[originalIndex];
                        const event = await CalendarService.createEventForTask(t);
                        if (event && event.id) {
                            t.calendarEventId = event.id;
                            // Persist
                            const data = StorageService.getAllData();
                            data.dailyTasks[viewDate][originalIndex] = t;
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
    
    function renderMainTasksList() {
        const mainTasksList = document.getElementById('mainTasksList');
        if (!mainTasksList) return;
        
        mainTasksList.innerHTML = '';
        
        // Get all tasks from all dates
        const allData = StorageService.getAllData();
        const allTasks = [];
        
        if (allData.dailyTasks) {
            Object.entries(allData.dailyTasks).forEach(([date, tasks]) => {
                tasks.forEach((task, index) => {
                    allTasks.push({
                        ...task,
                        date: date,
                        index: index
                    });
                });
            });
        }
        
        // Sort tasks by date (newest first) and priority
        allTasks.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB.getTime() - dateA.getTime();
            }
            
            // If same date, sort by priority
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        });
        
        if (allTasks.length === 0) {
            mainTasksList.innerHTML = `
                <div class="no-tasks-message">
                    <div class="no-tasks-icon">📝</div>
                    <h3>No tasks yet</h3>
                    <p>Click "New Task" to create your first task</p>
                </div>
            `;
            return;
        }
        
        allTasks.forEach(task => {
            const taskDate = new Date(task.date);
            const today = new Date();
            const isOverdue = taskDate < today && !task.done;
            const isToday = taskDate.toDateString() === today.toDateString();
            
            const priorityIcons = {
                high: '🔴',
                medium: '🟡',
                low: '🟢'
            };
            
            const taskItem = document.createElement('div');
            taskItem.className = `task-item-detailed ${task.done ? 'completed' : ''}`;
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox-detailed" ${task.done ? 'checked' : ''}>
                <div class="task-content-detailed">
                    <div class="task-title-row">
                        <span class="task-text-detailed">${task.text}</span>
                        <span class="priority-icon">${priorityIcons[task.priority] || '🟡'}</span>
                        ${isOverdue ? '<span class="overdue-badge">⚠️ OVERDUE</span>' : ''}
                        ${isToday ? '<span class="today-badge">📅 TODAY</span>' : ''}
                    </div>
                    <div class="task-meta-row">
                        <span class="task-priority">${task.priority || 'medium'} Priority</span>
                        <span class="task-due">Due: ${taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span class="task-created">Created: ${new Date(task.createdAt || task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-edit-detailed" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-delete-detailed" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskItem.querySelector('.task-checkbox-detailed');
            const editBtn = taskItem.querySelector('.task-edit-detailed');
            const deleteBtn = taskItem.querySelector('.task-delete-detailed');
            
            checkbox.addEventListener('change', () => {
                handleToggleTask(task.date, task.index);
                setTimeout(renderMainTasksList, 100); // Refresh the main list
            });
            
            editBtn.addEventListener('click', () => editTask(task.date, task.index));
            
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    handleDeleteTask(task.date, task.index);
                    setTimeout(renderMainTasksList, 100); // Refresh the main list
                }
            });
            
            mainTasksList.appendChild(taskItem);
        });
    }

    function updateTaskStats() {
        const viewDate = getCurrentViewDateString();
        const tasksForDate = StorageService.getDailyTasks(viewDate);
        const totalTasks = tasksForDate.length;
        const completedTasks = tasksForDate.filter(task => task.done).length;
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
        updateDateDisplay();
        renderTasks();
        renderMainTasksList();
    }

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    // Date navigation event listeners
    console.log('Setting up date navigation listeners...');
    console.log('Elements found:', {
        prevDateBtn: !!prevDateBtn,
        nextDateBtn: !!nextDateBtn,
        todayBtn: !!todayBtn
    });
    
    prevDateBtn?.addEventListener('click', goToPreviousDate);
    nextDateBtn?.addEventListener('click', goToNextDate);
    todayBtn?.addEventListener('click', goToToday);

    // Modal event listeners
    newTaskBtn?.addEventListener('click', () => openTaskModal('add'));
    closeTaskModal?.addEventListener('click', closeTaskModalHandler);
    cancelTaskModal?.addEventListener('click', closeTaskModalHandler);
    taskForm?.addEventListener('submit', saveTaskHandler);
    
    // Close modal when clicking outside
    taskModal?.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModalHandler();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !taskModal?.classList.contains('hidden')) {
            closeTaskModalHandler();
        }
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => setCategory(btn.dataset.category));
    });

    // Listen for global data changes
    document.addEventListener('data-imported', renderAll);
    document.addEventListener('data-cleared', renderAll);
    document.addEventListener('google-drive-data-loaded', renderAll);

    // Make functions globally available for onclick handlers
    window.filterMainTasks = function(filter) {
        // Add filter functionality here if needed
        console.log('Filter:', filter);
    };
    
    window.TaskManager = {
        toggleMainTask: (id) => {
            // Legacy function - tasks are now handled by date/index
            console.log('Toggle task:', id);
        },
        deleteMainTask: (id) => {
            // Legacy function - tasks are now handled by date/index
            console.log('Delete task:', id);
        },
        editMainTask: (id) => {
            // Legacy function - tasks are now handled by date/index
            console.log('Edit task:', id);
        }
    };

    // Initial render
    // Hide the task manager section completely
    const taskManagerColumn = document.querySelector('.task-manager-column');
    if (taskManagerColumn) {
        taskManagerColumn.style.display = 'none';
    }
    
    // Initialize the date display first
    console.log('Initial date setup:', currentViewDate);
    
    // Force immediate update
    setTimeout(() => {
        console.log('Immediate date update');
        updateDateDisplay();
    }, 0);
    
    updateDateDisplay();
    renderAll();
    
    // Multiple fallback attempts
    setTimeout(() => {
        console.log('Fallback date update 1');
        updateDateDisplay();
    }, 100);
    
    setTimeout(() => {
        console.log('Fallback date update 2');
        updateDateDisplay();
    }, 500);
    
    // Additional fallback for date elements
    setTimeout(() => {
        const dayEl = document.getElementById('currentDayName');
        const dateEl = document.getElementById('currentDateDisplay');
        console.log('Final fallback check:', dayEl?.textContent, dateEl?.textContent);
        if (dayEl && dateEl && (dateEl.textContent === 'Loading...' || dateEl.textContent === '')) {
            console.log('Force updating date display - final attempt');
            currentViewDate = new Date();
            updateDateDisplay();
        }
    }, 1000);
});

// Additional initialization on window load
window.addEventListener('load', () => {
    console.log('Window loaded - updating date display');
    const dayEl = document.getElementById('currentDayName');
    const dateEl = document.getElementById('currentDateDisplay');
    
    if (dayEl && dateEl) {
        const now = new Date();
        dayEl.textContent = 'Today';
        dateEl.textContent = now.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        console.log('Date display force updated on window load');
    }
});
