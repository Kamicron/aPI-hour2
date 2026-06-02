import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import vacationService from '../../services/vacationService';
import VacationSummary from './VacationSummary';
import VacationModal from './VacationModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import './VacationsPage.css';

export default function VacationsPage() {
  const { user } = useAuth();
  const [vacations, setVacations] = useState([]);
  const [filteredVacations, setFilteredVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vacationToDelete, setVacationToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedVacations, setSelectedVacations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (user) {
      loadVacations();
    }
  }, [user]);

  useEffect(() => {
    filterVacations();
  }, [vacations, searchTerm, activeFilters, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters, statusFilter]);

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

    if (statusFilter) {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    activeFilters.forEach(filter => {
      if (filter.type === 'period') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (filter.value === 'upcoming') {
          filtered = filtered.filter(v => new Date(v.startDate) >= today);
        } else if (filter.value === 'past') {
          filtered = filtered.filter(v => new Date(v.endDate) < today);
        }
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
    setStatusFilter('');
  };

  const totalPages = Math.max(1, Math.ceil(filteredVacations.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedVacations = filteredVacations.slice(startIndex, endIndex);

  const goToPage = (page) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
  };

  const handleAddVacation = () => {
    setSelectedVacation(null);
    setIsVacationModalOpen(true);
  };

  const handleEditVacation = (vacation) => {
    setSelectedVacation(vacation);
    setIsVacationModalOpen(true);
  };

  const handleSaveVacation = async (formData) => {
    try {
      const vacationData = {
        userId: user.id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status || formData.type || 'pending',
        reason: formData.reason || ''
      };

      if (selectedVacation) {
        await vacationService.updateVacation(selectedVacation.id, vacationData);
      } else {
        await vacationService.createVacation(vacationData);
      }

      setSelectedVacation(null);
      setIsVacationModalOpen(false);
      loadVacations();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de l\'enregistrement de l\'absence');
    }
  };

  const handleDeleteVacation = (vacation) => {
    setVacationToDelete(vacation);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vacationToDelete?.id) return;
    try {
      await vacationService.deleteVacation(vacationToDelete.id);
      setDeleteModalOpen(false);
      setVacationToDelete(null);
      loadVacations();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
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

    const sumDaysByStatus = (status) => {
      return vacations
        .filter(v => v.status === status)
        .reduce((acc, v) => {
          const start = new Date(v.startDate);
          const end = new Date(v.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return acc + days;
        }, 0);
    };

    const pendingDays = sumDaysByStatus('pending');
    const approvedDays = sumDaysByStatus('approved');
    const rejectedDays = sumDaysByStatus('rejected');
    const sickLeaveDays = sumDaysByStatus('sick_leave');
    const publicHolidayDays = sumDaysByStatus('public_holiday');

    return {
      totalDays,
      upcomingDays,
      pendingDays,
      approvedDays,
      rejectedDays,
      sickLeaveDays,
      publicHolidayDays
    };
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

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Type (tous)</option>
              <option value="pending">En attente</option>
              <option value="approved">Validé</option>
              <option value="rejected">Décliné</option>
              <option value="public_holiday">Jour férié</option>
              <option value="sick_leave">Maladie</option>
            </select>

            <select className="filter-select" onChange={(e) => {
              if (e.target.value) addFilter('period', e.target.value, e.target.options[e.target.selectedIndex].text);
              e.target.value = '';
            }}>
              <option value="">Période</option>
              <option value="upcoming">À venir</option>
              <option value="past">Passées</option>
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
                  paginatedVacations.map((vacation) => (
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
                          <span className="material-icons status-icon">{getStatusIcon(vacation.status)}</span>
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
                            onClick={() => handleDeleteVacation(vacation)}
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
              <select
                className="rows-per-page"
                value={rowsPerPage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setRowsPerPage(next);
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="pagination-text">lignes par page</span>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => goToPage(safePage - 1)} disabled={safePage <= 1}>
                  Précédent
                </button>
                <div className="pagination-status">
                  Page {safePage} / {totalPages}
                </div>
                <button className="pagination-btn" onClick={() => goToPage(safePage + 1)} disabled={safePage >= totalPages}>
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSidebar && (
          <div className="vacations-sidebar">
            <VacationSummary stats={stats} />
          </div>
        )}

        <VacationModal
          isOpen={isVacationModalOpen}
          onClose={() => {
            setIsVacationModalOpen(false);
            setSelectedVacation(null);
          }}
          onSave={handleSaveVacation}
          vacation={selectedVacation}
          mode={selectedVacation ? 'edit' : 'create'}
        />

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setVacationToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Supprimer l'absence"
          message="Êtes-vous sûr de vouloir supprimer cette absence ? Cette action est irréversible."
        />
      </div>
    </div>
  );
}

function getTypeLabel(status) {
  const labels = {
    pending: 'En attente',
    approved: 'Validé',
    rejected: 'Décliné',
    public_holiday: 'Jour férié',
    sick_leave: 'Maladie'
  };
  return labels[status] || 'En attente';
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
    pending: 'schedule',
    approved: 'check_circle',
    rejected: 'cancel',
    public_holiday: 'celebration',
    sick_leave: 'medical_services'
  };
  return icons[status] || 'schedule';
}
