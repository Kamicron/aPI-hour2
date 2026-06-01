import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import vacationService from '../../services/vacationService';
import VacationSummary from './VacationSummary';
import VacationForm from './VacationForm';
import './VacationsPage.css';

export default function VacationsPage() {
  const { user } = useAuth();
  const [vacations, setVacations] = useState([]);
  const [filteredVacations, setFilteredVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedVacations, setSelectedVacations] = useState([]);

  useEffect(() => {
    if (user) {
      loadVacations();
    }
  }, [user]);

  useEffect(() => {
    filterVacations();
  }, [vacations, searchTerm, activeFilters]);

  const loadVacations = async () => {
    try {
      setLoading(true);
      const data = await vacationService.getVacationsByUserId(user.id);
      setVacations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des vacances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVacations = () => {
    let filtered = [...vacations];

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    activeFilters.forEach(filter => {
      if (filter.type === 'status') {
        filtered = filtered.filter(v => v.status === filter.value);
      } else if (filter.type === 'period') {
        filtered = filtered.filter(v => v.status === filter.value);
      }
    });

    setFilteredVacations(filtered);
  };

  const addFilter = (type, value, label) => {
    if (!activeFilters.find(f => f.type === type && f.value === value)) {
      setActiveFilters([...activeFilters, { type, value, label }]);
    }
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter(f =>
      !(f.type === filterToRemove.type && f.value === filterToRemove.value)
    ));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  const handleAddVacation = () => {
    setSelectedVacation(null);
    setShowSidebar(true);
  };

  const handleEditVacation = (vacation) => {
    setSelectedVacation(vacation);
    setShowSidebar(true);
  };

  const handleSaveVacation = async (formData) => {
    try {
      const vacationData = {
        userId: user.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.type || 'pending',
        reason: formData.reason || ''
      };

      if (selectedVacation) {
        await vacationService.updateVacation(selectedVacation.id, vacationData);
      } else {
        await vacationService.createVacation(vacationData);
      }

      setSelectedVacation(null);
      loadVacations();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de l\'enregistrement de l\'absence');
    }
  };

  const handleDeleteVacation = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) {
      try {
        await vacationService.deleteVacation(id);
        loadVacations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleSelectVacation = (id) => {
    setSelectedVacations(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedVacations.length === filteredVacations.length) {
      setSelectedVacations([]);
    } else {
      setSelectedVacations(filteredVacations.map(v => v.id));
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 jour' : `${diffDays} jours`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStats = () => {
    const totalDays = vacations.reduce((acc, v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return acc + days;
    }, 0);

    const upcomingDays = vacations
      .filter(v => new Date(v.startDate) > new Date())
      .reduce((acc, v) => {
        const start = new Date(v.startDate);
        const end = new Date(v.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return acc + days;
      }, 0);

    const congePaye = vacations.filter(v => v.status === 'pending' || v.status === 'approved').length;
    const rtt = vacations.filter(v => v.status === 'approved' && v.reason?.toLowerCase().includes('rtt')).length;
    const maladie = vacations.filter(v => v.status === 'sick_leave').length;
    const jourFerie = vacations.filter(v => v.status === 'public_holiday').length;

    return { totalDays, upcomingDays, congePaye, rtt, maladie, jourFerie };
  };

  const stats = getStats();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="vacations-page">
      <div className="vacations-container">
        <div className="vacations-main">
          <div className="vacations-toolbar">
            <button className="add-vacation-btn" onClick={handleAddVacation}>
              <span className="material-icons">add</span>
              Ajouter une absence
            </button>

            <div className="toolbar-search">
              <span className="material-icons search-icon">search</span>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <select className="filter-select" onChange={(e) => {
              if (e.target.value) addFilter('type', e.target.value, e.target.options[e.target.selectedIndex].text);
              e.target.value = '';
            }}>
              <option value="">Type</option>
              <option value="pending">Congé payé</option>
              <option value="public_holiday">Jour férié</option>
              <option value="sick_leave">Maladie</option>
            </select>

            <select className="filter-select" onChange={(e) => {
              if (e.target.value) addFilter('period', e.target.value, e.target.options[e.target.selectedIndex].text);
              e.target.value = '';
            }}>
              <option value="">Période</option>
              <option value="pending">À venir</option>
              <option value="approved">En attente</option>
            </select>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filters">
              <div className="filter-chips">
                {activeFilters.map((filter, index) => (
                  <div key={index} className="filter-chip">
                    <span>{filter.type === 'status' ? 'Statut' : 'Période'}: {filter.label}</span>
                    <button onClick={() => removeFilter(filter)} className="chip-remove">
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                ))}
              </div>
              <button className="clear-filters-btn" onClick={clearFilters}>
                <span className="material-icons">refresh</span>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          <div className="vacations-table-container">
            <table className="vacations-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedVacations.length === filteredVacations.length && filteredVacations.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Date début <span className="material-icons sort-icon">unfold_more</span></th>
                  <th>Date fin <span className="material-icons sort-icon">unfold_more</span></th>
                  <th>Type</th>
                  <th>Durée</th>
                  <th>Statut</th>
                  <th>Commentaire</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVacations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      Aucune absence trouvée
                    </td>
                  </tr>
                ) : (
                  filteredVacations.map((vacation) => (
                    <tr key={vacation.id}>
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedVacations.includes(vacation.id)}
                          onChange={() => handleSelectVacation(vacation.id)}
                        />
                      </td>
                      <td>{formatDate(vacation.startDate)}</td>
                      <td>{formatDate(vacation.endDate)}</td>
                      <td>
                        <span className={`type-badge type-${vacation.status}`}>
                          <span className="type-dot"></span>
                          {getTypeLabel(vacation.status)}
                        </span>
                      </td>
                      <td>{calculateDuration(vacation.startDate, vacation.endDate)}</td>
                      <td>
                        <span className={`status-badge status-${vacation.status}`}>
                          <span className="status-icon">{getStatusIcon(vacation.status)}</span>
                          {getStatusLabel(vacation.status)}
                        </span>
                      </td>
                      <td className="comment-cell">{vacation.reason || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            onClick={() => handleEditVacation(vacation)}
                            title="Modifier"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteVacation(vacation.id)}
                            title="Supprimer"
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="results-count">{filteredVacations.length} résultats</div>
            <div className="pagination">
              <select className="rows-per-page">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="pagination-text">lignes par page</span>
              <div className="pagination-controls">
                <button className="pagination-btn">Précédent</button>
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">Suivant</button>
              </div>
            </div>
          </div>
        </div>

        {showSidebar && (
          <div className="vacations-sidebar">
            <VacationSummary stats={stats} />
            <VacationForm
              vacation={selectedVacation}
              onSave={handleSaveVacation}
              onCancel={() => setSelectedVacation(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(status) {
  const labels = {
    pending: 'Congé payé',
    approved: 'Congé payé',
    rejected: 'Congé payé',
    public_holiday: 'Jour férié',
    sick_leave: 'Maladie'
  };
  return labels[status] || 'Congé payé';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    approved: 'Validé',
    rejected: 'Décliné',
    public_holiday: 'Automatique',
    sick_leave: 'Maladie'
  };
  return labels[status] || 'En attente';
}

function getStatusIcon(status) {
  const icons = {
    pending: '⏱️',
    approved: '✓',
    rejected: '✗',
    public_holiday: '🎉',
    sick_leave: '🏥'
  };
  return icons[status] || '⏱️';
}
