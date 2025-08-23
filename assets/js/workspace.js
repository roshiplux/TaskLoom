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
        } else if (view === 'calendar') {
            dailyView.classList.remove('active');
            calendarView.classList.add('active');
        }
    }
    
    // Initialize the workspace
    initViewToggle();
    
    // Expose functions globally
    window.switchWorkspaceView = switchView;
    
    console.log('Workspace initialized');
});
