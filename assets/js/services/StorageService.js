// Storage Service Module
class StorageService {
    // Save all data to local storage
    static saveLocalData() {
        localStorage.setItem(CONFIG.STORAGE.MONTHLY_TASKS, JSON.stringify(TaskManager.monthlyTasks));
        localStorage.setItem(CONFIG.STORAGE.MAIN_TASKS, JSON.stringify(TaskManager.mainTasks));
        localStorage.setItem(CONFIG.STORAGE.MONTHLY_TODO, JSON.stringify(TaskManager.monthlyTodoTasks));
    }

    // Load all data from local storage
    static loadLocalData() {
        const savedMonthly = localStorage.getItem(CONFIG.STORAGE.MONTHLY_TASKS);
        if (savedMonthly) {
            TaskManager.monthlyTasks = JSON.parse(savedMonthly);
        }
        
        const savedMain = localStorage.getItem(CONFIG.STORAGE.MAIN_TASKS);
        if (savedMain) {
            TaskManager.mainTasks = JSON.parse(savedMain);
        }
        
        const savedMonthlyTodo = localStorage.getItem(CONFIG.STORAGE.MONTHLY_TODO);
        if (savedMonthlyTodo) {
            TaskManager.monthlyTodoTasks = JSON.parse(savedMonthlyTodo);
        }
    }

    // Save data (local + Google if connected)
    static saveData() {
        this.saveLocalData();
        if (GoogleDriveService.prototype.isSignedIn) {
            googleDriveService.syncWithGoogle();
        }
    }

    // Export data to JSON file
    static exportData() {
        const data = {
            monthlyTasks: TaskManager.monthlyTasks,
            mainTasks: TaskManager.mainTasks,
            monthlyTodoTasks: TaskManager.monthlyTodoTasks,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskloom-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        NotificationService.show('📤 Data exported successfully!', 'success');
    }

    // Import data from JSON file
    static importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.monthlyTasks) {
                    TaskManager.monthlyTasks = { ...TaskManager.monthlyTasks, ...data.monthlyTasks };
                }
                if (data.mainTasks) {
                    const existingIds = new Set(TaskManager.mainTasks.map(t => t.id));
                    const newTasks = data.mainTasks.filter(t => !existingIds.has(t.id));
                    TaskManager.mainTasks = [...TaskManager.mainTasks, ...newTasks];
                }
                if (data.monthlyTodoTasks) {
                    TaskManager.monthlyTodoTasks = { ...TaskManager.monthlyTodoTasks, ...data.monthlyTodoTasks };
                }
                
                StorageService.saveData();
                CalendarRenderer.renderCalendar();
                StatsManager.updateMonthlyStats();
                StatsManager.updateMainTaskStats();
                TaskRenderer.renderMainTasks();
                TaskRenderer.renderMonthlyTodoList();
                
                NotificationService.show('📥 Data imported successfully!', 'success');
                
            } catch (error) {
                console.error('Import failed:', error);
                NotificationService.show('❌ Import failed. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Clear all data
    static clearAllData() {
        if (!confirm('⚠️ This will delete ALL your tasks and data. Are you sure?')) {
            return;
        }
        
        if (!confirm('🗑️ Last chance! This action cannot be undone. Continue?')) {
            return;
        }
        
        TaskManager.monthlyTasks = {};
        TaskManager.mainTasks = [];
        TaskManager.monthlyTodoTasks = {};
        
        this.saveLocalData();
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        StatsManager.updateMainTaskStats();
        TaskRenderer.renderMainTasks();
        TaskRenderer.renderMonthlyTodoList();
        
        NotificationService.show('🗑️ All data cleared successfully!', 'success');
    }
}
