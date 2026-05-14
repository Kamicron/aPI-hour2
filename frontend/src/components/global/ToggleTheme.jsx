import '../dashboard/DashboardLayout.css';
import { useTheme } from '../../context/ThemeContext';

export default function HeaderLayout({ left, right }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <span className="material-icons">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
}
