// Statistics Manager Module
class StatsManager {
    // Update monthly statistics
    static updateMonthlyStats() {
        const monthKey = TaskManager.getMonthKey();
        let totalTasks = 0;
        let completedTasks = 0;
        let activeDays = 0;
        
        Object.keys(TaskManager.monthlyTasks).forEach(dateKey => {
            if (dateKey.startsWith(monthKey)) {
                const dayTasks = TaskManager.monthlyTasks[dateKey];
                if (dayTasks.length > 0) {
                    activeDays++;
                    totalTasks += dayTasks.length;
                    completedTasks += dayTasks.filter(t => t.completed).length;
                }
            }
        });
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('monthlyTotal').textContent = totalTasks;
        document.getElementById('monthlyCompleted').textContent = completedTasks;
        document.getElementById('activeDays').textContent = activeDays;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }

    // Update main task statistics
    static updateMainTaskStats() {
        const total = TaskManager.mainTasks.length;
        const completed = TaskManager.mainTasks.filter(t => t.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('mainTotalTasks').textContent = total;
        document.getElementById('mainPendingTasks').textContent = pending;
        document.getElementById('mainCompletedTasks').textContent = completed;
        document.getElementById('mainProgressRate').textContent = progress + '%';
    }

    // Update daily statistics
    static updateDailyStats() {
        if (!TaskManager.selectedDate) return;
        
        const dateKey = TaskManager.getDateKey(TaskManager.selectedDate);
        const tasks = TaskManager.monthlyTasks[dateKey] || [];
        
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        document.getElementById('dailyTotal').textContent = total;
        document.getElementById('dailyPending').textContent = pending;
        document.getElementById('dailyCompleted').textContent = completed;
        document.getElementById('dailyProgress').textContent = progress + '%';
    }

    // Show statistics modal
    static showStats() {
        const total = TaskManager.mainTasks.length;
        const monthlyTotal = Object.values(TaskManager.monthlyTasks).reduce((sum, dayTasks) => sum + dayTasks.length, 0);
        const grandTotal = total + monthlyTotal;
        
        alert(`📊 TaskLoom Statistics\n\n` +
              `Main Tasks: ${total}\n` +
              `Monthly Tasks: ${monthlyTotal}\n` +
              `Total Tasks: ${grandTotal}\n\n` +
              `Data stored locally and synced to Google Drive.`);
    }
}
