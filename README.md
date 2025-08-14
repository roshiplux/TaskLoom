# TaskLoom

Modern multi‑page task & productivity app with:
* Monthly calendar + daily task manager
* Local + Google Drive backup sync
* Optional Firebase (Auth + Firestore) snapshot & realtime sync
* On‑demand Google Calendar event creation per task (incremental scope)
* Profile dropdown (switch account, manual sync, realtime toggle)

---
## Current Structure

```
TaskLoom/
├── index.html          # Landing (auto-skipped after first sign-in unless ?showLanding)
├── calendar.html       # Monthly calendar + monthly TODO list
├── daily.html          # Daily task manager
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── main.js                 # Global bootstrapping (Google, Firebase hooks, menu actions)
│       ├── calendar.js             # Calendar + monthly tasks UI
│       ├── daily.js                # Daily tasks UI
│       └── services/
│           ├── StorageService.js   # Unified local data (monthlyTasks[], dailyTasks{date:[]})
│           ├── GoogleDriveService.js # Drive appDataFolder sync + auth UI
│           ├── FirebaseService.js  # Firebase Auth + Firestore (snapshot + realtime)
│           ├── CalendarService.js  # Incremental Google Calendar API usage
│           └── NotificationService.js
```

Legacy / experimental files (may be pruned later): `UIService.js`, `debug-google.html`.

---
## Data Model

```jsonc
{
    "monthlyTasks": [ { "text": "Pay rent", "done": false } ],
    "dailyTasks": {
        "2025-08-12": [ { "text": "Email client", "done": false, "category": "work", "calendarEventId": "optional" } ]
    }
}
```

Stored locally in `localStorage` under `taskloomAppData_v3` then synced:
* Google Drive: single JSON file in `appDataFolder` (`taskloom-data-v3.json`)
* Firestore: single `appData` document per user (for now)

---
## Sync Layers

| Layer | Purpose | Trigger | Notes |
|-------|---------|---------|-------|
| Local Storage | Fast offline cache | Every CRUD | Source of truth in browser session |
| Google Drive  | Off-device backup  | Debounced after changes / manual | Minimal scopes; polling interval configurable |
| Firestore (optional) | Cross-device realtime | Manual enable (Realtime toggle) | Realtime listener merges remote -> local |
| Calendar (optional) | Individual task scheduling | Per-task “📅” button | Incremental consent; stores `calendarEventId` |

Conflict strategy (current): last writer wins. (Enhancements: version & merge roadmap.)

---
## Auth & Permissions

Base scopes (Drive + profile) loaded at initial sign-in. Calendar scope requested only when the user first creates a Calendar event. Firebase Auth (if configured) uses Google provider; Firestore operations require successful Firebase login.

---
## Configuration (`assets/js/config.js`)

Fill in:
```js
FIREBASE: {
    API_KEY: '...',
    AUTH_DOMAIN: 'your-project.firebaseapp.com',
    PROJECT_ID: 'your-project',
    STORAGE_BUCKET: 'your-project.appspot.com',
    MESSAGING_SENDER_ID: '...',
    APP_ID: '...'
}
```
Do NOT check real secrets into public repos unless they are client public keys (Firebase web keys are public but still treat with care).

---
## Key Services Summary

| Service | Highlights |
|---------|-----------|
| StorageService | Unified in-memory + localStorage; fires events (`data-imported`, etc.). |
| GoogleDriveService | GIS token client, session token reuse, file upload/download, polling. |
| FirebaseService | Lazy loads SDK, Auth state events, snapshot save/load, realtime subscription. |
| CalendarService | Incremental scope request, POST event to primary calendar. |
| NotificationService | Lightweight DOM toast messages. |

---
## User Flow
1. Open `index.html` (skipped to `calendar.html` after first sign-in unless `?showLanding`).
2. Sign in with Google (Drive backup ready).
3. (Optional) Enable Realtime → Firebase sign-in + listener.
4. Add tasks (daily/monthly) → automatic local + queued Drive sync.
5. Click 📅 on a daily task → create Calendar event (prompts for Calendar scope first time).
6. Use profile menu for manual sync, realtime toggle, switch account, sign out.

---
## Development Quick Start

1. Serve statically (e.g. VS Code Live Server) so OAuth origin matches allowed list.
2. Set Google OAuth Client ID + API key in config.
3. (Optional) Add your domain to Google Cloud Console + enable Drive & Calendar APIs.
4. (Optional) Create Firebase project & paste config values.
5. Open `calendar.html` → add tasks → verify Drive file appears (check Cloud Console / API Explorer).

---
## Incremental Calendar Scope Logic

Calendar scope isn’t requested at initial sign-in to reduce consent friction. First Calendar event creation triggers `tokenClient.requestAccessToken` with extra scope. UI remains functional if user declines (feature-level failure only).

---
## Realtime Mode

Enabled via profile menu toggle:
* Starts Firestore listener on `appData` doc.
* Incoming snapshot replaces local data (simple overwrite).
* Disable to stop listener & reduce quota.

Future enhancements: granular patching, optimistic merges, presence tracking.

---
## Roadmap Ideas
* Task labels / priorities with color legend
* Offline mutation queue -> Firestore merge timestamps
* Calendar bidirectional sync (update / delete events)
* Per‑task reminders via Cloud Functions + FCM
* Multi-user shared calendars / task boards
* Diff-based Drive sync to reduce upload size

---
## Contributing
Open an issue or submit PRs on feature branches (e.g. `feat/*`). Keep services focused; avoid coupling UI and sync logic.

---
## License
MIT (add a LICENSE file if distributing).

---
## Disclaimer
This is a client-side application; avoid storing sensitive data without adding proper encryption & backend validation.

Enjoy weaving your tasks! 🧵
