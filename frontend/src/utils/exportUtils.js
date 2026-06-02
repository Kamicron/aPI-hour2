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

const normalizeComment = (comment) => {
  if (!comment) return '';
  const s = String(comment);
  return s.length > 500 ? s.slice(0, 500) : s;
};

const hexToRgb = (hex) => {
  const cleaned = String(hex || '').trim().replace('#', '');
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some(n => Number.isNaN(n))) return null;
  return [r, g, b];
};

const getCssVar = (name) => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
  csvRows.push(['Date', 'Heure début', 'Heure fin', 'Durée', 'Pause', 'Statut', 'Commentaire']);

  const daysWithSessions = calendarData.filter(day => day.sessions && day.sessions.length > 0);

  daysWithSessions.forEach(day => {
    day.sessions.forEach(session => {
      csvRows.push([
        day.date,
        session.startTime || '',
        session.endTime || '',
        session.duration || '',
        session.pauseDuration || '00:00',
        session.status === 'ongoing' ? 'En cours' : 'Terminé',
        normalizeComment(session.comment)
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

const loadImageAsDataUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportToPDF = async (calendarData, monthStats, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const doc = new jsPDF();

  const primaryHex = getCssVar('--color-primary') || '#0B5DFA';
  const primaryRgb = hexToRgb(primaryHex) || [11, 93, 250];

  const siteName = 'aPI-Hour';
  const logoUrl = '/images/logo/white_api-hour.png';
  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(logoUrl);
  } catch {
    logoDataUrl = null;
  }

  const headerHeight = 26;
  const footerHeight = 14;
  const contentMargin = {
    left: 14,
    right: 14,
    top: headerHeight,
    bottom: footerHeight
  };

  const titleText = 'Calendrier - ' + monthName;
  const disclaimerText = "Document indicatif : ce document est un outil d’aide. Les informations affichées/exportées n’ont pas de valeur contractuelle ou légale.";
  const generatedAt = new Date();
  const generatedAtText = `Généré le ${generatedAt.toLocaleString('fr-FR')}`;
  const drawHeaderFooter = (pageNumber, totalPages) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (logoDataUrl) {
      const imgType = String(logoDataUrl).startsWith('data:image/webp') ? 'WEBP' : 'PNG';
      doc.addImage(logoDataUrl, imgType, contentMargin.left, 8, 10, 10);
    }

    const brandX = contentMargin.left + 14;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('a', brandX, 14);
    const aWidth = doc.getTextWidth('a');
    doc.setTextColor(...primaryRgb);
    doc.text('PI', brandX + aWidth, 14);
    const piWidth = doc.getTextWidth('PI');
    doc.setTextColor(0);
    doc.text('-Hour', brandX + aWidth + piWidth, 14);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(generatedAtText, pageWidth - contentMargin.right, 14, { align: 'right' });
    doc.setTextColor(0);

    doc.setFontSize(14);
    doc.text(titleText, pageWidth / 2, 14, { align: 'center' });

    doc.setDrawColor(...primaryRgb);
    doc.setLineWidth(0.2);
    doc.line(contentMargin.left, headerHeight - 4, pageWidth - contentMargin.right, headerHeight - 4);

    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(disclaimerText, pageWidth / 2, pageHeight - 8, {
      align: 'center',
      maxWidth: pageWidth - contentMargin.left - contentMargin.right
    });

    doc.setFontSize(8);
    doc.text(`Page ${pageNumber}/${totalPages}`, pageWidth - contentMargin.right, pageHeight - 8, { align: 'right' });
    doc.setTextColor(0);
  };

  let yPosition = contentMargin.top + 8;

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
      headStyles: { fillColor: primaryRgb },
      margin: contentMargin,
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
      headStyles: { fillColor: primaryRgb },
      margin: contentMargin,
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
        session.status === 'ongoing' ? 'En cours' : 'Terminé',
        normalizeComment(session.comment)
      ]);
    });
  });

  if (sessionsData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Début', 'Fin', 'Durée', 'Pause', 'Statut', 'Commentaire']],
      body: sessionsData,
      theme: 'striped',
      headStyles: { fillColor: primaryRgb },
      margin: contentMargin,
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
      headStyles: { fillColor: primaryRgb },
      margin: contentMargin,
      styles: { fontSize: 9 }
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeaderFooter(i, totalPages);
  }

  doc.save(`calendrier_${year}_${String(month).padStart(2, '0')}.pdf`);
};
