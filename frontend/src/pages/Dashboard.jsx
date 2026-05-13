import DashboardLayout from '../components/dashboard/DashboardLayout';
import TimeTracker from '../components/dashboard/TimeTracker';
import WeeklyGoal from '../components/dashboard/WeeklyGoal';
import OvertimeHours from '../components/dashboard/OvertimeHours';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="dashboard-widgets">
        <div className="dashboard-main-content">
          <TimeTracker />
        </div>
        <div className="dashboard-sidebar-widgets">
          <WeeklyGoal />
          <OvertimeHours />
        </div>
      </div>
    </DashboardLayout>
  );
}
