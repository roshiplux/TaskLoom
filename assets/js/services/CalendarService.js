// Google Calendar integration scaffold
// Provides opt-in calendar event creation for tasks.

class CalendarService {
  static _cache = { rangeKey: null, events: [] };

  static async fetchEvents(startISO, endISO) {
    if (!FirebaseService.user) return [];
    
    // Check for access token in FirebaseService or localStorage
    let accessToken = FirebaseService.googleAccessToken || localStorage.getItem('googleAccessToken');
    if (!accessToken) return [];
    
    const rangeKey = startISO + '|' + endISO;
    if (this._cache.rangeKey === rangeKey && this._cache.events.length) return this._cache.events;
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', startISO);
    url.searchParams.set('timeMax', endISO);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    try {
      console.log('Fetching calendar events for range:', startISO, 'to', endISO);
      let res = await fetch(url.toString(), { headers: { 'Authorization': 'Bearer ' + accessToken } });
      if (res.status === 401 || res.status === 403) {
        console.log('Calendar auth failed - please re-sign in for calendar access');
        NotificationService.show('⚠️ Calendar access expired. Please sign in again.', 'warning');
        return [];
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
    
    // Check for access token in FirebaseService or localStorage
    let token = FirebaseService.googleAccessToken || localStorage.getItem('googleAccessToken');
    if (!token) {
      NotificationService.show('❌ Missing calendar permission. Please sign in again.', 'error');
      return null;
    }
    
    // If task has a specific date, use it. Otherwise use current date.
    const taskDate = task.date ? new Date(task.date) : new Date();
    
    // Create an all-day event
    const startDate = new Date(taskDate);
    startDate.setHours(9, 0, 0, 0); // 9 AM
    const endDate = new Date(taskDate);
    endDate.setHours(10, 0, 0, 0); // 10 AM (1 hour duration)
    
    const event = { 
      summary: task.text || 'Task',
      description: 'Created by TaskLoom',
      start: { dateTime: startDate.toISOString() }, 
      end: { dateTime: endDate.toISOString() }
    };
    
    let res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type':'application/json' },
      body: JSON.stringify(event)
    });
    
    if (res.status === 401 || res.status === 403) {
      NotificationService.show('❌ Calendar access expired. Please sign in again.', 'error');
      return null;
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
