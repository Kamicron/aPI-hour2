import Sidebar from '../dashboard/Sidebar';
import HeaderLayout from './HeaderLayout';
import MobileHeader from '../dashboard/MobileHeader';
import BottomNav from '../dashboard/BottomNav';
import '../dashboard/DashboardLayout.css';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <MobileHeader />
      <div className="dashboard-main">
        <HeaderLayout />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
