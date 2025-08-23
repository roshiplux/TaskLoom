// Holiday and Special Events Service
class HolidayService {
  static holidays2025 = {
    '2025-01-01': 'New Year\'s Day',
    '2025-02-04': 'Independence Day (Sri Lanka)',
    '2025-04-13': 'Sinhala & Tamil New Year',
    '2025-04-14': 'Sinhala & Tamil New Year',
    '2025-05-01': 'May Day',
    '2025-05-12': 'Vesak Full Moon Poya',
    '2025-06-10': 'Poson Full Moon Poya',
    '2025-07-10': 'Esala Full Moon Poya',
    '2025-08-08': 'Nikini Full Moon Poya',
    '2025-09-06': 'Binara Full Moon Poya',
    '2025-10-06': 'Vap Full Moon Poya',
    '2025-11-04': 'Il Full Moon Poya',
    '2025-12-04': 'Unduvap Full Moon Poya',
    '2025-12-25': 'Christmas Day'
  };

  static poyaDays2025 = [
    '2025-01-13', '2025-02-12', '2025-03-14', '2025-04-13',
    '2025-05-12', '2025-06-10', '2025-07-10', '2025-08-08',
    '2025-09-06', '2025-10-06', '2025-11-04', '2025-12-04'
  ];

  static getEventsForDate(dateStr) {
    const events = [];
    
    if (window.CONFIG?.APP?.SHOW_HOLIDAYS && this.holidays2025[dateStr]) {
      events.push({
        type: 'holiday',
        title: this.holidays2025[dateStr],
        isHoliday: true
      });
    }

    if (window.CONFIG?.APP?.SHOW_POYA_DAYS && this.poyaDays2025.includes(dateStr)) {
      // Don't duplicate if already in holidays
      if (!this.holidays2025[dateStr] || !this.holidays2025[dateStr].includes('Poya')) {
        events.push({
          type: 'poya',
          title: 'Poya Day',
          isPoya: true
        });
      }
    }

    return events;
  }

  static getEventsForMonth(year, month) {
    const events = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = this.getEventsForDate(dateStr);
      if (dayEvents.length > 0) {
        events[dateStr] = dayEvents;
      }
    }
    
    return events;
  }

  // Calculate poya days dynamically (basic lunar calculation)
  static calculatePoyaDay(year, month) {
    // Simplified calculation - in real implementation would use proper lunar calendar
    // This is approximate based on known 2025 dates
    const knownPoya = new Date('2025-01-13'); // First poya of 2025
    const target = new Date(year, month, 15); // Approximate middle of month
    const diffTime = target.getTime() - knownPoya.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const lunarCycle = 29.5; // Approximate lunar month
    const cycles = Math.floor(diffDays / lunarCycle);
    
    // This is a simplified approximation
    const poyaDate = new Date(knownPoya.getTime() + (cycles * lunarCycle * 24 * 60 * 60 * 1000));
    return poyaDate;
  }
}

window.HolidayService = HolidayService;
