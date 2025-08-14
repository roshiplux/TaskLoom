// Mobile menu toggle
document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '70px';
    navLinks.style.left = '0';
    navLinks.style.width = '100%';
    navLinks.style.backgroundColor = 'white';
    navLinks.style.flexDirection = 'column';
    navLinks.style.padding = '1rem';
    navLinks.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    // Init Firebase (mandatory)
    if (window.FirebaseService) await FirebaseService.init();

    // Landing page buttons
    const gBtns = [document.getElementById('googleAuthBtn'), document.getElementById('googleAuthBtnHero'), document.getElementById('googleAuthBtnCta')].filter(Boolean);
    gBtns.forEach(btn => btn.addEventListener('click', async () => {
        try {
            btn.disabled = true; btn.textContent = 'Signing in...';
            await FirebaseService.signInWithGoogle();
            NotificationService.show('✅ Signed in', 'success');
            setTimeout(()=> window.location.replace('calendar.html'), 400);
        } catch(e){
            NotificationService.show('❌ Sign in failed', 'error');
            btn.disabled = false; btn.textContent = 'Sign In';
        }
    }));

    // Profile dropdown interactions
    const userInfo = document.getElementById('userInfo');
    const profileMenu = document.getElementById('profileMenu');
    if (userInfo && profileMenu) {
        const toggleMenu = (open) => {
            if (open) {
                userInfo.classList.add('open');
                profileMenu.classList.remove('hidden');
                userInfo.setAttribute('aria-expanded','true');
            } else {
                userInfo.classList.remove('open');
                profileMenu.classList.add('hidden');
                userInfo.setAttribute('aria-expanded','false');
            }
        };
        userInfo.addEventListener('click', (e) => {
            // Ignore clicks on buttons inside menu (they have their own handlers)
            if (e.target.closest('#profileMenu')) return;
            const isOpen = userInfo.classList.contains('open');
            toggleMenu(!isOpen);
        });
        document.addEventListener('click', (e) => {
            if (!userInfo.contains(e.target)) toggleMenu(false);
        });
    const signOutAction = async () => { toggleMenu(false); await FirebaseService.signOut(); window.location.replace('index.html'); };
        const signOutBtnMenu = document.getElementById('menuSignOut');
        const cloudSyncBtn = document.getElementById('menuCloudSync');
        const realtimeBtn = document.getElementById('menuRealtime');
        if (signOutBtnMenu) signOutBtnMenu.addEventListener('click', signOutAction);
        if (cloudSyncBtn) cloudSyncBtn.addEventListener('click', async () => {
            toggleMenu(false);
            try {
                if (FirebaseService && FirebaseService.user) {
                    await FirebaseService.saveAllDataSnapshot(StorageService.getAllData());
                    NotificationService.show('☁️ Synced to Firestore', 'success');
                } else {
                    NotificationService.show('⚠️ Sign into Firebase first', 'warning');
                }
            } catch(e){ NotificationService.show('❌ Firestore sync failed', 'error'); }
        });
        if (realtimeBtn) realtimeBtn.addEventListener('click', async () => {
            const enabled = realtimeBtn.getAttribute('data-enabled') === 'true';
            if (!enabled) {
                if (!FirebaseService.user) {
                    await FirebaseService.signInWithGoogle([]).catch(()=>{});
                }
                FirebaseService.startRealtime(data => {
                    // Merge remote data into local
                    StorageService.setAllData({
                        monthlyTasks: data.monthlyTasks || [],
                        dailyTasks: data.dailyTasks || {}
                    });
                    document.dispatchEvent(new CustomEvent('data-imported'));
                    NotificationService.show('🔄 Realtime update', 'info');
                });
                realtimeBtn.setAttribute('data-enabled','true');
                realtimeBtn.textContent = '⚡ Realtime: On';
                NotificationService.show('⚡ Realtime enabled', 'success');
            } else {
                FirebaseService.stopRealtime();
                realtimeBtn.setAttribute('data-enabled','false');
                realtimeBtn.textContent = '⚡ Realtime: Off';
                NotificationService.show('⏹️ Realtime disabled', 'info');
            }
        });
    }

    // When Firebase auth ready load Firestore data
    document.addEventListener('firebase-auth-ready', async () => {
        try {
            const snapshot = await FirebaseService.loadAllDataSnapshot();
            if (snapshot) {
                StorageService.setAllData({
                    monthlyTasks: snapshot.monthlyTasks || [],
                    dailyTasks: snapshot.dailyTasks || {}
                });
                document.dispatchEvent(new CustomEvent('data-imported'));
                NotificationService.show('☁️ Data loaded from Firestore', 'success');
            }
        } catch (e) {
            console.warn('No Firestore data yet:', e.message);
        }
        // Show profile header regardless
        try {
            const u = FirebaseService.user; if (u) {
                const nameEl = document.getElementById('userName');
                const photoEl = document.getElementById('userPhoto');
                if (nameEl) nameEl.textContent = u.displayName || 'User';
                if (photoEl && u.photoURL) photoEl.src = u.photoURL;
                if (userInfo) userInfo.style.display = 'flex';
            }
        } catch(_){}
    });
});
