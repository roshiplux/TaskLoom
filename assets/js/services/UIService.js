// UI Service Module
class UIService {
    // Open day modal
    static openDayModal(date) {
        TaskManager.selectedDate = date;
        TaskManager.currentDailyFilter = 'all';
        
        document.getElementById('modalTitle').textContent = 
            date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        
        document.getElementById('taskModal').classList.remove('hidden');
        document.getElementById('taskModal').classList.add('flex');
        
        // Reset filter buttons
        document.querySelectorAll('.daily-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.daily-filter-btn').classList.add('active');
        
        TaskRenderer.renderDailyTasks();
        this.updateTaskCount();
        StatsManager.updateDailyStats();
    }

    // Close modal
    static closeModal() {
        document.getElementById('taskModal').classList.add('hidden');
        document.getElementById('taskModal').classList.remove('flex');
        TaskManager.selectedDate = null;
    }

    // Update task count
    static updateTaskCount() {
        if (!TaskManager.selectedDate) return;
        
        const dateKey = TaskManager.getDateKey(TaskManager.selectedDate);
        const tasks = TaskManager.monthlyTasks[dateKey] || [];
        document.getElementById('taskCount').textContent = tasks.length;
    }

    // Set today's date as default
    static setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('mainTaskDate').value = today;
    }

    // Toggle settings panel
    static toggleSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        
        if (settingsPanel.classList.contains('translate-x-full')) {
            // Show panel
            settingsPanel.classList.remove('translate-x-full');
        } else {
            // Hide panel
            settingsPanel.classList.add('translate-x-full');
        }
    }

    // Toggle help panel
    static toggleHelpPanel() {
        const helpPanel = document.getElementById('helpPanel');
        const helpButton = document.getElementById('helpButton');
        
        if (helpPanel.classList.contains('translate-y-full')) {
            // Show panel
            helpPanel.classList.remove('translate-y-full');
            helpButton.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            `;
        } else {
            // Hide panel
            helpPanel.classList.add('translate-y-full');
            helpButton.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        }
    }

    // Update Google status in settings
    static updateGoogleStatus(connected, name = '', email = '') {
        const googleStatus = document.getElementById('googleStatus');
        if (connected) {
            googleStatus.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">✅</span>
                    <div>
                        <div class="font-medium text-green-700">Connected</div>
                        <div class="text-sm text-green-600">${name} (${email})</div>
                    </div>
                </div>
            `;
            document.getElementById('storageInfo').textContent = 'Google Drive + Local';
        } else {
            googleStatus.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-2xl">❌</span>
                    <div>
                        <div class="font-medium text-gray-700">Not Connected</div>
                        <div class="text-sm text-gray-500">Connect to sync across devices</div>
                    </div>
                </div>
            `;
            document.getElementById('storageInfo').textContent = 'Local Browser';
        }
    }

    // Update settings info
    static updateSettingsInfo() {
        const lastSync = localStorage.getItem(CONFIG.STORAGE.LAST_SYNC);
        const lastSyncTime = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
        const totalTasks = TaskManager.mainTasks.length + 
                           Object.values(TaskManager.monthlyTasks).reduce((sum, dayTasks) => sum + dayTasks.length, 0);
        
        document.getElementById('lastSyncTime').textContent = lastSyncTime;
        document.getElementById('totalTasksCount').textContent = totalTasks;
    }

    // Initialize theme
    static initializeTheme() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE.THEME) || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            this.updateThemeToggle(true);
        }
    }

    // Toggle theme
    static toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem(CONFIG.STORAGE.THEME, 'light');
            this.updateThemeToggle(false);
            NotificationService.show('☀️ Switched to light mode', 'info');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem(CONFIG.STORAGE.THEME, 'dark');
            this.updateThemeToggle(true);
            NotificationService.show('🌙 Switched to dark mode', 'info');
        }
    }

    // Update theme toggle
    static updateThemeToggle(isDark) {
        const themeButton = document.getElementById('themeToggle');
        const themeSwitch = document.getElementById('themeToggleSwitch');
        const themeIndicator = document.getElementById('themeToggleIndicator');
        
        if (isDark) {
            themeButton.innerHTML = '☀️';
            themeSwitch.classList.add('bg-purple-600');
            themeSwitch.classList.remove('bg-gray-200');
            themeIndicator.classList.add('translate-x-6');
            themeIndicator.classList.remove('translate-x-1');
        } else {
            themeButton.innerHTML = '🌙';
            themeSwitch.classList.remove('bg-purple-600');
            themeSwitch.classList.add('bg-gray-200');
            themeIndicator.classList.remove('translate-x-6');
            themeIndicator.classList.add('translate-x-1');
        }
    }

    // Update daily stats display
    static updateDailyStats() {
        StatsManager.updateDailyStats();
    }

    // Show Google Drive unavailable state
    static showGoogleDriveUnavailable() {
        const signInBtn = document.getElementById('googleSignIn');
        signInBtn.innerHTML = '❌ Google Drive Unavailable';
        signInBtn.disabled = true;
        signInBtn.className = 'px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-xl cursor-not-allowed';
        
        NotificationService.show('⚠️ Google Drive unavailable. Using local storage only.', 'warning');
    }
}
