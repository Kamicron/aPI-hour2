import { useState } from 'react';
import '../dashboard/DashboardLayout.css';
import './DroppableCard.css';

export default function DroppableCard({ header, content }) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`droppable-card ${open ? 'open' : ''}`}>
      <header
        className="droppable-card-header"
        onClick={() => setOpen(!open)}
      >
        <div>{header}</div>

        <span className="material-icons arrow">
          keyboard_arrow_right
        </span>
      </header>

      <section className="droppable-card-content">
        {content}
      </section>
    </section>
  );
}
