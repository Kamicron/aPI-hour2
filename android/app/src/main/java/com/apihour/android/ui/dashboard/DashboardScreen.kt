package com.apihour.android.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.apihour.android.data.ActiveSession
import com.apihour.android.data.DayData
import com.apihour.android.data.Repository
import com.apihour.android.ui.theme.StatusColors
import com.apihour.android.util.dayMonth
import com.apihour.android.util.dayName
import com.apihour.android.util.firstNameFromEmail
import com.apihour.android.util.fullDate
import com.apihour.android.util.toClock
import com.apihour.android.util.toHoursMinutes
import com.apihour.android.util.toLocalTimeText
import kotlinx.coroutines.delay
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(vm: DashboardViewModel, repo: Repository) {
    val state by vm.state.collectAsStateWithLifecycle()
    val email by repo.email.collectAsStateWithLifecycle(initialValue = null)
    var confirmStop by remember { mutableStateOf(false) }

    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { vm.refresh() }

    // Tic d'une seconde tant qu'une session existe.
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(state.active) {
        while (state.active != null) {
            now = Instant.now()
            delay(1000)
        }
        now = Instant.now()
    }

    PullToRefreshBox(isRefreshing = state.loading, onRefresh = vm::refresh) {
        Column(
            modifier = Modifier
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column {
                val name = email?.firstNameFromEmail().orEmpty()
                Text(
                    if (name.isEmpty()) "Bonjour 👋" else "Bonjour, $name 👋",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    LocalDate.now().fullDate(),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            state.error?.let { ErrorBanner(it, onRetry = vm::refresh) }

            SessionCard(state.active, now)

            ActionsCard(
                active = state.active,
                busy = state.busy,
                onStart = vm::start,
                onPause = vm::pause,
                onResume = vm::resume,
                onStop = { confirmStop = true },
            )

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                GoalCard(state, Modifier.weight(1f))
                OvertimeCard(state, Modifier.weight(1f))
            }

            WeekHistoryCard(state.weekStart, state.week)
            Spacer(Modifier.height(8.dp))
        }
    }

    if (confirmStop) {
        AlertDialog(
            onDismissRequest = { confirmStop = false },
            title = { Text("Arrêter la session ?") },
            text = { Text("Le temps travaillé sera enregistré.") },
            confirmButton = {
                TextButton(onClick = { confirmStop = false; vm.stop() }) { Text("Arrêter") }
            },
            dismissButton = { TextButton(onClick = { confirmStop = false }) { Text("Annuler") } },
        )
    }
}

@Composable
private fun ErrorBanner(message: String, onRetry: () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
        Row(
            Modifier.padding(start = 16.dp, end = 8.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                message,
                Modifier.weight(1f),
                color = MaterialTheme.colorScheme.onErrorContainer,
                style = MaterialTheme.typography.bodyMedium,
            )
            TextButton(onClick = onRetry) { Text("Réessayer") }
        }
    }
}

@Composable
private fun SessionCard(active: ActiveSession?, now: Instant) {
    val (label, color) = when {
        active == null -> "Aucune session en cours" to MaterialTheme.colorScheme.onSurfaceVariant
        active.paused -> "En pause" to StatusColors.Paused
        else -> "En cours depuis ${active.start.toLocalTimeText()}" to StatusColors.Running
    }

    Card(Modifier.fillMaxWidth()) {
        Column(
            Modifier.padding(20.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("Session en cours", style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.Start))
            Row(
                Modifier.align(Alignment.Start).padding(top = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(Modifier.size(8.dp).clip(CircleShape).background(color))
                Spacer(Modifier.width(8.dp))
                Text(label, color = color, style = MaterialTheme.typography.bodyMedium)
            }

            Text(
                (active?.workedAt(now) ?: Duration.ZERO).toClock(),
                fontSize = 56.sp,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.displayMedium.copy(fontFeatureSettings = "tnum"),
                modifier = Modifier.padding(vertical = 16.dp),
            )

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                StatBlock("Heure de début", active?.start?.toLocalTimeText() ?: "--:--")
                StatBlock("Pauses cumulées", (active?.pausedAt(now) ?: Duration.ZERO).toClock())
            }
        }
    }
}

