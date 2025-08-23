// Firebase Service scaffold
// This module initializes Firebase and provides Auth + Firestore helpers.
// Fill real config values in CONFIG.FIREBASE before enabling.

class FirebaseService {
  static initialized = false;
  static app = null;
  static auth = null;
  static db = null;
  static user = null;

  static async loadSdk() {
    if (window.firebase?.apps?.length) return;
    const scripts = [
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
    ];
    for (const src of scripts) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src));
        document.head.appendChild(s);
      });
    }
  }

  static async init() {
    if (this.initialized) return;
    await this.loadSdk();
    const cfg = CONFIG.FIREBASE;
    if (!cfg || cfg.API_KEY.startsWith('YOUR_')) {
      console.warn('Firebase config not set. Skipping Firebase init.');
      return;
    }
    this.app = firebase.initializeApp({
      apiKey: cfg.API_KEY,
      authDomain: cfg.AUTH_DOMAIN,
      projectId: cfg.PROJECT_ID,
      storageBucket: cfg.STORAGE_BUCKET,
      messagingSenderId: cfg.MESSAGING_SENDER_ID,
      appId: cfg.APP_ID
    });
    this.auth = firebase.auth();
    this.db = firebase.firestore();

    this.auth.onAuthStateChanged(user => {
      this.user = user;
      if (user) {
        document.dispatchEvent(new CustomEvent('firebase-auth-ready', { detail: { user }}));
      } else {
        document.dispatchEvent(new CustomEvent('firebase-auth-signed-out'));
      }
    });

    this.initialized = true;
    console.log('Firebase initialized');
  }

  static async signInWithGoogle(additionalScopes = []) {
    await this.init();
    const provider = new firebase.auth.GoogleAuthProvider();
    // Always include calendar scope for automatic event creation and reading
    provider.addScope('https://www.googleapis.com/auth/calendar');
    additionalScopes.forEach(scope => provider.addScope(scope));
    const result = await this.auth.signInWithPopup(provider);
    const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
    this.googleAccessToken = credential && credential.accessToken;
    try { sessionStorage.setItem('taskloomFirebaseSignedIn','1'); } catch(_){}
    return result.user;
  }

  static async signOut() {
    if (!this.auth) return;
    await this.auth.signOut();
    this.googleAccessToken = null;
    try { sessionStorage.removeItem('taskloomFirebaseSignedIn'); } catch(_){}
  }

  // Firestore task collections (future wiring)
  static tasksCollection() {
    if (!this.user) return null;
    return this.db.collection('users').doc(this.user.uid).collection('tasks');
  }

  static async saveAllDataSnapshot(appData) {
    const col = this.tasksCollection();
    if (!col) throw new Error('No user');
    const batch = this.db.batch();
    const metaRef = col.doc('_meta');
  const updated = new Date().toISOString();
  batch.set(metaRef, { updated, version: 1 });
    // Simplified: store whole blob in one doc (optimize later)
    const blobRef = col.doc('appData');
  batch.set(blobRef, { ...appData, updated });
    await batch.commit();
  }

  static async loadAllDataSnapshot() {
    const col = this.tasksCollection();
    if (!col) return null;
    const blob = await col.doc('appData').get();
    if (!blob.exists) return null;
    return blob.data();
  }

  // Realtime
  static _unsubscribe = null;
  static startRealtime(onUpdate) {
    if (this._unsubscribe || !this.user) return;
    const col = this.tasksCollection();
    this._unsubscribe = col.doc('appData').onSnapshot(doc => {
      if (!doc.exists) return;
      try {
        const data = doc.data();
        if (!data) return;
        onUpdate && onUpdate(data);
      } catch(e){ console.warn('Realtime parse failed', e); }
    });
  }
  static stopRealtime() {
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
  }
}

window.FirebaseService = FirebaseService;
