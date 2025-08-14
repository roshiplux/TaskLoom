// TaskLoom Configuration
const CONFIG = {
    // Google API Configuration
    GOOGLE: {
        CLIENT_ID: '930425939666-d83p6p8ggkgdhpqfc2tbpdla4ku26iig.apps.googleusercontent.com',
        API_KEY: 'AIzaSyBozSyGH9_t756soJLZFSR7Z-zZsD5J2q8',
        DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        // Base scopes: do NOT include calendar by default (ask user incrementally)
        SCOPES: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile',
        CALENDAR_SCOPE: 'https://www.googleapis.com/auth/calendar',
        FILE_NAME: 'taskloom-data-v3.json' // New file name for the new data structure
    },
    // Firebase Configuration (fill with your Firebase project values)
    FIREBASE: {
        // New Firebase project credentials (replaced as requested)
        API_KEY: 'AIzaSyBKxSTOlICKjzbGiD661xA9CO-Ejz6I__0',
        AUTH_DOMAIN: 'taskloomapp.firebaseapp.com',
        PROJECT_ID: 'taskloomapp',
        // Original provided storageBucket was 'taskloomapp.firebasestorage.app' (that is the serving domain, not the bucket ID)
        STORAGE_BUCKET: 'taskloomapp.appspot.com',
        MESSAGING_SENDER_ID: '54579600666',
        APP_ID: '1:54579600666:web:df54750c40d8eb54cde0a3'
    },
    
    // App Settings
    APP: {
        POLLING_INTERVAL: 2 * 60 * 1000, // 2 minutes in milliseconds
        MAX_TASKS_PER_DAY: 10,
        MAX_TASK_LENGTH: 100,
        MAX_MONTHLY_TASK_LENGTH: 60,
    AUTO_CREATE_CAL_EVENTS: true, // Automatically create a calendar event when adding a daily task
        SHOW_GCAL_EVENTS: true, // Overlay Google Calendar events on month view
        SHOW_HOLIDAYS: true, // Show public holidays
        SHOW_POYA_DAYS: true, // Show poya days (Sri Lankan Buddhist calendar)
        SHOW_RECURRING: true, // Show recurring events from Google Calendar
        // Development and production domains for Google OAuth
        ALLOWED_DOMAINS: [
            'https://roshiplux.github.io',
            'http://localhost:8000',
            'http://localhost:3000',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:5500' // For VS Code Live Server
        ]
    },
    
    // Storage Keys
    STORAGE: {
        APP_DATA: 'taskloomAppData_v3', // Single key for all app data
        THEME: 'taskLoomTheme',
        LAST_SYNC: 'taskloomLastSync'
    }
};
