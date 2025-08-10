// Calendar Renderer Module
class CalendarRenderer {
    // Render the main calendar
    static renderCalendar() {
        const year = AppState.currentDate.getFullYear();
        const month = AppState.currentDate.getMonth();
        
        // Update month title
        document.getElementById('currentMonth').textContent = 
            AppState.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day bg-gray-50 rounded-lg opacity-50';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = TaskManager.getDateKey(date);
            const dayTasks = TaskManager.monthlyTasks[dateKey] || [];
            const isToday = date.toDateString() === new Date().toDateString();
            
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 p-2 ${
                isToday ? 'border-pink-300 bg-pink-50' : 'border-gray-200 hover:border-purple-300'
            }`;
            
            dayElement.onclick = () => UIService.openDayModal(date);
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = `font-bold text-lg mb-1 ${isToday ? 'text-pink-600' : 'text-gray-700'}`;
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            // Task indicators
            const taskIndicators = document.createElement('div');
            taskIndicators.className = 'flex flex-wrap gap-1';
            
            dayTasks.slice(0, 8).forEach(task => {
                const dot = document.createElement('div');
                let dotColor = 'bg-pink-400';
                
                if (task.completed) {
                    dotColor = 'bg-green-400';
                } else {
                    switch(task.priority) {
                        case 'high': dotColor = 'bg-red-400'; break;
                        case 'medium': dotColor = 'bg-yellow-400'; break;
                        case 'low': dotColor = 'bg-green-300'; break;
                    }
                }
                
                dot.className = `task-dot ${dotColor}`;
                dot.title = `${task.text} (${task.priority} priority)`;
                taskIndicators.appendChild(dot);
            });
            
            if (dayTasks.length > 8) {
                const moreDot = document.createElement('div');
                moreDot.className = 'text-xs text-gray-500 font-medium';
                moreDot.textContent = `+${dayTasks.length - 8}`;
                taskIndicators.appendChild(moreDot);
            }
            
            dayElement.appendChild(taskIndicators);
            
            // Task count
            if (dayTasks.length > 0) {
                const taskCount = document.createElement('div');
                taskCount.className = 'text-xs text-gray-500 mt-1';
                const completed = dayTasks.filter(t => t.completed).length;
                taskCount.textContent = `${completed}/${dayTasks.length}`;
                dayElement.appendChild(taskCount);
            }
            
            calendarGrid.appendChild(dayElement);
        }
    }
}
