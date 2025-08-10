// Task Manager Module
class TaskManager {
    static monthlyTasks = {};
    static mainTasks = [];
    static monthlyTodoTasks = {};
    static selectedDate = null;
    static currentDailyFilter = 'all';
    static currentMainFilter = 'all';

    // Get date key for storage
    static getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // Get current month key
    static getMonthKey() {
        return `${AppState.currentDate.getFullYear()}-${String(AppState.currentDate.getMonth() + 1).padStart(2, '0')}`;
    }

    // Add daily task
    static addDailyTask() {
        if (!this.selectedDate) return;
        
        const input = document.getElementById('newTaskInput');
        const prioritySelect = document.getElementById('taskPriority');
        const taskText = input.value.trim();
        
        if (!taskText) {
            alert('Please enter a task!');
            return;
        }
        
        const dateKey = this.getDateKey(this.selectedDate);
        if (!this.monthlyTasks[dateKey]) {
            this.monthlyTasks[dateKey] = [];
        }
        
        if (this.monthlyTasks[dateKey].length >= CONFIG.APP.MAX_TASKS_PER_DAY) {
            alert(`Maximum ${CONFIG.APP.MAX_TASKS_PER_DAY} tasks per day!`);
            return;
        }
        
        const task = {
            id: Date.now(),
            text: taskText,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.monthlyTasks[dateKey].push(task);
        input.value = '';
        prioritySelect.value = 'low';
        
        StorageService.saveData();
        TaskRenderer.renderDailyTasks();
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        UIService.updateTaskCount();
        UIService.updateDailyStats();
    }

    // Toggle daily task
    static toggleDailyTask(taskId) {
        if (!this.selectedDate) return;
        
        const dateKey = this.getDateKey(this.selectedDate);
        const tasks = this.monthlyTasks[dateKey] || [];
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            StorageService.saveData();
            TaskRenderer.renderDailyTasks();
            CalendarRenderer.renderCalendar();
            StatsManager.updateMonthlyStats();
            UIService.updateDailyStats();
        }
    }

    // Delete daily task
    static deleteDailyTask(taskId) {
        if (!this.selectedDate) return;
        
        const dateKey = this.getDateKey(this.selectedDate);
        if (this.monthlyTasks[dateKey]) {
            this.monthlyTasks[dateKey] = this.monthlyTasks[dateKey].filter(t => t.id !== taskId);
            if (this.monthlyTasks[dateKey].length === 0) {
                delete this.monthlyTasks[dateKey];
            }
            
            StorageService.saveData();
            TaskRenderer.renderDailyTasks();
            CalendarRenderer.renderCalendar();
            StatsManager.updateMonthlyStats();
            UIService.updateTaskCount();
            UIService.updateDailyStats();
        }
    }

    // Add main task
    static addMainTask() {
        const input = document.getElementById('mainTaskInput');
        const prioritySelect = document.getElementById('mainTaskPriority');
        const dateInput = document.getElementById('mainTaskDate');
        
        const taskText = input.value.trim();
        const priority = prioritySelect.value;
        const dueDate = dateInput.value;
        
        if (!taskText) {
            alert('Please enter a task!');
            return;
        }
        
        if (!dueDate) {
            alert('Please select a due date!');
            return;
        }
        
        const task = {
            id: Date.now(),
            text: taskText,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.mainTasks.push(task);
        
        input.value = '';
        prioritySelect.value = 'low';
        UIService.setTodayDate();
        
        StorageService.saveData();
        TaskRenderer.renderMainTasks();
        StatsManager.updateMainTaskStats();
    }

    // Toggle main task
    static toggleMainTask(taskId) {
        const task = this.mainTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            
            StorageService.saveData();
            TaskRenderer.renderMainTasks();
            StatsManager.updateMainTaskStats();
        }
    }

    // Delete main task
    static deleteMainTask(taskId) {
        const taskIndex = this.mainTasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            this.mainTasks.splice(taskIndex, 1);
            
            StorageService.saveData();
            TaskRenderer.renderMainTasks();
            StatsManager.updateMainTaskStats();
        }
    }

    // Add monthly todo task
    static addMonthlyTask() {
        const input = document.getElementById('monthlyTaskInput');
        const taskText = input.value.trim();
        
        if (!taskText) {
            alert('Please enter a task!');
            return;
        }
        
        const monthKey = this.getMonthKey();
        if (!this.monthlyTodoTasks[monthKey]) {
            this.monthlyTodoTasks[monthKey] = [];
        }
        
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.monthlyTodoTasks[monthKey].push(task);
        input.value = '';
        
        StorageService.saveData();
        TaskRenderer.renderMonthlyTodoList();
    }

    // Toggle monthly todo task
    static toggleMonthlyTask(taskId) {
        const monthKey = this.getMonthKey();
        const tasks = this.monthlyTodoTasks[monthKey] || [];
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            StorageService.saveData();
            TaskRenderer.renderMonthlyTodoList();
        }
    }

    // Delete monthly todo task
    static deleteMonthlyTask(taskId) {
        const monthKey = this.getMonthKey();
        if (this.monthlyTodoTasks[monthKey]) {
            this.monthlyTodoTasks[monthKey] = this.monthlyTodoTasks[monthKey].filter(t => t.id !== taskId);
            if (this.monthlyTodoTasks[monthKey].length === 0) {
                delete this.monthlyTodoTasks[monthKey];
            }
            
            StorageService.saveData();
            TaskRenderer.renderMonthlyTodoList();
        }
    }

    // Filter tasks
    static filterDailyTasks(filter) {
        this.currentDailyFilter = filter;
        
        document.querySelectorAll('.daily-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        TaskRenderer.renderDailyTasks();
    }

    static filterMainTasks(filter) {
        this.currentMainFilter = filter;
        
        document.querySelectorAll('.main-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        TaskRenderer.renderMainTasks();
    }
}
