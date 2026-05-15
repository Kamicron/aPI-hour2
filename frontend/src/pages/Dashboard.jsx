import DashboardLayout from '../components/dashboard/DashboardLayout';
import TimeTracker from '../components/dashboard/TimeTracker';
import WeeklyGoal from '../components/dashboard/WeeklyGoal';
import OvertimeHours from '../components/dashboard/OvertimeHours';
import WeekHistory from '../components/dashboard/WeekHistory';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="dashboard-widgets">
        <div className="TimeTracking"><TimeTracker /></div>
        <div className="WeeklyGoal"><WeeklyGoal /></div>
        <div className="OvertimeHours"><OvertimeHours /></div>
        <div className="WeekHistory"><WeekHistory /></div>
      </div>
    </DashboardLayout>
  );
}
