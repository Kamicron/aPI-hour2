import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import CalendarGrid from '../components/calendar/CalendarGrid';
import MonthSummary from '../components/calendar/MonthSummary';
import DayDetails from '../components/calendar/DayDetails';
import SessionModal from '../components/modals/SessionModal';
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import './Calendar.css';

export default function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const getDateFromSearchParams = () => {
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const year = yearParam ? Number(yearParam) : NaN;
    const month = monthParam ? Number(monthParam) : NaN;
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return new Date();
    }
    return new Date(year, month - 1, 1);
  };

  const [currentDate, setCurrentDate] = useState(getDateFromSearchParams);
  const [calendarData, setCalendarData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const requestAbortRef = useRef(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const dayParam = searchParams.get('day');
    const nextDate = getDateFromSearchParams();
    if (
      nextDate.getFullYear() !== currentDate.getFullYear() ||
      nextDate.getMonth() !== currentDate.getMonth()
    ) {
      setCurrentDate(nextDate);
      if (!dayParam) {
        setSelectedDay(null);
      }
    }

    if (dayParam) {
      const [y, m] = dayParam.split('-').map(Number);
      if (Number.isFinite(y) && Number.isFinite(m) && y === nextDate.getFullYear() && (m - 1) === nextDate.getMonth()) {
        const dayData = (calendarData || []).find(d => d?.date === dayParam);
        setSelectedDay({
          fullDate: dayParam,
          sessions: dayData?.sessions || [],
          totalDuration: dayData?.totalDuration
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, calendarData]);

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setCalendarData(cached.days || []);
        setMonthStats(cached.monthStats);
        return;
      }

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }
      const controller = new AbortController();
      requestAbortRef.current = controller;

      console.log('Fetching calendar for:', year, month);

      const response = await fetch(`http://localhost:8080/api/stats/calendar/${year}/${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      console.log('Calendar response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setCalendarData(data.days || []);
        setMonthStats(data.monthStats);
        cacheRef.current.set(cacheKey, data);
      } else {
        console.error('Failed to fetch calendar:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching calendar data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
    cacheRef.current.delete(cacheKey);
    fetchCalendarData();
  };

  const changeMonth = (delta) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(next);
    setSearchParams({
      year: String(next.getFullYear()),
      month: String(next.getMonth() + 1).padStart(2, '0')
    });
    setSelectedDay(null);
  };

  const goToToday = () => {
    const next = new Date();
    setCurrentDate(next);
    const dayStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    setSelectedDay({
      fullDate: dayStr,
      sessions: [],
      totalDuration: ''
    });
    setSearchParams({
      year: String(next.getFullYear()),
      month: String(next.getMonth() + 1).padStart(2, '0'),
      day: dayStr
    });
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setSearchParams({
      year: String(currentDate.getFullYear()),
      month: String(currentDate.getMonth() + 1).padStart(2, '0'),
      day: day.fullDate
    });
  };

  const handleAddSession = () => {
    if (!selectedDay?.fullDate) return;
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEditSession = async (session) => {
    if (!session?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/time-entries/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch time entry details');
        setEditingSession({
          ...session,
          pauses: session?.pauses || [],
          comment: session?.comment || ''
        });
        setIsModalOpen(true);
        return;
      }

      const data = await response.json();
      const timeEntry = data?.timeEntry;
      const pauses = data?.pauses || [];

      setEditingSession({
        ...(timeEntry || session),
        pauses,
        comment: timeEntry?.comment ?? session?.comment ?? ''
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching time entry details:', error);
      setEditingSession({
        ...session,
        pauses: session?.pauses || [],
        comment: session?.comment || ''
      });
      setIsModalOpen(true);
    }
  };

  const handleSaveSession = async (formData) => {
    if (!selectedDay?.fullDate) return;
    try {
      const token = localStorage.getItem('token');
      const url = editingSession
        ? `http://localhost:8080/api/time-entries/${editingSession.id}`
        : 'http://localhost:8080/api/time-entries';
      const method = editingSession ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingSession(null);
        refreshCalendarData();
      } else {
        const errorText = await response.text();
        console.error('Failed to save session:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleDeleteSession = (session) => {
    setSessionToDelete(session);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/time-entries/${sessionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
        refreshCalendarData();
      } else {
        const errorText = await response.text();
        console.error('Failed to delete session:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV(calendarData, monthStats, currentDate);
    } else if (exportFormat === 'pdf') {
      exportToPDF(calendarData, monthStats, currentDate);
    }
  };

  return (
    <DashboardLayout contentClassName="no-scroll">
      <div className="calendar-page">
        <div className="calendar-container">
          <div className="calendar-section">
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
            {loading && (
              <div className="calendar-loading-overlay">
                <div className="calendar-loading-spinner" />
              </div>
            )}
          </div>

          <div className="calendar-sidebar calendar-section">
            <MonthSummary monthStats={monthStats} />

            <div className="export-section">
              <div className="export-header">
                <span className="material-icons">download</span>
                <h3>Export</h3>
              </div>
              <select className="export-format" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button className="export-btn" onClick={handleExport}>
                <span className="material-icons">file_download</span>
                Exporter
              </button>
            </div>

            <DayDetails
              selectedDay={selectedDay}
              onAddSession={handleAddSession}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
            />

            <SessionModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setEditingSession(null);
              }}
              onSave={handleSaveSession}
              session={editingSession}
              date={selectedDay?.fullDate}
            />

            <DeleteConfirmModal
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false);
                setSessionToDelete(null);
              }}
              onConfirm={handleDeleteConfirm}
              title="Supprimer la session"
              message="Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible."
            />

            {loading && (
              <div className="calendar-loading-overlay">
                <div className="calendar-loading-spinner" />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
