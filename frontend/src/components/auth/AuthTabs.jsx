import { useState } from 'react';
import './AuthTabs.css';

export default function AuthTabs({ activeTab, onTabChange }) {
  return (
    <div className="auth-tabs">
      <button
        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
        onClick={() => onTabChange('login')}
      >
        Connexion
      </button>
      <button
        className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
        onClick={() => onTabChange('register')}
      >
        Inscription
      </button>
    </div>
  );
}
