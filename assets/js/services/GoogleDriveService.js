// Google Drive Service Module (New Google Identity Services)
class GoogleDriveService {
    constructor() {
        this.isSignedIn = false;
        this.gapi_loaded = false;
        this.pollingTimer = null;
        this.tokenClient = null;
        this.accessToken = null;
        this.userProfile = null;
    }

    // Check if current domain is allowed for Google OAuth
    isDomainAllowed() {
        const currentOrigin = window.location.origin;
        const allowedDomains = CONFIG.APP.ALLOWED_DOMAINS;
        
        return allowedDomains.some(domain => 
            currentOrigin.startsWith(domain) || 
            currentOrigin === domain ||
            domain.includes(window.location.hostname)
        );
    }

    // Initialize GAPI client
    async initializeGapiClient() {
        try {
            console.log('Starting GAPI client initialization...');
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('gapi.load timeout')), 10000);
                gapi.load('client', {
                    callback: () => { clearTimeout(timeout); resolve(); },
                    onerror: () => { clearTimeout(timeout); reject(new Error('Failed to load gapi client')); }
                });
            });
            
            // This is now a dummy function as we are not using gapi.client for requests.
            // We still need to initialize the client for gapi.client.setToken to work.
            await gapi.client.init({
                apiKey: CONFIG.GOOGLE.API_KEY,
            });
            console.log('GAPI client initialized for token handling.');
            
        } catch (error) {
            console.error('GAPI client initialization failed:', error);
            throw error; // Re-throw to be caught by the main app initializer
        }
    }

    // Initialize Google Identity Services token client
    initializeGisClient() {
        try {
            console.log('Initializing Google Identity Services (GIS)...');
            
            if (!window.google || !window.google.accounts) {
                throw new Error('Google Identity Services not loaded.');
            }
            
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE.CLIENT_ID,
                scope: CONFIG.GOOGLE.SCOPES,
                callback: (response) => {
                    // This callback handles both silent and manual sign-in responses.
                    if (response.error) {
                        // If the silent sign-in fails, we don't show an error.
                        // The user simply needs to sign in manually.
                        console.log('Silent sign-in failed or user not signed in.', response.error);
                        // Ensure the sign-in button is visible and enabled for manual sign-in.
                        this.updateSignInButtonUI(true); 
                        return;
                    }
                    
                    this.accessToken = response.access_token;
                    gapi.client.setToken({ access_token: this.accessToken });
                    
                    console.log('Access token received.');
                    this.handleSignInSuccess();
                },
            });
            
            console.log('GIS token client initialized successfully.');
            this.gapi_loaded = true;

            // Attempt a silent sign-in on page load
            this.tokenClient.requestAccessToken({prompt: 'none'});
            
        } catch (error) {
            console.error('GIS client initialization failed:', error);
            this.updateSignInButtonUI(false); // Show unavailable state
            throw error;
        }
    }

    // Helper to update the sign-in button UI
    updateSignInButtonUI(isAvailable) {
        const signInBtn = document.getElementById('googleSignIn');
        if (isAvailable) {
            signInBtn.innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Drive
            `;
            signInBtn.disabled = false;
            signInBtn.className = 'px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md flex items-center gap-2';
            NotificationService.show('✅ Google Drive is ready to connect!', 'success');
        } else {
            signInBtn.innerHTML = '❌ Google Drive Unavailable';
            signInBtn.disabled = true;
            signInBtn.className = 'px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-xl cursor-not-allowed';
        }
    }

    // Sign in to Google (New GIS method)
    async signIn() {
        if (!this.gapi_loaded) {
            NotificationService.show('⚠️ Google services are not available. Your data will be saved locally.', 'warning');
            return;
        }
        
        try {
            document.getElementById('googleSignIn').innerHTML = '⏳ Connecting...';
            document.getElementById('googleSignIn').disabled = true;
            
            // Request access token using new GIS, with consent prompt for manual sign-in
            this.tokenClient.requestAccessToken({prompt: 'consent'});
            
        } catch (error) {
            console.error('Sign in failed:', error);
            
            document.getElementById('googleSignIn').innerHTML = `
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect Google Drive
            `;
            document.getElementById('googleSignIn').disabled = false;
            
            if (error.error === 'popup_closed_by_user') {
                NotificationService.show('⚠️ Sign in was cancelled', 'warning');
            } else {
                NotificationService.show('❌ Sign in failed. Using local storage only.', 'error');
            }
        }
    }

    // Handle successful sign in
    async handleSignInSuccess() {
        try {
            // Get user info using the new token
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }
            
            this.userProfile = await response.json();
            
            document.getElementById('googleSignIn').classList.add('hidden');
            document.getElementById('userInfo').classList.remove('hidden');
            document.getElementById('userName').textContent = this.userProfile.name;
            document.getElementById('userEmail').textContent = this.userProfile.email;
            document.getElementById('userPhoto').src = this.userProfile.picture;
            
            UIService.updateGoogleStatus(true, this.userProfile.name, this.userProfile.email);
            
            this.isSignedIn = true;
            
            // After successful sign-in, load data and start polling
            await this.loadFromGoogle();
            this.startPolling();
            
        } catch (error) {
            console.error('Failed to get user info:', error);
            NotificationService.show('⚠️ Connected but failed to get user info', 'warning');
        }
    }

    // Sign out from Google
    async signOut() {
        try {
            // Revoke the token
            if (this.accessToken) {
                google.accounts.oauth2.revoke(this.accessToken);
            }
            
            gapi.client.setToken(null);
            this.accessToken = null;
            this.userProfile = null;
            
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
    async syncWithGoogle(event) {
        if (!this.isSignedIn || !this.gapi_loaded || !this.accessToken) {
            NotificationService.show('⚠️ Not connected to Google Drive', 'warning');
            return;
        }
        
        const syncButton = event ? event.target : document.getElementById('syncButton');

        try {
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
            
            // Use fetch for listing files
            const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='taskloom-data.json' and parents in 'appDataFolder'&spaces=appDataFolder&fields=files(id,name)`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            const listResult = await listResponse.json();

            let metadata;
            let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            let method = 'POST';

            if (listResult.files && listResult.files.length > 0) {
                // File exists: UPDATE the file.
                // The 'parents' field is not allowed in an update (PATCH) request.
                metadata = {
                    name: 'taskloom-data.json'
                };
                const fileId = listResult.files[0].id;
                uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
                method = 'PATCH';
            } else {
                // File does not exist: CREATE the file.
                // The 'parents' field is required for creation.
                metadata = {
                    name: 'taskloom-data.json',
                    parents: ['appDataFolder']
                };
            }

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";
            
            const multipartRequestBody = delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                data +
                close_delim;
            
            const uploadResponse = await fetch(uploadUrl, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': `multipart/related; boundary="${boundary}"`
                },
                body: multipartRequestBody
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${await uploadResponse.text()}`);
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
        if (!this.isSignedIn || !this.gapi_loaded || !this.accessToken) return;
        
        console.log('Attempting to load data from Google Drive...');
        try {
            // Use fetch for listing files
            const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='taskloom-data.json' and parents in 'appDataFolder'&spaces=appDataFolder&fields=files(id,name)`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            const listResult = await listResponse.json();
            
            console.log('Drive files.list response:', listResult);

            if (listResult.files && listResult.files.length > 0) {
                const fileId = listResult.files[0].id;
                console.log(`Found data file with ID: ${fileId}`);

                // Use fetch for getting file content
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                
                if (!fileResponse.ok) {
                    throw new Error(`Failed to get file content: ${fileResponse.statusText}`);
                }

                const fileBody = await fileResponse.text();
                
                if (!fileBody || fileBody.trim() === '') {
                    console.warn('Data file is empty. Using local data.');
                    NotificationService.show('📁 No backup data found in Google Drive. Starting fresh.', 'info');
                    return;
                }
                
                console.log('File body received:', fileBody);
                const loadedData = JSON.parse(fileBody);
                console.log('Successfully parsed data from Drive:', loadedData);
                
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
            if (this.isSignedIn && this.gapi_loaded && this.accessToken) {
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
