// App State Manager
class AppState {
    static currentDate = new Date();

    // Navigation methods
    static previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        TaskRenderer.renderMonthlyTodoList();
    }

    static nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        TaskRenderer.renderMonthlyTodoList();
    }

    // Go to today
    static goToToday() {
        this.currentDate = new Date();
        CalendarRenderer.renderCalendar();
        StatsManager.updateMonthlyStats();
        TaskRenderer.renderMonthlyTodoList();
        NotificationService.show('📅 Jumped to current month!', 'info');
    }
}
