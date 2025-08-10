// TaskLoom Configuration
const CONFIG = {
    // Google API Configuration
    GOOGLE: {
        CLIENT_ID: '930425939666-d83p6p8ggkgdhpqfc2tbpdla4ku26iig.apps.googleusercontent.com',
        API_KEY: 'AIzaSyBozSyGH9_t756soJLZFSR7Z-zZsD5J2q8',
        DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        SCOPES: 'https://www.googleapis.com/auth/drive.file'
    },
    
    // App Settings
    APP: {
        POLLING_INTERVAL: 2 * 60 * 1000, // 2 minutes in milliseconds
        MAX_TASKS_PER_DAY: 10,
        MAX_TASK_LENGTH: 100,
        MAX_MONTHLY_TASK_LENGTH: 60
    },
    
    // Storage Keys
    STORAGE: {
        MONTHLY_TASKS: 'taskLoomMonthlyTasks',
        MAIN_TASKS: 'taskLoomMainTasks',
        MONTHLY_TODO: 'taskLoomMonthlyTodo',
        THEME: 'taskLoomTheme',
        LAST_SYNC: 'lastSyncTime'
    }
};
