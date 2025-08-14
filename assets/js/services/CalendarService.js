// Google Calendar integration scaffold
// Provides opt-in calendar event creation for tasks.

class CalendarService {
  static _cache = { rangeKey: null, events: [] };

  static async fetchEvents(startISO, endISO) {
    if (!FirebaseService.user || !FirebaseService.googleAccessToken) return [];
    const rangeKey = startISO + '|' + endISO;
    if (this._cache.rangeKey === rangeKey && this._cache.events.length) return this._cache.events;
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', startISO);
    url.searchParams.set('timeMax', endISO);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    try {
      console.log('Fetching calendar events for range:', startISO, 'to', endISO);
      let res = await fetch(url.toString(), { headers: { 'Authorization': 'Bearer ' + FirebaseService.googleAccessToken } });
      if (res.status === 401 || res.status === 403) {
        console.log('Calendar auth failed, attempting re-consent...');
        // Attempt re-consent then retry once
        await FirebaseService.reConsentCalendar().catch(()=>{});
        res = await fetch(url.toString(), { headers: { 'Authorization': 'Bearer ' + FirebaseService.googleAccessToken } });
      }
      if (!res.ok) throw new Error('Fetch events failed: ' + res.status);
      const data = await res.json();
      const events = (data.items || []).map(ev => ({
        id: ev.id,
        summary: ev.summary || '(No title)',
        start: ev.start?.dateTime || ev.start?.date, // date if all-day
        end: ev.end?.dateTime || ev.end?.date,
        allDay: !!ev.start?.date && !ev.start?.dateTime,
        isRecurring: !!ev.recurringEventId || !!ev.recurrence,
        type: 'gcal'
      }));
      console.log('Calendar events loaded:', events.length, 'events');
      this._cache = { rangeKey, events };
      return events;
    } catch(e) {
      console.warn('Calendar events load failed', e.message);
      NotificationService.show('⚠️ Calendar events load failed', 'warning');
      return [];
    }
  }

  static async createEventForTask(task) {
    if (!FirebaseService.user) {
      NotificationService.show('⚠️ Sign in first', 'warning');
      return null;
    }
    const token = FirebaseService.googleAccessToken;
    if (!token) {
      NotificationService.show('❌ Missing calendar permission. Re-sign in.', 'error');
      return null;
    }
    const start = new Date();
    const end = new Date(Date.now() + 30*60*1000);
    const event = { summary: task.text || 'Task', start:{dateTime:start.toISOString()}, end:{dateTime:end.toISOString()} };
    let res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type':'application/json' },
      body: JSON.stringify(event)
    });
    if (res.status === 401 || res.status === 403) {
      // Try forced re-consent once
      try {
        await FirebaseService.reConsentCalendar();
        const retryToken = FirebaseService.googleAccessToken;
        if (!retryToken) throw new Error('No token after re-consent');
        res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + retryToken, 'Content-Type':'application/json' },
          body: JSON.stringify(event)
        });
      } catch(e) {
        NotificationService.show('❌ Calendar permission required', 'error');
        return null;
      }
    }
    if (!res.ok) {
      const txt = await res.text();
      console.warn('Calendar create failed', txt);
      NotificationService.show('❌ Calendar create failed', 'error');
      return null;
    }
    const data = await res.json();
    NotificationService.show('📅 Event created', 'success');
    return data;
  }
}

window.CalendarService = CalendarService;
