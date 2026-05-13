import { useState, useEffect } from 'react';
import { sessionService } from '../../services/sessionService';
import './TimeTracker.css';

export default function TimeTracker() {
  const [session, setSession] = useState(null);
  const [timeEntry, setTimeEntry] = useState(null);
  const [pauses, setPauses] = useState([]);
  const [currentPause, setCurrentPause] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentSession();
  }, []);

  useEffect(() => {
    let interval;
    if (session && session.status !== 'NULL') {
      interval = setInterval(() => {
        calculateElapsedTime();
        calculatePauseTime();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session, timeEntry, pauses, currentPause]);

  const loadCurrentSession = async () => {
    try {
      const data = await sessionService.getCurrentSession();
      setSession(data.session);
      setTimeEntry(data.timeEntry);
      setPauses(data.pauses || []);
      setCurrentPause(data.currentPause);
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      // Don't show error for missing session - it's normal
    }
  };

  const calculateElapsedTime = () => {
    if (!timeEntry) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(timeEntry.startTime).getTime();
    const endTime = timeEntry.endTime ? new Date(timeEntry.endTime).getTime() : Date.now();
    let totalTime = endTime - startTime;

    let pauseTime = 0;
    if (pauses && pauses.length > 0) {
      pauses.forEach(pause => {
        const pauseStart = new Date(pause.pauseStart).getTime();
        const pauseEnd = pause.pauseEnd ? new Date(pause.pauseEnd).getTime() : null;
        if (pauseEnd) {
          pauseTime += pauseEnd - pauseStart;
        }
      });
    }

    if (currentPause && currentPause.pauseStart && !currentPause.pauseEnd) {
      const pauseStart = new Date(currentPause.pauseStart).getTime();
      pauseTime += Date.now() - pauseStart;
    }

    const elapsed = Math.max(0, totalTime - pauseTime);
    setElapsedTime(Math.floor(elapsed / 1000));
  };

  const calculatePauseTime = () => {
    let totalPauseTime = 0;
    if (pauses && pauses.length > 0) {
      pauses.forEach(pause => {
        const pauseStart = new Date(pause.pauseStart).getTime();
        const pauseEnd = pause.pauseEnd ? new Date(pause.pauseEnd).getTime() : null;
        if (pauseEnd) {
          totalPauseTime += pauseEnd - pauseStart;
        }
      });
    }

    if (currentPause && currentPause.pauseStart && !currentPause.pauseEnd) {
      const pauseStart = new Date(currentPause.pauseStart).getTime();
      totalPauseTime += Date.now() - pauseStart;
    }

    setPauseTime(Math.floor(totalPauseTime / 1000));
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStartTime = () => {
    if (!timeEntry || !timeEntry.startTime) return '--:--';
    const date = new Date(timeEntry.startTime);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await sessionService.startSession();
      setSession(data.session);
      setTimeEntry(data.timeEntry);
      setPauses(data.pauses || []);
      setCurrentPause(null);
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err.response?.data?.error || 'Erreur lors du démarrage');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setLoading(true);
    try {
      const data = await sessionService.pauseSession();
      setSession(data.session);
      setTimeEntry(data.timeEntry);
      setPauses(data.pauses || []);
      setCurrentPause(data.currentPause);
      setError(null);
    } catch (err) {
      console.error('Error pausing session:', err);
      setError(err.response?.data?.error || 'Erreur lors de la pause');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const data = await sessionService.resumeSession();
      setSession(data.session);
      setTimeEntry(data.timeEntry);
      setPauses(data.pauses || []);
      setCurrentPause(null);
      setError(null);
    } catch (err) {
      console.error('Error resuming session:', err);
      setError(err.response?.data?.error || 'Erreur lors de la reprise');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await sessionService.stopSession();
      setSession(null);
      setTimeEntry(null);
      setPauses([]);
      setCurrentPause(null);
      setElapsedTime(0);
      setError(null);
    } catch (err) {
      console.error('Error stopping session:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'arrêt');
    } finally {
      setLoading(false);
    }
  };

  const isSessionActive = session && session.status !== 'NULL';
  const isSessionPaused = session && session.status === 'paused';
  const isSessionStarted = session && session.status === 'started';

  return (
    <div className={`time-tracker-container ${isSessionStarted ? 'session-active' : ''} ${isSessionPaused ? 'session-paused' : ''}`}>
      <div className="time-tracker-grid">
        <div className="time-tracker-session-card">
          <div className="session-header">

            {isSessionActive && (
              <div className="session-status">
                <span className="status-dot"></span>
                <span className="status-text">En cours depuis {formatStartTime()}</span>
              </div>
            )}

            {!isSessionActive && (
              <div className="session-status-inactive">
                Aucune session active
              </div>
            )}

          </div>

          <div className="session-timer">
            {formatTime(elapsedTime)}
          </div>


          <div className="session-info">
            <div className="info-item">
              <span className="material-icons">schedule</span>
              <div className="info-content">
                <div className="info-label">Heure de début</div>
                <div className="info-value">{formatStartTime()}</div>
              </div>
            </div>


            <div className="session-separator"></div>

            <div className="info-item">
              <span className="material-icons">coffee</span>
              <div className="info-content">
                <div className="info-label">Pauses cumulées</div>
                <div className="info-value">{formatTime(pauseTime)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="time-tracker-actions-card">
          <h2 className="actions-card-title">Changer l'état de la session</h2>

          <div className="action-options">
            <div
              className={`action-option ${!isSessionActive ? '' : 'action-option-disabled'} ${isSessionStarted ? 'action-option-active' : ''}`}
              onClick={!isSessionActive && !loading ? handleStart : null}
            >
              <div className="action-icon action-icon-start">
                <span className="material-icons">play_arrow</span>
              </div>
              <div className="action-content">
                <div className="action-state">État 1 - En cours</div>
                <div className="action-title">POINTER</div>
                <div className="action-description">
                  Démarrer ou reprendre le suivi du temps.
                </div>
              </div>
            </div>

            <div
              className={`action-option ${(isSessionStarted || isSessionPaused) && !loading ? '' : 'action-option-disabled'} ${isSessionPaused ? 'action-option-active' : ''}`}
              onClick={(isSessionStarted || isSessionPaused) && !loading ? (isSessionPaused ? handleResume : handlePause) : null}
            >
              <div className="action-icon action-icon-pause">
                <span className="material-icons">{isSessionPaused ? 'play_arrow' : 'pause'}</span>
              </div>
              <div className="action-content">
                <div className="action-state">État 2 - En pause</div>
                <div className="action-title">PAUSE</div>
                <div className="action-description">
                  {isSessionPaused ? 'Reprendre la session.' : 'Mettre la session en pause. Le temps est comptabilisé.'}
                </div>
              </div>
            </div>

            <div
              className={`action-option ${isSessionActive && !loading ? '' : 'action-option-disabled'}`}
              onClick={isSessionActive && !loading ? handleStop : null}
            >
              <div className="action-icon action-icon-stop">
                <span className="material-icons">stop</span>
              </div>
              <div className="action-content">
                <div className="action-state">État 3 - Arrêtée</div>
                <div className="action-title">ARRÊTER</div>
                <div className="action-description">
                  Arrêter la session. Le temps est enregistré.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="time-tracker-error-container">
          <div className="time-tracker-error">
            <span className="material-icons">error</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
