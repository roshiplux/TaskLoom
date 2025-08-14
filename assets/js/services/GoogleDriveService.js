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
            if (!window.google || !window.google.accounts) throw new Error('Google Identity Services not loaded.');

            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE.CLIENT_ID,
                scope: CONFIG.GOOGLE.SCOPES,
                callback: (response) => {
                    if (response.error) {
                        console.log('Token request error:', response.error);
                        this.isSignedIn = false;
                        this.updateSignInButtonUI(true, false);
                        return;
                    }
                    this.accessToken = response.access_token;
                    gapi.client.setToken({ access_token: this.accessToken });
                    console.log('Access token received.');
                    this.handleSignInSuccess();
                }
            });

            console.log('GIS token client initialized successfully.');
            this.gapi_loaded = true;

            // Attempt token restore (same tab session only)
            const savedToken = sessionStorage.getItem('taskloomAccessToken');
            const savedExpiry = parseInt(sessionStorage.getItem('taskloomAccessTokenExpiry') || '0', 10);
            if (savedToken && savedExpiry && Date.now() < savedExpiry) {
                this.accessToken = savedToken;
                gapi.client.setToken({ access_token: this.accessToken });
                try {
                    const raw = sessionStorage.getItem('taskloomUserProfile');
                    if (raw) this.userProfile = JSON.parse(raw);
                } catch (_) {}
                this.isSignedIn = true;
                this.updateSignInButtonUI(true, true);
                // Start background sync without re-prompt
                this.loadFromGoogle();
                this.startPolling();
            } else {
                // No valid token; show signed-out UI (no automatic popup)
                this.isSignedIn = false;
                this.updateSignInButtonUI(true, false);
            }
        } catch (error) {
            console.error('GIS client initialization failed:', error);
            this.updateSignInButtonUI(false);
            throw error;
        }
    }

    // Helper to update the sign-in button UI
    updateSignInButtonUI(isAvailable, isSignedIn = false) {
        const signInBtn = document.getElementById('googleSignInBtn');
        const userInfo = document.getElementById('userInfo');
        const signOutBtn = document.getElementById('googleSignOutBtn');

        // Do nothing if the elements aren't on the current page
        if (!signInBtn || !userInfo || !signOutBtn) return;

        if (isSignedIn) {
            signInBtn.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userInfo.style.display = 'flex';
            signOutBtn.style.display = 'inline-block';
        } else {
            signInBtn.classList.remove('hidden');
            userInfo.classList.add('hidden');
            userInfo.style.display = 'none';
            signOutBtn.style.display = 'none';
            if (isAvailable) {
                signInBtn.innerHTML = '<i class="fab fa-google"></i> Connect Drive';
                signInBtn.disabled = false;
            } else {
                signInBtn.innerHTML = '❌ Drive N/A';
                signInBtn.disabled = true;
            }
        }
    }

    // Sign in to Google (New GIS method)
    async signIn() {
        if (!this.gapi_loaded) {
            NotificationService.show('⚠️ Google services are not available. Your data will be saved locally.', 'warning');
            return;
        }
        
        try {
            const btn = document.getElementById('googleSignInBtn');
            if (btn) {
                btn.innerHTML = '⏳ Connecting...';
                btn.disabled = true;
            }
            
            // Request access token using new GIS, with consent prompt for manual sign-in
            this.tokenClient.requestAccessToken({prompt: 'consent'});
            
        } catch (error) {
            console.error('Sign in failed:', error);
            this.updateSignInButtonUI(true, false);
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
            
            document.getElementById('userName').textContent = this.userProfile.name;
            document.getElementById('userPhoto').src = this.userProfile.picture;
            
            this.isSignedIn = true;
            // Persist minimal profile and access token (session only) with naive expiry (55 min)
            try {
                const EXPIRY_MS = 55 * 60 * 1000; // slightly less than 1h
                sessionStorage.setItem('taskloomSignedIn', '1');
                sessionStorage.setItem('taskloomUserProfile', JSON.stringify({ name: this.userProfile.name, picture: this.userProfile.picture }));
                sessionStorage.setItem('taskloomAccessToken', this.accessToken);
                sessionStorage.setItem('taskloomAccessTokenExpiry', (Date.now() + EXPIRY_MS).toString());
            } catch (_) {}
            this.updateSignInButtonUI(true, true);
            NotificationService.show(`✅ Signed in as ${this.userProfile.name}`, 'success');
            
            // After successful sign-in, load data and start polling
            await this.loadFromGoogle();
            this.startPolling();

            // Persist flag to skip landing in future sessions
            try { localStorage.setItem('taskloomSkipLanding', '1'); } catch(_) {}

            // If currently on landing (index.html), redirect user into app automatically
            try {
                const path = window.location.pathname.toLowerCase();
                if (/(?:^|\/)(index\.html)?$/.test(path)) {
                    setTimeout(()=> { window.location.href = 'calendar.html'; }, 600);
                }
            } catch(_) {}
            
        } catch (error) {
            console.error('Failed to get user info:', error);
            this.updateSignInButtonUI(true, false);
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
            
            this.isSignedIn = false;
            try {
                sessionStorage.removeItem('taskloomSignedIn');
                sessionStorage.removeItem('taskloomUserProfile');
                sessionStorage.removeItem('taskloomAccessToken');
                sessionStorage.removeItem('taskloomAccessTokenExpiry');
            } catch (_) {}
            this.updateSignInButtonUI(true, false);
            this.stopPolling();
            NotificationService.show('👋 Signed out successfully', 'success');
            
        } catch (error) {
            console.error('Sign out failed:', error);
            NotificationService.show('⚠️ Sign out failed', 'error');
        }
    }

        // Sync data with Google Drive
    async syncWithGoogle() {
        if (!this.isSignedIn || !this.gapi_loaded || !this.accessToken) {
            return;
        }

        try {
            const dataToSync = StorageService.getAllData();
            const data = JSON.stringify({
                ...dataToSync,
                lastSync: new Date().toISOString()
            });

            const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${CONFIG.GOOGLE.FILE_NAME}' and parents in 'appDataFolder'&spaces=appDataFolder&fields=files(id,name)`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });

            if (!listResponse.ok) {
                throw new Error(`Failed to list files: ${await listResponse.text()}`);
            }
            const listResult = await listResponse.json();
            let metadata;
            let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            let method = 'POST';

            if (listResult.files && listResult.files.length > 0) {
                const fileId = listResult.files[0].id;
                metadata = { name: CONFIG.GOOGLE.FILE_NAME };
                uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
                method = 'PATCH';
            } else {
                metadata = { name: CONFIG.GOOGLE.FILE_NAME, parents: ['appDataFolder'] };
            }
            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const close_delim = `\r\n--${boundary}--`;

            const multipartRequestBody =
                delimiter +
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

            localStorage.setItem(CONFIG.STORAGE.LAST_SYNC, new Date().toISOString());
            console.log('Sync successful at', new Date().toLocaleTimeString());

        } catch (error) {
            console.error('Sync failed:', error);
            NotificationService.show('❌ Sync failed. Check your connection.', 'error');
        }
    }

    // Load data from Google Drive
    async loadFromGoogle() {
        if (!this.isSignedIn || !this.gapi_loaded || !this.accessToken) return;

        console.log('Attempting to load data from Google Drive...');
        try {
            const listResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${CONFIG.GOOGLE.FILE_NAME}' and parents in 'appDataFolder'&spaces=appDataFolder&fields=files(id,name)`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            const listResult = await listResponse.json();

            if (listResult.files && listResult.files.length > 0) {
                const fileId = listResult.files[0].id;
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });

                if (!fileResponse.ok) {
                    throw new Error(`Failed to get file content: ${fileResponse.statusText}`);
                }

                const fileBody = await fileResponse.text();
                if (!fileBody || fileBody.trim() === '') {
                    console.warn('Data file from Drive is empty. Using local data.');
                    NotificationService.show('📁 No backup data found in Google Drive. Starting fresh.', 'info');
                    await this.syncWithGoogle();
                    return;
                }

                const loadedData = JSON.parse(fileBody);
                
                const dataToLoad = {
                    monthlyTasks: loadedData.monthlyTasks || [],
                    dailyTasks: loadedData.dailyTasks || {}
                };

                StorageService.setAllData(dataToLoad);
                document.dispatchEvent(new CustomEvent('google-drive-data-loaded'));

                const lastSync = loadedData.lastSync ? new Date(loadedData.lastSync).toLocaleString() : 'Unknown';
                NotificationService.show(`📥 Data loaded from Google Drive (Last sync: ${lastSync})`, 'success');
            } else {
                NotificationService.show('📁 No backup found in Google Drive. Syncing current data.', 'info');
                await this.syncWithGoogle();
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

    // Switch account: force user to choose account again
    switchAccount() {
        if (!this.gapi_loaded || !this.tokenClient) {
            NotificationService.show('⚠️ Google not ready yet', 'warning');
            return;
        }
        // Clear current session state but keep UI signed-out to prompt selection
        this.signOut();
        // After brief delay, open consent with select_account prompt
        setTimeout(() => {
            try {
                this.tokenClient.requestAccessToken({ prompt: 'select_account consent' });
            } catch (e) {
                console.error('Switch account failed:', e);
                NotificationService.show('❌ Switch account failed', 'error');
            }
        }, 400);
    }
}

// Restore UI state quickly on navigation before scripts request a new sign-in
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (sessionStorage.getItem('taskloomSignedIn') === '1') {
            const raw = sessionStorage.getItem('taskloomUserProfile');
            if (raw) {
                const profile = JSON.parse(raw);
                window.__taskloomRestoredProfile = profile;
                const userNameEl = document.getElementById('userName');
                const userPhotoEl = document.getElementById('userPhoto');
                if (userNameEl && userPhotoEl) {
                    userNameEl.textContent = profile.name || '';
                    userPhotoEl.src = profile.picture || '';
                    const signInBtn = document.getElementById('googleSignInBtn');
                    const userInfo = document.getElementById('userInfo');
                    const signOutBtn = document.getElementById('googleSignOutBtn');
                    if (signInBtn && userInfo && signOutBtn) {
                        signInBtn.style.display = 'none';
                        userInfo.style.display = 'flex';
                        signOutBtn.style.display = 'inline-block';
                    }
                }
            }
        }
    } catch (_) {}
});
