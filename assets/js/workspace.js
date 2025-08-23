// Unified Workspace Script - Combines Daily Tasks and Calendar functionality
document.addEventListener('DOMContentLoaded', () => {
    
    // View Toggle Elements
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    const dailyView = document.getElementById('dailyView');
    const calendarView = document.getElementById('calendarView');
    
    // Initialize View Toggle
    function initViewToggle() {
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetView = btn.dataset.view;
                switchView(targetView);
            });
        });
    }
    
    function switchView(view) {
        // Update toggle buttons
        viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update view content
        if (view === 'daily') {
            dailyView.classList.add('active');
            calendarView.classList.remove('active');
            initDailyTasksWorkspace();
        } else if (view === 'calendar') {
            dailyView.classList.remove('active');
            calendarView.classList.add('active');
            initCalendarWorkspace();
        }
    }
    
    // Daily Tasks Workspace Integration
    function initDailyTasksWorkspace() {
        // Load scripts if needed
        loadScript('assets/js/daily.js', () => {
            // Initialize daily tasks functionality
            if (typeof window.initDailyTasks === 'function') {
                window.initDailyTasks();
            }
        });
        
        // Fix add task button immediately
        fixAddTaskButton();
    }
    
    // Calendar Workspace Integration  
    function initCalendarWorkspace() {
        // Load scripts if needed
        loadScript('assets/js/calendar.js', () => {
            // Initialize calendar functionality
            if (typeof window.initCalendar === 'function') {
                window.initCalendar();
            }
        });
    }
    
    // Dynamic script loader
    function loadScript(src, callback) {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            if (callback) callback();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    // Fix add task button functionality
    function fixAddTaskButton() {
        const newTaskBtn = document.getElementById('newTaskBtn');
        const taskModal = document.getElementById('taskModal');
        const closeTaskModal = document.getElementById('closeTaskModal');
        const cancelTaskModal = document.getElementById('cancelTaskModal');
        const saveTaskModal = document.getElementById('saveTaskModal');
        const taskForm = document.getElementById('taskForm');
        
        if (newTaskBtn && taskModal) {
            // Remove existing listeners
            newTaskBtn.replaceWith(newTaskBtn.cloneNode(true));
            const newBtn = document.getElementById('newTaskBtn');
            
            newBtn.addEventListener('click', () => {
                console.log('Add task button clicked');
                
                // Prevent background scroll
                document.body.classList.add('modal-open');
                taskModal.classList.remove('hidden');
                
                // Set current date as default
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('modalTaskDate');
                if (dateInput) {
                    dateInput.value = today;
                }
                
                // Reset form
                if (taskForm) {
                    taskForm.reset();
                    const dateInputReset = document.getElementById('modalTaskDate');
                    if (dateInputReset) {
                        dateInputReset.value = today;
                    }
                }
                
                // Focus on task text input
                setTimeout(() => {
                    const textInput = document.getElementById('modalTaskText');
                    if (textInput) {
                        textInput.focus();
                    }
                }, 100);
            });
        }
        
        // Close modal handlers
        function closeModal() {
            if (taskModal) {
                taskModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
            if (taskForm) {
                taskForm.reset();
            }
        }
        
        if (closeTaskModal) {
            closeTaskModal.addEventListener('click', closeModal);
        }
        
        if (cancelTaskModal) {
            cancelTaskModal.addEventListener('click', closeModal);
        }
        
        // Save task handler
        if (saveTaskModal && taskForm) {
            saveTaskModal.addEventListener('click', (e) => {
                e.preventDefault();
                
                const taskText = document.getElementById('modalTaskText');
                const taskDate = document.getElementById('modalTaskDate');
                const taskPriority = document.getElementById('modalTaskPriority');
                const taskCategory = document.getElementById('modalTaskCategory');
                const taskTime = document.getElementById('modalTaskTime');
                const taskNotes = document.getElementById('modalTaskNotes');
                const createCalEvent = document.getElementById('modalCreateCalendarEvent');
                const setReminder = document.getElementById('modalSetReminder');
                
                const taskData = {
                    text: taskText ? taskText.value.trim() : '',
                    date: taskDate ? taskDate.value : new Date().toISOString().split('T')[0],
                    time: taskTime ? taskTime.value : '',
                    priority: taskPriority ? taskPriority.value : 'medium',
                    category: taskCategory ? taskCategory.value : 'personal',
                    notes: taskNotes ? taskNotes.value.trim() : '',
                    createCalendarEvent: createCalEvent ? createCalEvent.checked : false,
                    setReminder: setReminder ? setReminder.checked : false,
                    done: false,
                    createdAt: new Date().toISOString()
                };
                
                if (!taskData.text) {
                    alert('Please enter a task description');
                    return;
                }
                
                // Save task using StorageService
                if (window.StorageService) {
                    try {
                        StorageService.addDailyTask(taskData.date, taskData);
                        
                        // Show success notification
                        if (window.NotificationService) {
                            NotificationService.show('✅ Task added successfully!', 'success');
                        }
                        
                        // Close modal
                        closeModal();
                        
                        // Refresh task list if currently viewing daily tasks
                        if (dailyView.classList.contains('active')) {
                            refreshDailyTasks();
                        }
                        
                    } catch (error) {
                        console.error('Error saving task:', error);
                        if (window.NotificationService) {
                            NotificationService.show('❌ Error saving task', 'error');
                        } else {
                            alert('Error saving task: ' + error.message);
                        }
                    }
                } else {
                    console.error('StorageService not available');
                    alert('Error: Storage service not available. Please refresh the page.');
                }
            });
        }
        
        // Close modal on outside click
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    closeModal();
                }
            });
        }
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && taskModal && !taskModal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
    
    // Refresh daily tasks display
    function refreshDailyTasks() {
        // Call the daily tasks refresh function
        if (typeof window.refreshTaskDisplay === 'function') {
            window.refreshTaskDisplay();
        } else if (typeof window.renderTasks === 'function') {
            window.renderTasks();
        } else {
            // Trigger a custom event to refresh tasks
            document.dispatchEvent(new CustomEvent('refreshTasks'));
        }
    }
    
    // Initialize the workspace
    initViewToggle();
    
    // Start with daily tasks view
    initDailyTasksWorkspace();
    
    // Expose functions globally
    window.switchWorkspaceView = switchView;
    window.refreshWorkspaceTasks = refreshDailyTasks;
    
    console.log('Workspace initialized');
});
