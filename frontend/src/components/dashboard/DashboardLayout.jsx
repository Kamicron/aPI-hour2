import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <MobileHeader />
      <div className="dashboard-main">
        <DashboardHeader />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
