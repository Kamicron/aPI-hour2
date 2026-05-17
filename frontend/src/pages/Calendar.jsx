import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CalendarGrid from '../components/calendar/CalendarGrid';
import MonthSummary from '../components/calendar/MonthSummary';
import DayDetails from '../components/calendar/DayDetails';
import './Calendar.css';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      console.log('Fetching calendar for:', year, month);

      const response = await fetch(`http://localhost:8080/api/stats/calendar/${year}/${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Calendar response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data.days || []);
        setMonthStats(data.monthStats);
      } else {
        console.error('Failed to fetch calendar:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleAddSession = () => {
    alert('Fonctionnalité d\'ajout de session à venir');
  };

  const handleExport = () => {
    alert('Fonctionnalité d\'export à venir');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="calendar-page">
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement du calendrier...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="calendar-page">
        <div className="calendar-container">
          <CalendarGrid
            currentDate={currentDate}
            calendarData={calendarData}
            selectedDay={selectedDay}
            onDayClick={handleDayClick}
            onMonthChange={changeMonth}
            onTodayClick={goToToday}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <div className="calendar-sidebar">
            <MonthSummary monthStats={monthStats} />
            <DayDetails selectedDay={selectedDay} onAddSession={handleAddSession} />

            <div className="export-section">
              <div className="export-header">
                <span className="material-icons">download</span>
                <h3>Export</h3>
              </div>
              <select className="export-format">
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
              <button className="export-btn" onClick={handleExport}>
                <span className="material-icons">file_download</span>
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
