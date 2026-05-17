import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (calendarData, monthStats, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const csvRows = [];

  csvRows.push(['Export Calendrier - ' + monthName]);
  csvRows.push([]);

  if (monthStats) {
    csvRows.push(['Résumé du mois']);
    csvRows.push(['Heures réalisées', monthStats.totalHours]);
    csvRows.push(['Objectif', monthStats.goalHours]);
    csvRows.push(['Heures sup', monthStats.overtimeHours]);
    csvRows.push(['Progression', monthStats.progress + '%']);
    csvRows.push(['Période', `${monthStats.periodStart} - ${monthStats.periodEnd}`]);
    csvRows.push([]);
  }

  csvRows.push(['Détail des sessions']);
  csvRows.push(['Date', 'Heure début', 'Heure fin', 'Durée', 'Pause', 'Statut']);

  const daysWithSessions = calendarData.filter(day => day.sessions && day.sessions.length > 0);

  daysWithSessions.forEach(day => {
    day.sessions.forEach(session => {
      csvRows.push([
        day.date,
        session.startTime || '',
        session.endTime || '',
        session.duration || '',
        session.pauseDuration || '00:00',
        session.status === 'ongoing' ? 'En cours' : 'Terminé'
      ]);
    });
  });

  const csvContent = csvRows.map(row =>
    row.map(cell => {
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',')
  ).join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `calendrier_${year}_${String(month).padStart(2, '0')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (calendarData, monthStats, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Calendrier - ' + monthName, 14, 20);

  let yPosition = 35;

  if (monthStats) {
    doc.setFontSize(14);
    doc.text('Résumé du mois', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const summaryData = [
      ['Heures réalisées', monthStats.totalHours],
      ['Objectif', monthStats.goalHours],
      ['Heures sup', monthStats.overtimeHours],
      ['Progression', monthStats.progress + '%'],
      ['Période', `${monthStats.periodStart} - ${monthStats.periodEnd}`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Indicateur', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  doc.setFontSize(14);
  doc.text('Détail des sessions', 14, yPosition);
  yPosition += 5;

  const daysWithSessions = calendarData.filter(day => day.sessions && day.sessions.length > 0);

  const sessionsData = [];
  daysWithSessions.forEach(day => {
    day.sessions.forEach(session => {
      sessionsData.push([
        day.date,
        session.startTime || '',
        session.endTime || '',
        session.duration || '',
        session.pauseDuration || '00:00',
        session.status === 'ongoing' ? 'En cours' : 'Terminé'
      ]);
    });
  });

  if (sessionsData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Début', 'Fin', 'Durée', 'Pause', 'Statut']],
      body: sessionsData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
      styles: { fontSize: 9 }
    });
  } else {
    doc.setFontSize(10);
    doc.text('Aucune session pour ce mois', 14, yPosition + 10);
  }

  doc.save(`calendrier_${year}_${String(month).padStart(2, '0')}.pdf`);
};
