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

            // Set up Google provider
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
            heroSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Sign in button on other pages
        const signInBtn = document.getElementById('googleAuthBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    async signInWithGoogle() {
        if (!this.isInitialized) {
            console.error('Auth not initialized yet');
            return;
        }

        try {
            console.log('Starting Google sign-in...');
            
            // Show loading state
            this.showLoadingState();
            
            const result = await this.auth.signInWithPopup(this.googleProvider);
            const user = result.user;
            const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
            
            console.log('Sign-in successful:', user.displayName);
            
            // Store user info
            this.currentUser = user;
            
            // Store access token for Google API calls
            if (credential && credential.accessToken) {
                localStorage.setItem('googleAccessToken', credential.accessToken);
            }
            
            // Redirect to calendar page
            this.redirectToCalendar();
            
        } catch (error) {
            console.error('Sign-in error:', error);
            this.showErrorMessage('Sign-in failed: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            localStorage.removeItem('googleAccessToken');
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
            // User is signed in
            this.updateUIForSignedInUser(user);
        } else {
            // User is signed out
            this.updateUIForSignedOutUser();
        }
    }

    updateUIForSignedInUser(user) {
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

        // Show/hide appropriate elements
        const authContainer = document.getElementById('authContainer');
        const profileContainer = document.getElementById('profileContainer');
        const signInButtons = document.querySelectorAll('[id*="googleAuth"]');
        
        if (authContainer) authContainer.style.display = 'none';
        if (profileContainer) profileContainer.style.display = 'block';
        
        // Hide sign-in buttons
        signInButtons.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    }

    updateUIForSignedOutUser() {
        // Show/hide appropriate elements
        const authContainer = document.getElementById('authContainer');
        const profileContainer = document.getElementById('profileContainer');
        const signInButtons = document.querySelectorAll('[id*="googleAuth"]');
        
        if (authContainer) authContainer.style.display = 'block';
        if (profileContainer) profileContainer.style.display = 'none';
        
        // Show sign-in buttons
        signInButtons.forEach(btn => {
            if (btn) btn.style.display = 'inline-flex';
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
        // Redirect to calendar page after successful sign-in
        setTimeout(() => {
            window.location.href = 'calendar.html';
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