import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const calculateOvertimeBreakdown = (monthStats) => {
  if (!monthStats || !monthStats.overtimeHours) {
    return { hours25: '0h 00m', hours50: '0h 00m', compensated25: '0h 00m', compensated50: '0h 00m', totalCompensated: '0h 00m' };
  }

  // Use the breakdown data from the backend if available
  if (monthStats.overtimeHours25 !== undefined && monthStats.overtimeHours50 !== undefined) {
    return {
      hours25: formatHours(monthStats.overtimeHours25),
      hours50: formatHours(monthStats.overtimeHours50),
      compensated25: formatHours(monthStats.overtimeCompensated25 || 0),
      compensated50: formatHours(monthStats.overtimeCompensated50 || 0),
      totalCompensated: monthStats.overtimeCompensatedTotal ? formatHours(monthStats.overtimeCompensatedTotal) : monthStats.overtimeHours
    };
  }

  // Fallback if backend doesn't provide breakdown
  return {
    hours25: '0h 00m',
    hours50: '0h 00m',
    compensated25: '0h 00m',
    compensated50: '0h 00m',
    totalCompensated: monthStats.overtimeHours
  };
};

const getVacationLabel = (vacationStatus) => {
  if (!vacationStatus) return '';
  if (vacationStatus === 'public_holiday') return 'Férié';
  if (vacationStatus === 'sick_leave') return 'Maladie';
  if (vacationStatus === 'approved') return 'Congé';
  return vacationStatus;
};

const getVacationCounts = (calendarData) => {
  const daysWithVacations = (calendarData || []).filter(day => day?.vacationStatus);
  const countsByStatus = {};
  daysWithVacations.forEach(day => {
    const status = day.vacationStatus;
    countsByStatus[status] = (countsByStatus[status] || 0) + 1;
  });
  return {
    total: daysWithVacations.length,
    byStatus: countsByStatus,
    days: daysWithVacations
  };
};

export const exportToCSV = (calendarData, monthStats, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const csvRows = [];

  csvRows.push(['Export Calendrier - ' + monthName]);
  csvRows.push([]);

  if (monthStats) {
    const overtimeBreakdown = calculateOvertimeBreakdown(monthStats);
    const isMissing = typeof monthStats.balanceHours === 'number' ? monthStats.balanceHours < 0 : false;
    const balanceLabel = isMissing ? 'Heures manquantes' : 'Heures supplémentaires';
    const balanceValue = isMissing ? (monthStats.missingHours || '0h 00m') : monthStats.overtimeHours;

    csvRows.push(['Résumé du mois']);
    csvRows.push(['Heures réalisées', monthStats.totalHours]);
    csvRows.push(['Objectif', monthStats.goalHours]);
    csvRows.push([balanceLabel, balanceValue]);
    csvRows.push(['']);
    csvRows.push(['Détail des heures supplémentaires à payer :']);
    csvRows.push(['  - Heures à 25% (8 premières heures/semaine)', overtimeBreakdown.hours25]);
    csvRows.push(['  - Heures à 50% (au-delà de 8h/semaine)', overtimeBreakdown.hours50]);
    csvRows.push(['']);
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

  const daysWithVacations = calendarData.filter(day => day.vacationStatus);
  const vacationInfo = getVacationCounts(calendarData);
  if (vacationInfo.total > 0) {
    csvRows.push([]);
    csvRows.push(['Congés / Absences']);

    csvRows.push(['Nombre de jours posés (dans la période)', String(vacationInfo.total)]);
    Object.entries(vacationInfo.byStatus).forEach(([status, count]) => {
      csvRows.push([`- ${getVacationLabel(status)}`, String(count)]);
    });
    csvRows.push(['']);

    csvRows.push(['Date', 'Type']);

    vacationInfo.days.forEach(day => {
      csvRows.push([
        day.date,
        getVacationLabel(day.vacationStatus)
      ]);
    });
  }

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
    const overtimeBreakdown = calculateOvertimeBreakdown(monthStats);
    const isMissing = typeof monthStats.balanceHours === 'number' ? monthStats.balanceHours < 0 : false;
    const balanceLabel = isMissing ? 'Heures manquantes' : 'Heures supplémentaires';
    const balanceValue = isMissing ? (monthStats.missingHours || '0h 00m') : monthStats.overtimeHours;

    doc.setFontSize(14);
    doc.text('Résumé du mois', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const summaryData = [
      ['Heures réalisées', monthStats.totalHours],
      ['Objectif', monthStats.goalHours],
      [balanceLabel, balanceValue],
      ['Progression', monthStats.progress + '%'],
      ['Période', `${monthStats.periodStart} - ${monthStats.periodEnd}`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Indicateur', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
      styles: { fontSize: 10 }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Add overtime breakdown section
    doc.setFontSize(12);
    doc.text('Détail des majorations (loi française)', 14, yPosition);
    yPosition += 5;

    const overtimeData = [
      ['Heures à 25% (8 premières/semaine)', overtimeBreakdown.hours25],
      ['Heures à 50% (au-delà de 8h/semaine)', overtimeBreakdown.hours50]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Type de majoration', 'Heures à payer']],
      body: overtimeData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
      styles: { fontSize: 9 }
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
    yPosition = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.text('Aucune session pour ce mois', 14, yPosition + 10);
    yPosition = yPosition + 20;
  }

  const vacationInfo = getVacationCounts(calendarData);
  if (vacationInfo.total > 0) {
    doc.setFontSize(14);
    doc.text('Congés / Absences', 14, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.text(`Nombre de jours posés (dans la période) : ${vacationInfo.total}`, 14, yPosition);
    yPosition += 6;

    Object.entries(vacationInfo.byStatus).forEach(([status, count]) => {
      doc.text(`- ${getVacationLabel(status)} : ${count}`, 14, yPosition);
      yPosition += 5;
    });

    yPosition += 3;

    const vacationsData = vacationInfo.days.map(day => ([
      day.date,
      getVacationLabel(day.vacationStatus)
    ]));

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Type']],
      body: vacationsData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14 },
      styles: { fontSize: 9 }
    });
  }

  doc.save(`calendrier_${year}_${String(month).padStart(2, '0')}.pdf`);
};
