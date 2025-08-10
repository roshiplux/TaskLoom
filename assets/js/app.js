// Main Application Initialization
class TaskLoomApp {
    constructor() {
        this.googleDriveService = new GoogleDriveService();
    }

    async initialize() {
        // Load local data first
        StorageService.loadLocalData();
        
        // Initialize UI
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        StatsManager.updateMainTaskStats();
        TaskRenderer.renderMainTasks();
        TaskRenderer.renderMonthlyTodoList();
        UIService.setTodayDate();
        UIService.initializeTheme();
        UIService.updateSettingsInfo();
        
        // Initialize Google Drive service
        await this.googleDriveService.initialize();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Enter key handlers
        document.getElementById('newTaskInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                TaskManager.addDailyTask();
            }
        });

        document.getElementById('mainTaskInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                TaskManager.addMainTask();
            }
        });

        document.getElementById('monthlyTaskInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                TaskManager.addMonthlyTask();
            }
        });

        // Close modal when clicking outside
        document.getElementById('taskModal').addEventListener('click', function(e) {
            if (e.target === this) {
                UIService.closeModal();
            }
        });

        // File import handler
        document.getElementById('importFile').addEventListener('change', StorageService.importData);
    }
}

// Global function wrappers for HTML onclick handlers
window.signIn = () => app.googleDriveService.signIn();
window.signOut = () => app.googleDriveService.signOut();
window.syncWithGoogle = () => app.googleDriveService.syncWithGoogle();

window.previousMonth = () => AppState.previousMonth();
window.nextMonth = () => AppState.nextMonth();
window.goToToday = () => AppState.goToToday();

window.addDailyTask = () => TaskManager.addDailyTask();
window.addMainTask = () => TaskManager.addMainTask();
window.addMonthlyTask = () => TaskManager.addMonthlyTask();

window.toggleDailyTask = (id) => TaskManager.toggleDailyTask(id);
window.toggleMainTask = (id) => TaskManager.toggleMainTask(id);
window.toggleMonthlyTask = (id) => TaskManager.toggleMonthlyTask(id);

window.deleteDailyTask = (id) => TaskManager.deleteDailyTask(id);
window.deleteMainTask = (id) => TaskManager.deleteMainTask(id);
window.deleteMonthlyTask = (id) => TaskManager.deleteMonthlyTask(id);

window.filterDailyTasks = (filter) => TaskManager.filterDailyTasks(filter);
window.filterMainTasks = (filter) => TaskManager.filterMainTasks(filter);

window.closeModal = () => UIService.closeModal();
window.toggleSettings = () => UIService.toggleSettings();
window.toggleHelpPanel = () => UIService.toggleHelpPanel();
window.toggleTheme = () => UIService.toggleTheme();
window.showStats = () => StatsManager.showStats();

window.exportData = () => StorageService.exportData();
window.importData = (event) => StorageService.importData(event);
window.clearAllData = () => StorageService.clearAllData();

// Initialize app when page loads
let app;
window.onload = async function() {
    app = new TaskLoomApp();
    await app.initialize();
};
