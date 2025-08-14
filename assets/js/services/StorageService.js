// Storage Service Module
class StorageService {
    static appData = {
        monthlyTasks: [], // Array of { text: string, done: boolean }
        dailyTasks: {},   // Object with 'YYYY-MM-DD' keys and array of { text, done, category } values
    };

    /**
     * Initializes the storage service by loading data.
     */
    static initialize() {
        this.loadLocalData();
    }

    /**
     * Loads data from localStorage. If no new data format is found,
     * it attempts to migrate data from the old format.
     */
    static loadLocalData() {
        const savedData = localStorage.getItem('taskloom_app_data');
        if (savedData) {
            try {
                this.appData = JSON.parse(savedData);
                // Ensure keys exist
                this.appData.monthlyTasks = this.appData.monthlyTasks || [];
                this.appData.dailyTasks = this.appData.dailyTasks || {};
            } catch (e) {
                console.error("Failed to parse local data, starting fresh.", e);
                this.appData = { monthlyTasks: [], dailyTasks: {} };
            }
        } else {
            this.migrateOldData();
        }
    }

    /**
     * Saves the current appData to localStorage.
     */
    static saveLocalData() {
        localStorage.setItem('taskloom_app_data', JSON.stringify(this.appData));
    }

    /**
     * Saves data to local storage and triggers a sync with Google Drive if connected.
     */
    static saveData() {
        this.saveLocalData();
        // Firestore auto snapshot (debounced)
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(async () => {
            if (window.FirebaseService && FirebaseService.user) {
                try { await FirebaseService.saveAllDataSnapshot(this.getAllData()); }
                catch(e){ console.warn('Firestore sync skipped', e.message); }
            }
        }, 1200);
    }

    /**
     * Migrates data from the old storage format to the new appData structure.
     * This is a best-effort migration.
     */
    static migrateOldData() {
        console.log("Checking for old data to migrate...");
        const oldMonthlyTodo = localStorage.getItem('monthlyTodoTasks');
        let migrated = false;

        if (oldMonthlyTodo) {
            try {
                const oldTodos = JSON.parse(oldMonthlyTodo);
                const newMonthlyTasks = [];
                // Assuming old monthly todos can be flattened into the new monthly list
                Object.values(oldTodos).forEach(dayTasks => {
                    if (Array.isArray(dayTasks)) {
                        dayTasks.forEach(task => {
                            if (task && typeof task.text === 'string') {
                                newMonthlyTasks.push({ text: task.text, done: !!task.done });
                            }
                        });
                    }
                });
                this.appData.monthlyTasks = newMonthlyTasks;
                migrated = true;
                console.log("Migrated monthlyTodoTasks to new monthlyTasks format.");
            } catch (e) {
                console.error("Failed to migrate old monthlyTodoTasks", e);
            }
        }

        // Clean up old data from localStorage after migration
        if (migrated) {
            this.saveData();
            localStorage.removeItem('monthlyTasks');
            localStorage.removeItem('mainTasks');
            localStorage.removeItem('monthlyTodoTasks');
            localStorage.removeItem('taskloom_last_sync');
            console.log("Removed old data keys from localStorage.");
        }
    }

    // --- Getters ---
    static getMonthlyTasks() {
        return this.appData.monthlyTasks || [];
    }

    static getDailyTasks(date) { // date is 'YYYY-MM-DD'
        return this.appData.dailyTasks[date] || [];
    }

    static getAllData() {
        return this.appData;
    }

    // --- Setters / Updaters ---
    static setAllData(data) {
        this.appData = data;
        this.saveData();
        // It's better to dispatch an event that UI components can listen to
        document.dispatchEvent(new CustomEvent('data-imported'));
    }

    static addMonthlyTask(taskText) {
        if (!this.appData.monthlyTasks) this.appData.monthlyTasks = [];
        this.appData.monthlyTasks.push({ text: taskText, done: false });
        this.saveData();
    }

    static toggleMonthlyTask(index) {
        if (this.appData.monthlyTasks && this.appData.monthlyTasks[index]) {
            this.appData.monthlyTasks[index].done = !this.appData.monthlyTasks[index].done;
            this.saveData();
        }
    }

    static deleteMonthlyTask(index) {
        if (this.appData.monthlyTasks) {
            this.appData.monthlyTasks.splice(index, 1);
            this.saveData();
        }
    }

    static addDailyTask(date, task) { // date is 'YYYY-MM-DD', task is { text, category }
        if (!this.appData.dailyTasks) this.appData.dailyTasks = {};
        if (!this.appData.dailyTasks[date]) {
            this.appData.dailyTasks[date] = [];
        }
        this.appData.dailyTasks[date].push({ ...task, done: false });
        this.saveData();
    }

    static toggleDailyTask(date, index) {
        if (this.appData.dailyTasks && this.appData.dailyTasks[date] && this.appData.dailyTasks[date][index]) {
            this.appData.dailyTasks[date][index].done = !this.appData.dailyTasks[date][index].done;
            this.saveData();
        }
    }

    static deleteDailyTask(date, index) {
        if (this.appData.dailyTasks && this.appData.dailyTasks[date]) {
            this.appData.dailyTasks[date].splice(index, 1);
            this.saveData();
        }
    }

    // --- Import / Export / Clear ---

    static exportData() {
        const dataToExport = {
            ...this.appData,
            exportDate: new Date().toISOString(),
            version: '3.0.0' // New data format version
        };
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskloom-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Assuming NotificationService is available globally
        if (window.NotificationService) {
            NotificationService.show('📤 Data exported successfully!', 'success');
        }
    }

    static importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                const importedData = {
                    monthlyTasks: data.monthlyTasks || [],
                    dailyTasks: data.dailyTasks || {}
                };

                this.setAllData(importedData);
                
                if (window.NotificationService) {
                    NotificationService.show('📥 Data imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Import failed:', error);
                if (window.NotificationService) {
                    NotificationService.show('❌ Import failed. Invalid file format.', 'error');
                }
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    static clearAllData() {
        // Assuming a confirmation modal exists or using window.confirm
        if (window.confirm('⚠️ This will delete ALL your tasks and data. Are you sure?')) {
            if (window.confirm('🗑️ Last chance! This action cannot be undone. Continue?')) {
                this.appData = { monthlyTasks: [], dailyTasks: {} };
                this.saveData();
                // Dispatch event to re-render UI
                document.dispatchEvent(new CustomEvent('data-cleared'));
                if (window.NotificationService) {
                    NotificationService.show('🗑️ All data cleared successfully!', 'success');
                }
            }
        }
    }
}

// Initialize the service on script load
StorageService.initialize();

