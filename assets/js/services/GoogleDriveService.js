// Google Drive Service Module
class GoogleDriveService {
    constructor() {
        this.isSignedIn = false;
        this.gapi_loaded = false;
        this.pollingTimer = null;
    }

    // Initialize Google API
    async initialize() {
        try {
            await new Promise((resolve) => {
                gapi.load('auth2:client', resolve);
            });
            
            await gapi.client.init({
                apiKey: CONFIG.GOOGLE.API_KEY,
                clientId: CONFIG.GOOGLE.CLIENT_ID,
                discoveryDocs: [CONFIG.GOOGLE.DISCOVERY_DOC],
                scope: CONFIG.GOOGLE.SCOPES
            });
            
            this.gapi_loaded = true;
            const authInstance = gapi.auth2.getAuthInstance();
            
            if (authInstance.isSignedIn.get()) {
                this.handleSignInSuccess();
                await this.loadFromGoogle();
                this.startPolling();
            }
            
            document.getElementById('googleSignIn').innerHTML = '🔗 Connect Google Drive';
            
        } catch (error) {
            console.log('Google API initialization failed - using local storage only');
            document.getElementById('googleSignIn').innerHTML = '❌ Google Drive Unavailable';
            document.getElementById('googleSignIn').disabled = true;
            document.getElementById('googleSignIn').className = 'px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-xl cursor-not-allowed';
        }
    }

    // Sign in to Google
    async signIn() {
        if (!this.gapi_loaded) {
            NotificationService.show('⚠️ Google services are not available. Your data will be saved locally.', 'warning');
            return;
        }
        
        try {
            document.getElementById('googleSignIn').innerHTML = '⏳ Connecting...';
            document.getElementById('googleSignIn').disabled = true;
            
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signIn();
            this.handleSignInSuccess();
            
            await this.loadFromGoogle();
            await this.syncWithGoogle();
            
            NotificationService.show('✅ Connected to Google Drive successfully!', 'success');
            
        } catch (error) {
            console.error('Sign in failed:', error);
            
            document.getElementById('googleSignIn').innerHTML = '🔗 Connect Google Drive';
            document.getElementById('googleSignIn').disabled = false;
            
            if (error.error === 'popup_closed_by_user') {
                NotificationService.show('⚠️ Sign in was cancelled', 'warning');
            } else {
                NotificationService.show('❌ Sign in failed. Using local storage only.', 'error');
            }
        }
    }

    // Handle successful sign in
    handleSignInSuccess() {
        const authInstance = gapi.auth2.getAuthInstance();
        const user = authInstance.currentUser.get();
        const profile = user.getBasicProfile();
        
        document.getElementById('googleSignIn').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('userName').textContent = profile.getName();
        document.getElementById('userEmail').textContent = profile.getEmail();
        document.getElementById('userPhoto').src = profile.getImageUrl();
        
        UIService.updateGoogleStatus(true, profile.getName(), profile.getEmail());
        
        this.isSignedIn = true;
        this.startPolling();
    }

