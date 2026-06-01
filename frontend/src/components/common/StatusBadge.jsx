import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'En attente', icon: '⏱️', className: 'status-pending' },
      approved: { label: 'Validé', icon: '✓', className: 'status-approved' },
      rejected: { label: 'Décliné', icon: '✗', className: 'status-rejected' },
      public_holiday: { label: 'Automatique', icon: '🎉', className: 'status-automatic' },
      sick_leave: { label: 'Maladie', icon: '🏥', className: 'status-sick' }
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(status);

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      <span className="status-label">{config.label}</span>
    </span>
  );
};

export default StatusBadge;
