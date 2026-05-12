import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <p>Welcome, <strong>{user?.email}</strong>!</p>
        <p>You are successfully authenticated.</p>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