    // Sign out from Google
    async signOut() {
        try {
            if (this.gapi_loaded) {
                const authInstance = gapi.auth2.getAuthInstance();
                await authInstance.signOut();
            }
            
            document.getElementById('googleSignIn').classList.remove('hidden');
            document.getElementById('googleSignIn').innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google
            `;
            document.getElementById('googleSignIn').disabled = false;
            document.getElementById('userInfo').classList.add('hidden');
            
            UIService.updateGoogleStatus(false);
            
            this.isSignedIn = false;
            this.stopPolling();
            NotificationService.show('👋 Signed out successfully', 'success');
            
        } catch (error) {
            console.error('Sign out failed:', error);
            NotificationService.show('⚠️ Sign out failed', 'error');
        }
    }

    // Sync data with Google Drive
    async syncWithGoogle() {
        if (!this.isSignedIn || !this.gapi_loaded) {
            NotificationService.show('⚠️ Not connected to Google Drive', 'warning');
            return;
        }
        
        try {
            const syncButton = event?.target;
            if (syncButton) {
                syncButton.innerHTML = '⏳ Syncing...';
                syncButton.disabled = true;
            }
            
            const data = JSON.stringify({
                monthlyTasks: TaskManager.monthlyTasks,
                mainTasks: TaskManager.mainTasks,
                monthlyTodoTasks: TaskManager.monthlyTodoTasks,
                lastSync: new Date().toISOString()
            });
            
            const metadata = {
                name: 'taskloom-data.json',
                parents: ['appDataFolder']
            };
            
            const response = await gapi.client.drive.files.list({
                q: "name='taskloom-data.json' and parents in 'appDataFolder'",
                spaces: 'appDataFolder'
            });
            
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            const body = delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                data +
                close_delim;
            
            if (response.result.files.length > 0) {
                await gapi.client.request({
                    path: `https://www.googleapis.com/upload/drive/v3/files/${response.result.files[0].id}`,
                    method: 'PATCH',
                    params: { uploadType: 'multipart' },
                    headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    body: body
                });
            } else {
                await gapi.client.request({
                    path: 'https://www.googleapis.com/upload/drive/v3/files',
                    method: 'POST',
                    params: { uploadType: 'multipart' },
                    headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    body: body
                });
            }
            
            if (syncButton) {
                syncButton.innerHTML = '🔄 Sync';
                syncButton.disabled = false;
            }
            
            localStorage.setItem(CONFIG.STORAGE.LAST_SYNC, new Date().toISOString());
            UIService.updateSettingsInfo();
            
            NotificationService.show('✅ Data synced to Google Drive!', 'success');
            
        } catch (error) {
            console.error('Sync failed:', error);
            
            if (syncButton) {
                syncButton.innerHTML = '🔄 Sync';
                syncButton.disabled = false;
            }
            
            NotificationService.show('❌ Sync failed. Check your connection.', 'error');
        }
    }

    // Load data from Google Drive
    async loadFromGoogle() {
        if (!this.isSignedIn || !this.gapi_loaded) return;
        
        try {
            const response = await gapi.client.drive.files.list({
                q: "name='taskloom-data.json' and parents in 'appDataFolder'",
                spaces: 'appDataFolder'
            });
            
            if (response.result.files.length > 0) {
                const fileId = response.result.files[0].id;
                const file = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                
                const loadedData = JSON.parse(file.body);
                
                if (loadedData.monthlyTasks) {
                    TaskManager.monthlyTasks = { ...TaskManager.monthlyTasks, ...loadedData.monthlyTasks };
                }
                if (loadedData.mainTasks) {
                    const existingIds = new Set(TaskManager.mainTasks.map(t => t.id));
                    const newTasks = loadedData.mainTasks.filter(t => !existingIds.has(t.id));
                    TaskManager.mainTasks = [...TaskManager.mainTasks, ...newTasks];
                }
                if (loadedData.monthlyTodoTasks) {
                    TaskManager.monthlyTodoTasks = { ...TaskManager.monthlyTodoTasks, ...loadedData.monthlyTodoTasks };
                }
                
                StorageService.saveLocalData();
                CalendarRenderer.renderCalendar();
                StatsManager.updateMonthlyStats();
                TaskRenderer.renderMainTasks();
                TaskRenderer.renderMonthlyTodoList();
                
                const lastSync = loadedData.lastSync ? new Date(loadedData.lastSync).toLocaleString() : 'Unknown';
                NotificationService.show(`📥 Data loaded from Google Drive (Last sync: ${lastSync})`, 'success');
            } else {
                NotificationService.show('📁 No backup found in Google Drive', 'info');
            }
        } catch (error) {
            console.error('Load from Google failed:', error);
            NotificationService.show('❌ Failed to load from Google Drive', 'error');
        }
    }

    // Start polling for Google Drive updates
    startPolling() {
        if (this.pollingTimer) clearInterval(this.pollingTimer);
        this.pollingTimer = setInterval(async () => {
            if (this.isSignedIn && this.gapi_loaded) {
                await this.loadFromGoogle();
            }
        }, CONFIG.APP.POLLING_INTERVAL);
    }

    // Stop polling when signed out
    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
    }
}