@Composable
private fun StatBlock(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            value,
            style = MaterialTheme.typography.titleLarge.copy(fontFeatureSettings = "tnum"),
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun ActionsCard(
    active: ActiveSession?,
    busy: Boolean,
    onStart: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onStop: () -> Unit,
) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Actions", style = MaterialTheme.typography.titleMedium)

            val canStart = active == null && !busy
            val canResume = active?.paused == true && !busy
            ActionRow(
                title = if (active?.paused == true) "REPRENDRE" else "POINTER",
                subtitle = if (active?.paused == true) "Reprendre le suivi du temps." else "Démarrer le suivi du temps.",
                enabled = canStart || canResume,
                color = StatusColors.Running,
                onClick = if (canResume) onResume else onStart,
            ) {
                Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(26.dp))
            }

            ActionRow(
                title = "PAUSE",
                subtitle = "Mettre la session en pause.",
                enabled = active != null && !active.paused && !busy,
                color = StatusColors.Paused,
                onClick = onPause,
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    repeat(2) {
                        Box(Modifier.size(width = 5.dp, height = 18.dp).clip(RoundedCornerShape(2.dp)).background(Color.White))
                    }
                }
            }

            ActionRow(
                title = "ARRÊTER",
                subtitle = "Arrêter la session. Le temps est enregistré.",
                enabled = active != null && !busy,
                color = StatusColors.Stopped,
                onClick = onStop,
            ) {
                Box(Modifier.size(16.dp).clip(RoundedCornerShape(3.dp)).background(Color.White))
            }
        }
    }
}

@Composable
private fun ActionRow(
    title: String,
    subtitle: String,
    enabled: Boolean,
    color: Color,
    onClick: () -> Unit,
    icon: @Composable () -> Unit,
) {
    Card(
        onClick = onClick,
        enabled = enabled,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHighest),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (enabled) color else color.copy(alpha = 0.35f)),
                contentAlignment = Alignment.Center,
            ) { icon() }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun GoalCard(state: DashboardState, modifier: Modifier) {
    val weekly = state.weekly
    val worked = weekly?.hoursWorked ?: 0.0
    val goal = weekly?.weeklyGoal ?: 40
    val remaining = (goal - worked).coerceAtLeast(0.0)

    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text("Objectif hebdo", style = MaterialTheme.typography.titleSmall)
            Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 8.dp)) {
                Text(
                    "%.1f".format(Locale.FRENCH, worked),
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(" / $goal h", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(bottom = 4.dp))
            }
            LinearProgressIndicator(
                progress = { ((weekly?.percentage ?: 0.0) / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
            )
            Text(
                if (remaining > 0) "Il reste ${remaining.toHoursMinutes()} pour atteindre l'objectif." else "Objectif atteint 🎉",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun OvertimeCard(state: DashboardState, modifier: Modifier) {
    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text("Heures sup.", style = MaterialTheme.typography.titleSmall)
            Text(
                (state.overtime?.weeklyRealOvertime ?: 0.0).toHoursMinutes(),
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.padding(top = 8.dp),
            )
            Text(
                "Cette semaine",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
            Text(
                "Ce mois : ${(state.overtime?.monthlyRealOvertime ?: 0.0).toHoursMinutes()}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 10.dp),
            )
        }
    }
}

@Composable
private fun WeekHistoryCard(weekStart: LocalDate, days: List<DayData>) {
    val byDate = days.associateBy { it.date }
    val today = LocalDate.now()

    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(vertical = 16.dp)) {
            Text(
                "Historique de la semaine",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
            for (i in 0 until 7) {
                val date = weekStart.plusDays(i.toLong())
                val data = byDate[date.toString()]
                // On masque le week-end s'il n'y a rien à montrer.
                if (i >= 5 && data == null) continue

                HorizontalDivider(Modifier.padding(top = 8.dp))
                val isToday = date == today
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(if (isToday) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f) else Color.Transparent)
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        date.dayName(),
                        Modifier.weight(1.3f),
                        fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                    )
                    Text(date.dayMonth(), Modifier.weight(1f), color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(data?.totalDuration ?: "—", Modifier.weight(0.8f), textAlign = TextAlign.End)
                    Spacer(Modifier.width(12.dp))
                    DayStatus(data, Modifier.weight(1.1f))
                }
            }
        }
    }
}

@Composable
private fun DayStatus(data: DayData?, modifier: Modifier) {
    val (text, color) = when {
        data == null -> "" to Color.Transparent
        data.sessions.any { it.status == "ongoing" } -> "En cours" to MaterialTheme.colorScheme.primary
        data.sessions.isNotEmpty() -> "Validée" to StatusColors.Running
        data.vacationStatus != null -> "Congé" to MaterialTheme.colorScheme.tertiary
        else -> "" to Color.Transparent
    }
    Box(modifier, contentAlignment = Alignment.CenterEnd) {
        if (text.isNotEmpty()) {
            Text(
                text,
                color = color,
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(color.copy(alpha = 0.14f))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            )
        }
    }
}
