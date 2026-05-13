import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import './Settings.css';

export default function Settings() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    weeklyHoursGoal: 40,
    workingDays: [1, 2, 3, 4, 5]
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    old: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    if (!user || !user.id) {
      console.log('No user or user.id');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data from backend:', userData);

        // workingDays est une String "1,2,3,4,5" dans le backend
        // On le convertit en tableau [1,2,3,4,5]
        const workingDaysArray = userData.workingDays
          ? userData.workingDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
          : [1, 2, 3, 4, 5];

        const formattedData = {
          name: userData.name || '',
          email: userData.email || '',
          weeklyHoursGoal: userData.weeklyHoursGoal || 40,
          workingDays: workingDaysArray
        };

        console.log('Formatted form data:', formattedData);
        login(token, userData);
        setFormData(formattedData);
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeeklyGoalChange = (value) => {
    const numValue = Math.max(1, Math.min(80, parseInt(value) || 1));
    setFormData(prev => ({
      ...prev,
      weeklyHoursGoal: numValue
    }));
  };

  const handleWorkingDayToggle = (day) => {
    setFormData(prev => {
      const workingDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort();
      return { ...prev, workingDays };
    });
  };

  const handleProfileUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!user || !user.id) {
      setMessage({ type: 'error', text: 'Utilisateur non connecté. Veuillez vous reconnecter.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('Updating profile with:', { email: formData.email, userId: user.id });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (response.ok) {
        await fetchUserData();
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordData.oldPassword) {
      setMessage({ type: 'error', text: 'Veuillez entrer votre ancien mot de passe' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/change-password-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          oldPassword: passwordData.oldPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Un email de réinitialisation a été envoyé à votre adresse.' });
        setPasswordData({ oldPassword: '' });
      } else {
        throw new Error('Ancien mot de passe incorrect');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ancien mot de passe incorrect' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!user || !user.id) {
      setMessage({ type: 'error', text: 'Utilisateur non connecté. Veuillez vous reconnecter.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('Updating goal with:', formData.weeklyHoursGoal, 'userId:', user.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weeklyHoursGoal: formData.weeklyHoursGoal
        })
      });

      if (response.ok) {
        await fetchUserData();
        setMessage({ type: 'success', text: 'Objectif hebdomadaire mis à jour' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Goal update error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingDaysUpdate = async (e) => {
    if (e) e.preventDefault();

    if (!user || !user.id) {
      setMessage({ type: 'error', text: 'Utilisateur non connecté. Veuillez vous reconnecter.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('Updating working days with:', formData.workingDays.length, 'userId:', user.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workingDays: formData.workingDays.join(',')
        })
      });

      if (response.ok) {
        await fetchUserData();
        setMessage({ type: 'success', text: 'Jours travaillés mis à jour' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Working days update error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { id: 1, label: 'Lundi' },
    { id: 2, label: 'Mardi' },
    { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' },
    { id: 5, label: 'Vendredi' },
    { id: 6, label: 'Samedi' },
    { id: 0, label: 'Dimanche' }
  ];

  return (
    <DashboardLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Paramètres</h1>
          <p className="settings-subtitle">Gérez vos informations et préférences</p>
        </div>

        <div className="settings-grid">
          {/* Profile Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="material-icons settings-card-icon">person</span>
              <h2>Profil</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-group">
                <label htmlFor="name">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="settings-input"
                  placeholder="Votre nom"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <span className="material-icons input-icon">lock</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="settings-input"
                    disabled
                  />
                </div>
              </div>
              <button className="btn-update" onClick={handleProfileUpdate} disabled={loading}>
                Mettre à jour
              </button>
            </div>
          </div>

          {/* Weekly Goal Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="material-icons settings-card-icon">track_changes</span>
              <h2>Objectif hebdo</h2>
            </div>
            <div className="settings-card-body">
              <label htmlFor="weeklyGoal">Weekly hours goal</label>
              <div className="goal-input-group">
                <input
                  type="number"
                  id="weeklyGoal"
                  value={formData.weeklyHoursGoal}
                  onChange={(e) => handleWeeklyGoalChange(e.target.value)}
                  className="goal-input"
                  min="1"
                  max="80"
                />
                <span className="goal-unit">h</span>
                <button
                  className="goal-btn"
                  onClick={() => handleWeeklyGoalChange(formData.weeklyHoursGoal - 1)}
                >
                  <span className="material-icons">remove</span>
                </button>
                <button
                  className="goal-btn"
                  onClick={() => handleWeeklyGoalChange(formData.weeklyHoursGoal + 1)}
                >
                  <span className="material-icons">add</span>
                </button>
              </div>
              <div className="slider-container">
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={formData.weeklyHoursGoal}
                  onChange={(e) => handleWeeklyGoalChange(e.target.value)}
                  className="goal-slider"
                />
                <div className="slider-labels">
                  <span>1 h</span>
                  <span>80 h</span>
                </div>
              </div>
              <p className="goal-description">
                Définissez le nombre d'heures que vous souhaitez atteindre chaque semaine.
              </p>
              <button className="btn-update" onClick={handleGoalUpdate} disabled={loading}>
                Mettre à jour
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="material-icons settings-card-icon">shield</span>
              <h2>Sécurité</h2>
            </div>
            <div className="settings-card-body">
              <div className="form-group">
                <label htmlFor="oldPassword">Mot de passe</label>
                <p className="field-label">Ancien mot de passe</p>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.old ? 'text' : 'password'}
                    id="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="settings-input"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(prev => ({ ...prev, old: !prev.old }))}
                  >
                    <span className="material-icons">
                      {showPassword.old ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <button className="btn-update" onClick={handlePasswordChange} disabled={loading}>
                Demander le changement
              </button>
            </div>
          </div>

          {/* Working Days Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="material-icons settings-card-icon">calendar_today</span>
              <h2>Jours travaillés</h2>
            </div>
            <div className="settings-card-body">
              <p className="working-days-description">
                Sélectionnez les jours que vous travaillez habituellement.
              </p>
              <div className="working-days-grid">
                {weekDays.map(day => (
                  <label key={day.id} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.workingDays.includes(day.id)}
                      onChange={() => handleWorkingDayToggle(day.id)}
                    />
                    <span className="day-label">{day.label}</span>
                  </label>
                ))}
              </div>
              <p className="working-days-note">
                Utilisé pour le calcul des objectifs et heures sup.
              </p>
              <button className="btn-update" onClick={handleWorkingDaysUpdate} disabled={loading}>
                Mettre à jour
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && message.type !== 'info' && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
