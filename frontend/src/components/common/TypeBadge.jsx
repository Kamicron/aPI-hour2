import React from 'react';
import './TypeBadge.css';

const TypeBadge = ({ type }) => {
  const getTypeConfig = (type) => {
    const configs = {
      pending: { label: 'Congé payé', color: '#3b82f6', icon: '●' },
      approved: { label: 'Congé payé', color: '#3b82f6', icon: '●' },
      rejected: { label: 'Congé payé', color: '#3b82f6', icon: '●' },
      public_holiday: { label: 'Jour férié', color: '#10b981', icon: '●' },
      sick_leave: { label: 'Maladie', color: '#f59e0b', icon: '●' }
    };
    return configs[type] || configs.pending;
  };

  const config = getTypeConfig(type);

  return (
    <span className="type-badge">
      <span className="type-icon" style={{ color: config.color }}>{config.icon}</span>
      <span className="type-label">{config.label}</span>
    </span>
  );
};

export default TypeBadge;
