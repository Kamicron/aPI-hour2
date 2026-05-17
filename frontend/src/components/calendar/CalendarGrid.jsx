import './CalendarGrid.css';

export default function CalendarGrid({
  currentDate,
  calendarData,
  selectedDay,
  onDayClick,
  onMonthChange,
  onTodayClick,
  viewMode,
  onViewModeChange
}) {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: dateStr,
        sessions: dayData?.sessions || [],
        totalDuration: dayData?.totalDuration,
        isToday: isToday(year, month, i)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
  };

  const formatMonthYear = () => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      onDayClick(day);
    }
  };

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="calendar-main">
      <div className="calendar-controls">
        <div className="month-navigation">
          <button className="nav-btn" onClick={() => onMonthChange(-1)}>
            <span className="material-icons">chevron_left</span>
          </button>
          <h2 className="current-month">{formatMonthYear()}</h2>
          <button className="nav-btn" onClick={() => onMonthChange(1)}>
            <span className="material-icons">chevron_right</span>
          </button>
        </div>

        <div className="calendar-actions">
          <button className="today-btn" onClick={onTodayClick}>
            <span className="material-icons">today</span>
            Aujourd'hui
          </button>
          <div className="view-mode-tabs">
            <button
              className={`view-tab ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => onViewModeChange('month')}
            >
              Mois
            </button>
            <button
              className={`view-tab ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => onViewModeChange('week')}
            >
              Semaine
            </button>
            <button
              className={`view-tab ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => onViewModeChange('day')}
            >
              Jour
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday-header">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} 
                         ${day.isToday ? 'today' : ''} 
                         ${selectedDay?.fullDate === day.fullDate ? 'selected' : ''}
                         ${day.sessions?.length > 0 ? 'has-sessions' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-number">
                {day.date}
                {day.isCurrentMonth && day.sessions && day.sessions.length > 0 && (
                  <span className="session-indicator">{day.sessions.length}</span>
                )}
              </div>
              {day.isCurrentMonth && day.sessions && day.sessions.length > 0 && (
                <div className="day-content">
                  <div className="session-dots">
                    {day.sessions.slice(0, 4).map((session, idx) => (
                      <span
                        key={idx}
                        className={`session-dot ${session.status === 'ongoing' ? 'ongoing' : 'completed'}`}
                        title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
                      ></span>
                    ))}
                    {day.sessions.length > 4 && (
                      <span className="more-dots">+{day.sessions.length - 4}</span>
                    )}
                  </div>
                  {day.totalDuration && (
                    <div className="day-total">{day.totalDuration}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
