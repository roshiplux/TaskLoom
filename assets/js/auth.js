// TaskLoom Authentication System
// Google Sign-In with Firebase Auth

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Initialize Firebase Service first
            if (typeof FirebaseService !== 'undefined') {
                await FirebaseService.init();
            }
            
            // Wait for Firebase to be available
            if (typeof firebase === 'undefined') {
                console.log('Waiting for Firebase to load...');
                setTimeout(() => this.initializeAuth(), 100);
                return;
            }

            // Initialize Firebase Auth
            this.auth = firebase.auth();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });

            // Set up Google provider with all required scopes
            this.googleProvider = new firebase.auth.GoogleAuthProvider();
            this.googleProvider.addScope('profile');
            this.googleProvider.addScope('email');
            this.googleProvider.addScope('https://www.googleapis.com/auth/calendar');

            this.isInitialized = true;
            this.setupEventListeners();
            
            console.log('Auth system initialized successfully');
        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    }

    setupEventListeners() {
        // Sign in button on homepage
        const heroSignInBtn = document.getElementById('googleAuthBtnHero');
        if (heroSignInBtn) {
            console.log('✅ Found googleAuthBtnHero button, adding event listener');
            heroSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        } else {
            console.log('❌ googleAuthBtnHero button not found in DOM');
        }

        // Sign in button on other pages
        const signInBtn = document.getElementById('googleAuthBtn');
        if (signInBtn) {
            console.log('✅ Found googleAuthBtn button, adding event listener');
            signInBtn.addEventListener('click', () => this.signInWithGoogle());
        } else {
            console.log('❌ googleAuthBtn button not found in DOM');
        }

        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            console.log('✅ Found signOutBtn button, adding event listener');
            signOutBtn.addEventListener('click', () => this.signOut());
        } else {
            console.log('❌ signOutBtn button not found in DOM');
        }
    }

    async signInWithGoogle() {
        if (!this.isInitialized) {
            console.error('❌ Auth not initialized yet');
            return;
        }

        try {
            console.log('🚀 Starting Google sign-in...');
            
            // Show loading state
            this.showLoadingState();
            
            console.log('🔄 Opening Google OAuth popup...');
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
            
            console.log('✅ Sign-in successful:', user.displayName, user.email);
            
            // Store user info
            this.currentUser = user;
            
            // Store session info for calendar.html compatibility
            sessionStorage.setItem('taskloomFirebaseSignedIn', '1');
            console.log('🔄 Set session storage for calendar compatibility');
            
            // Store access token for Google API calls (including Calendar)
            if (credential && credential.accessToken) {
                localStorage.setItem('googleAccessToken', credential.accessToken);
                // Also store in FirebaseService for calendar integration
                if (typeof FirebaseService !== 'undefined') {
                    FirebaseService.googleAccessToken = credential.accessToken;
                }
                console.log('🔄 Stored Google access token with calendar permissions');
            }
            
            console.log('🔄 Initiating redirect to calendar...');
            // Redirect to calendar page
            this.redirectToCalendar();
            
        } catch (error) {
            console.error('❌ Sign-in error:', error);
            this.showErrorMessage('Sign-in failed: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            localStorage.removeItem('googleAccessToken');
            // Clear FirebaseService token
            if (typeof FirebaseService !== 'undefined') {
                FirebaseService.googleAccessToken = null;
            }
            console.log('User signed out successfully');
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    handleAuthStateChange(user) {
        console.log('Auth state changed:', user ? user.displayName : 'No user');
        
        this.currentUser = user;
        
        if (user) {
            // User is signed in - set session storage for calendar.html compatibility
            sessionStorage.setItem('taskloomFirebaseSignedIn', '1');
            // Restore access token if available
            const accessToken = localStorage.getItem('googleAccessToken');
            if (accessToken && typeof FirebaseService !== 'undefined') {
                FirebaseService.googleAccessToken = accessToken;
            }
            console.log('🔄 Set session storage for signed-in user');
            this.updateUIForSignedInUser(user);
        } else {
            // User is signed out - clear session storage and tokens
            sessionStorage.removeItem('taskloomFirebaseSignedIn');
            localStorage.removeItem('googleAccessToken');
            if (typeof FirebaseService !== 'undefined') {
                FirebaseService.googleAccessToken = null;
            }
            console.log('🔄 Cleared session storage for signed-out user');
            this.updateUIForSignedOutUser();
        }
    }

    updateUIForSignedInUser(user) {
        console.log('🔄 Updating UI for signed-in user:', user.email);
        
        const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '';
        
        // Update profile displays
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhoto = document.getElementById('profilePhoto');
        
        if (profileName) profileName.textContent = user.displayName || 'User';
        if (profileEmail) profileEmail.textContent = user.email || '';
        if (profilePhoto && user.photoURL) {
            profilePhoto.src = user.photoURL;
            profilePhoto.style.display = 'block';
        }

        // Show/hide appropriate elements (but not on index page)
        if (!isIndexPage) {
            const authContainer = document.getElementById('authContainer');
            const profileContainer = document.getElementById('profileContainer');
            const signInButtons = document.querySelectorAll('[id*="googleAuth"]');
            
            if (authContainer) {
                authContainer.style.display = 'none';
                console.log('🔄 Hiding authContainer');
            }
            if (profileContainer) {
                profileContainer.style.display = 'block';
                console.log('🔄 Showing profileContainer');
            }
            
            // Hide sign-in buttons on other pages
            signInButtons.forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                    console.log('🔄 Hiding sign-in button:', btn.id);
                }
            });
        } else {
            console.log('🔄 On index page - keeping sign-in buttons visible');
        }
    }

    updateUIForSignedOutUser() {
        console.log('🔄 Updating UI for signed-out user');
        
        // Show/hide appropriate elements
        const authContainer = document.getElementById('authContainer');
        const profileContainer = document.getElementById('profileContainer');
        const signInButtons = document.querySelectorAll('[id*="googleAuth"]');
        
        if (authContainer) {
            authContainer.style.display = 'block';
            console.log('🔄 Showing authContainer');
        }
        if (profileContainer) {
            profileContainer.style.display = 'none';
            console.log('🔄 Hiding profileContainer');
        }
        
        // Show sign-in buttons
        signInButtons.forEach(btn => {
            if (btn) {
                btn.style.display = 'inline-flex';
                console.log('🔄 Showing sign-in button:', btn.id);
            }
        });
    }

    showLoadingState() {
        const buttons = document.querySelectorAll('[id*="googleAuth"]');
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            }
        });
    }

    hideLoadingState() {
        const buttons = document.querySelectorAll('[id*="googleAuth"]');
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fab fa-google"></i> Sign In with Google';
            }
        });
    }

    showErrorMessage(message) {
        // Create or update error display
        let errorDiv = document.getElementById('authError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'authError';
            errorDiv.style.cssText = `
                background: #fee;
                color: #c33;
                padding: 12px;
                border-radius: 6px;
                margin: 10px 0;
                border: 1px solid #fcc;
            `;
            
            const heroButtons = document.querySelector('.hero-buttons');
            if (heroButtons) {
                heroButtons.appendChild(errorDiv);
            }
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }

    redirectToCalendar() {
        console.log('🔄 redirectToCalendar() called');
        console.log('🔄 Current location:', window.location.href);
        
        // Redirect to calendar page after successful sign-in
        setTimeout(() => {
            console.log('🔄 Executing redirect to calendar.html...');
            try {
                window.location.href = 'calendar.html';
                console.log('✅ Redirect initiated');
            } catch (error) {
                console.error('❌ Redirect failed:', error);
            }
        }, 1000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isSignedIn() {
        return !!this.currentUser;
    }

    getAccessToken() {
        return localStorage.getItem('googleAccessToken');
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Make auth manager globally available
window.AuthManager = AuthManager;