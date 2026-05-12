import { useState } from 'react';
import './LanguageSelector.css';

export default function LanguageSelector() {
  const [language, setLanguage] = useState('FR');

  const languages = [
    { code: 'FR', label: 'FR' },
    { code: 'EN', label: 'EN' }
  ];

  return (
    <div className="language-selector">
      <span className="material-icons">language</span>
      <div className="language-buttons">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`lang-btn ${language === lang.code ? 'active' : ''}`}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
