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
import axiosInstance from '../api/axios';

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
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setCalendarData(cached.days || []);
        setMonthStats(cached.monthStats);
        return;
      }

      console.log('Fetching calendar for:', year, month);

      const response = await axiosInstance.get(`/stats/calendar/${year}/${month}`);
      const data = response.data;
      setCalendarData(data.days || []);
      setMonthStats(data.monthStats);
      cacheRef.current.set(cacheKey, data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
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
      const response = await axiosInstance.get(`/time-entries/${session.id}`);
      const data = response.data;
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
      if (editingSession) {
        await axiosInstance.put(`/time-entries/${editingSession.id}`, formData);
      } else {
        await axiosInstance.post('/time-entries', formData);
      }

      setIsModalOpen(false);
      setEditingSession(null);
      refreshCalendarData();
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
      await axiosInstance.delete(`/time-entries/${sessionToDelete.id}`);
      setDeleteModalOpen(false);
      setSessionToDelete(null);
      refreshCalendarData();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleExport = async () => {
    if (exportFormat === 'csv') {
      exportToCSV(calendarData, monthStats, currentDate);
    } else if (exportFormat === 'pdf') {
      await exportToPDF(calendarData, monthStats, currentDate);
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
