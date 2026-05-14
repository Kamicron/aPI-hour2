import LayoutDisconnected from '../components/layout/LayoutDisconnected';
import './LegalMention.css';
import '../components/dashboard/DashboardHeader.css';
import DroppableCard from '../components/LegalMention/DroppableCard';
import Separator from '../components/global/Separator';

export default function LegalMention() {
  return (
    <LayoutDisconnected>
      <div className="legal-mention">
        <h2>Mentions légales</h2>

        <div className="legal-mention-content">
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">person</span>Éditeur du site</h3>}
            content={
              <div>
                <p>Le présent site, accessible à l’adresse <a href="https://hour.pi-cto.top/">https://hour.pi-cto.top/</a>, est édité par :</p>
                <p>Ludovic CHEVROULET</p>
                <p>Adresse : 20 rue Pierre Peugeot, 25310 Hérimoncourt, France</p>
                <p>Adresse email : ludovic.chevroulet@outlook.fr</p>
                <p>Le site est exploité à titre personnel, en dehors de toute activité commerciale ou professionnelle déclarée.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">dns</span>Hébergeur du site</h3>}
            content={
              <div>
                <p>Le site est hébergé sur un serveur personnel (Raspberry Pi) administré par l’éditeur.</p>
                <p>Le nom de domaine est fourni par : Hostinger</p>
                <p>Site web : <a href="https://www.hostinger.com">https://www.hostinger.com</a></p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">track_changes</span>Objet du site</h3>}
            content={
              <div>
                <p>Le site aPI-Hour est une application de suivi du temps permettant aux utilisateurs d’enregistrer et consulter leurs heures (système de pointage).</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">copyright</span>Propriété intellectuelle</h3>}
            content={
              <div>
                <p>Sauf mention contraire, tous les éléments présents sur le site (textes, code, éléments graphiques) sont la propriété de l’éditeur.</p>
                <p>Toute reproduction, représentation, modification ou exploitation sans autorisation préalable est interdite.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">public</span>Accès au site</h3>}
            content={
              <div>
                <p>Le site est accessible gratuitement à tout utilisateur disposant d’un accès à Internet.</p>
                <p>L’éditeur ne pourra être tenu responsable en cas d’indisponibilité du service.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">security</span>Données personnelles</h3>}
            content={
              <div>
                <p>Dans le cadre de son fonctionnement, le site collecte certaines données personnelles, notamment :</p>
                <p> - Adresse email (lors de la création d’un compte utilisateur)</p>
                <p>Ces données sont utilisées uniquement pour permettre l’accès aux fonctionnalités du site (gestion des comptes utilisateurs).</p>
                <p>Elles ne sont ni revendues, ni cédées à des tiers.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">gavel</span>Droits des utilisateurs</h3>}
            content={
              <div>
                <p>Conformément au Règlement Général sur la Protection des Données (RGPD), les utilisateurs disposent des droits suivants :</p>
                <p> - Droit d’accès</p>
                <p> - Droit de rectification</p>
                <p> - Droit d’effacement</p>
                <p>Pour exercer ces droits, vous pouvez contacter : ludovic.chevroulet@outlook.fr</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">cookie</span>Cookies</h3>}
            content={
              <div>
                <p>Le site n’utilise pas de cookies à des fins de suivi ou de publicité.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">warning</span>Responsabilité</h3>}
            content={
              <div>
                <p>L’éditeur s’efforce de fournir des informations aussi précises que possible, mais ne saurait garantir l’exactitude, la complétude ou l’actualisation des informations diffusées.</p>
              </div>
            }
          />
          <Separator />
          <DroppableCard
            header={<h3 className="droppable-card-header-title"><span className="material-icons">balance</span>Droit applicable</h3>}
            content={
              <div>
                <p>Les présentes mentions légales sont soumises au droit français.</p>
              </div>
            }
          />
        </div>
      </div>
    </LayoutDisconnected>
  );
}
