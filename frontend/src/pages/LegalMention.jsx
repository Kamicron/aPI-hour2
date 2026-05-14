import LayoutDisconnected from '../components/layout/LayoutDisconnected';
import './LegalMention.css';
import '../components/dashboard/DashboardHeader.css';

export default function LegalMention() {
  return (
    <LayoutDisconnected>
      <div className="legal-mention">
        <h1>Mentions légales</h1>
        <p>Contenu à remplir</p>
      </div>
    </LayoutDisconnected>
  );
}
