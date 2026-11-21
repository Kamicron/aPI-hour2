package com.apihour.android.ui.calendar

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.apihour.android.data.DayData
import com.apihour.android.util.fullDate
import com.apihour.android.util.title
import java.time.LocalDate

private val weekDays = listOf("L", "M", "M", "J", "V", "S", "D")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalendarScreen(vm: CalendarViewModel) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(
        Modifier
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Navigation de mois
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = vm::previousMonth) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, "Mois précédent")
            }
            Text(
                state.month.title(),
                Modifier.weight(1f),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold,
            )
            IconButton(onClick = vm::nextMonth) {
                Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, "Mois suivant")
            }
        }

        // Résumé du mois
        Card(Modifier.fillMaxWidth()) {
            Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                Summary("Total", state.stats.totalHours)
                Summary("Objectif", state.stats.goalHours.ifBlank { "—" })
                Summary("Heures sup.", state.stats.overtimeHours)
            }
        }

        if (state.error != null) {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                Row(Modifier.padding(start = 16.dp, end = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(state.error.orEmpty(), Modifier.weight(1f), color = MaterialTheme.colorScheme.onErrorContainer)
                    TextButton(onClick = vm::reload) { Text("Réessayer") }
                }
            }
        }

        // Grille
        Box(Modifier.fillMaxWidth()) {
            MonthGrid(state, onSelect = vm::select)
            if (state.loading) {
                CircularProgressIndicator(Modifier.align(Alignment.Center))
            }
        }
    }

    val selected = state.selected
    if (selected != null) {
        ModalBottomSheet(
            onDismissRequest = { vm.select(null) },
            sheetState = rememberModalBottomSheetState(),
        ) {
            DayDetails(selected, state.days[selected.toString()])
        }
    }
}

@Composable
private fun Summary(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun MonthGrid(state: CalendarState, onSelect: (LocalDate) -> Unit) {
    val first = state.month.atDay(1)
    val leading = first.dayOfWeek.value - 1 // lundi = 0
    val total = leading + state.month.lengthOfMonth()
    val rows = (total + 6) / 7
    val today = LocalDate.now()

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(Modifier.fillMaxWidth()) {
            weekDays.forEach {
                Text(
                    it,
                    Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        for (r in 0 until rows) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (c in 0 until 7) {
                    val dayNumber = r * 7 + c - leading + 1
                    if (dayNumber < 1 || dayNumber > state.month.lengthOfMonth()) {
                        Spacer(Modifier.weight(1f).aspectRatio(0.8f))
                    } else {
                        val date = state.month.atDay(dayNumber)
                        DayCell(
                            date = date,
                            data = state.days[date.toString()],
                            isToday = date == today,
                            modifier = Modifier.weight(1f),
                            onClick = { onSelect(date) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(date: LocalDate, data: DayData?, isToday: Boolean, modifier: Modifier, onClick: () -> Unit) {
    val hasWork = data?.sessions?.isNotEmpty() == true
    val onVacation = data?.vacationStatus != null
    val container = when {
        hasWork -> MaterialTheme.colorScheme.primaryContainer
        onVacation -> MaterialTheme.colorScheme.tertiaryContainer
        else -> MaterialTheme.colorScheme.surfaceContainerLow
    }
    Surface(
        onClick = onClick,
        modifier = modifier.aspectRatio(0.8f),
        shape = MaterialTheme.shapes.medium,
        color = container,
        border = if (isToday) BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null,
    ) {
        Column(
            Modifier.padding(4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
            )
            if (hasWork) {
                Text(
                    data?.totalDuration.orEmpty(),
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                )
            } else if (onVacation) {
                Text("Congé", style = MaterialTheme.typography.labelSmall, maxLines = 1)
            }
        }
    }
}

@Composable
private fun DayDetails(date: LocalDate, data: DayData?) {
    Column(
        Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 20.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(date.fullDate(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)

        if (data == null || (data.sessions.isEmpty() && data.vacationStatus == null)) {
            Text("Aucune session ce jour-là.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        data?.vacationStatus?.let {
            Text("Congé : $it", color = MaterialTheme.colorScheme.tertiary)
        }
        data?.sessions?.forEachIndexed { index, s ->
            if (index > 0) HorizontalDivider()
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    val end = s.endTime ?: "en cours"
                    Text("${s.startTime} → $end", style = MaterialTheme.typography.titleMedium)
                    val pause = s.pauseDuration?.takeIf { it != "00:00" }
                    if (pause != null) {
                        Text("Pauses : $pause", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (!s.comment.isNullOrBlank()) {
                        Text(s.comment, style = MaterialTheme.typography.bodySmall)
                    }
                }
                Text(s.duration.orEmpty(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            }
        }
        val total = data?.totalDuration
        if (total != null && data.sessions.size > 1) {
            HorizontalDivider()
            Row(Modifier.fillMaxWidth()) {
                Text("Total", Modifier.weight(1f), fontWeight = FontWeight.Bold)
                Text(total, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(16.dp))
    }
}
