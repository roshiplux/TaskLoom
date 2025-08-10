// Task Renderer Module
class TaskRenderer {
    // Render daily tasks in modal
    static renderDailyTasks() {
        if (!TaskManager.selectedDate) return;
        
        const dateKey = TaskManager.getDateKey(TaskManager.selectedDate);
        let tasks = TaskManager.monthlyTasks[dateKey] || [];
        const tasksList = document.getElementById('dailyTasksList');
        
        // Apply filter
        let filteredTasks = tasks;
        switch(TaskManager.currentDailyFilter) {
            case 'pending':
                filteredTasks = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
            case 'high':
                filteredTasks = tasks.filter(task => task.priority === 'high');
                break;
            case 'medium':
                filteredTasks = tasks.filter(task => task.priority === 'medium');
                break;
            case 'low':
                filteredTasks = tasks.filter(task => task.priority === 'low');
                break;
        }
        
        if (filteredTasks.length === 0) {
            const message = tasks.length === 0 ? 'No tasks for this day yet!' : `No ${TaskManager.currentDailyFilter} tasks found.`;
            tasksList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-4xl mb-2">📝</div>
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        const priorityColors = {
            low: 'from-green-50 to-green-100 border-green-200',
            medium: 'from-yellow-50 to-yellow-100 border-yellow-200',
            high: 'from-red-50 to-red-100 border-red-200'
        };
        
        const priorityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        
        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="flex items-center gap-3 p-3 bg-gradient-to-r ${priorityColors[task.priority]} border rounded-lg slide-in">
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onchange="TaskManager.toggleDailyTask(${task.id})"
                    class="w-4 h-4 text-pink-500 rounded focus:ring-pink-300"
                >
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}">${task.text}</span>
                        <span class="text-sm">${priorityIcons[task.priority]}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </div>
                </div>
                <button 
                    onclick="TaskManager.deleteDailyTask(${task.id})" 
                    class="text-red-400 hover:text-red-600 p-1 rounded transition-colors duration-200"
                    title="Delete task"
                >
                    🗑️
                </button>
            </div>
        `).join('');
    }

    // Render main tasks list
    static renderMainTasks() {
        const tasksList = document.getElementById('mainTasksList');
        let filteredTasks = TaskManager.mainTasks;
        
        // Apply filter
        const today = new Date().toISOString().split('T')[0];
        
        switch(TaskManager.currentMainFilter) {
            case 'pending':
                filteredTasks = TaskManager.mainTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = TaskManager.mainTasks.filter(task => task.completed);
                break;
            case 'high':
                filteredTasks = TaskManager.mainTasks.filter(task => task.priority === 'high');
                break;
            case 'medium':
                filteredTasks = TaskManager.mainTasks.filter(task => task.priority === 'medium');
                break;
            case 'low':
                filteredTasks = TaskManager.mainTasks.filter(task => task.priority === 'low');
                break;
            case 'today':
                filteredTasks = TaskManager.mainTasks.filter(task => task.dueDate === today);
                break;
        }
        
        // Sort by priority and due date
        filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        if (filteredTasks.length === 0) {
            const message = TaskManager.mainTasks.length === 0 ? 'No tasks created yet!' : `No ${TaskManager.currentMainFilter} tasks found.`;
            tasksList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <div class="text-6xl mb-4">📝</div>
                    <p class="text-xl">${message}</p>
                    <p class="text-sm mt-2">Add your first task using the form above!</p>
                </div>
            `;
            return;
        }
        
        const priorityColors = {
            low: 'from-green-50 to-green-100 border-green-200',
            medium: 'from-yellow-50 to-yellow-100 border-yellow-200',
            high: 'from-red-50 to-red-100 border-red-200'
        };
        
        const priorityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        
        tasksList.innerHTML = filteredTasks.map(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const isOverdue = dueDate < today && !task.completed;
            const isToday = task.dueDate === today.toISOString().split('T')[0];
            
            return `
                <div class="flex items-center gap-4 p-4 bg-gradient-to-r ${priorityColors[task.priority]} border rounded-xl slide-in ${isOverdue ? 'ring-2 ring-red-300' : ''}">
                    <input 
                        type="checkbox" 
                        ${task.completed ? 'checked' : ''} 
                        onchange="TaskManager.toggleMainTask(${task.id})"
                        class="w-5 h-5 text-pink-500 rounded focus:ring-pink-300"
                    >
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 font-medium'}">${task.text}</span>
                            <span class="text-lg">${priorityIcons[task.priority]}</span>
                            ${isOverdue ? '<span class="text-red-500 text-sm font-bold">⚠️ OVERDUE</span>' : ''}
                            ${isToday ? '<span class="text-blue-500 text-sm font-bold">📅 TODAY</span>' : ''}
                        </div>
                        <div class="flex items-center gap-4 text-sm text-gray-600">
                            <span class="capitalize font-medium">${task.priority} Priority</span>
                            <span>Due: ${dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span>Created: ${new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                    <button 
                        onclick="TaskManager.deleteMainTask(${task.id})" 
                        class="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors duration-200 hover:bg-red-50"
                        title="Delete task"
                    >
                        🗑️
                    </button>
                </div>
            `;
        }).join('');
    }

    // Render monthly to-do list
    static renderMonthlyTodoList() {
        const monthKey = TaskManager.getMonthKey();
        const monthlyTodoList = document.getElementById('monthlyTodoList');
        const tasks = TaskManager.monthlyTodoTasks[monthKey] || [];
        
        if (tasks.length === 0) {
            monthlyTodoList.innerHTML = `
                <div class="text-center text-gray-500 py-6">
                    <div class="text-3xl mb-2">📝</div>
                    <p class="text-sm">No monthly tasks yet!</p>
                    <p class="text-xs mt-1">Add tasks above</p>
                </div>
            `;
            return;
        }
        
        monthlyTodoList.innerHTML = tasks.map(task => `
            <div class="flex items-center gap-3 p-3 bg-white bg-opacity-60 rounded-lg border border-gray-200 hover:bg-opacity-80 transition-all duration-200">
                <button 
                    onclick="TaskManager.toggleMonthlyTask(${task.id})"
                    class="w-5 h-5 rounded border-2 border-pink-300 flex items-center justify-center transition-all duration-200 ${
                        task.completed ? 'bg-pink-400 text-white' : 'hover:bg-pink-50'
                    }"
                >
                    ${task.completed ? '✓' : ''}
                </button>
                <div class="flex-1 min-w-0">
                    <span class="text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}">${task.text}</span>
                </div>
                <button 
                    onclick="TaskManager.deleteMonthlyTask(${task.id})" 
                    class="text-red-400 hover:text-red-600 p-1 rounded transition-colors duration-200"
                    title="Delete task"
                >
                    🗑️
                </button>
            </div>
        `).join('');
    }
}
