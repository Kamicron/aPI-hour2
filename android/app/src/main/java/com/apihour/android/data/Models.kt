package com.apihour.android.data

import kotlinx.serialization.Serializable
import java.time.Duration
import java.time.Instant
import java.time.OffsetDateTime

// ---------- Auth ----------

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class RefreshRequest(val refreshToken: String)

@Serializable
data class AuthResponse(val token: String, val refreshToken: String)

@Serializable
data class MessageResponse(val message: String = "")

// ---------- Session en cours (/api/session/*) ----------

@Serializable
data class SessionDto(val status: String = "NULL")

@Serializable
data class TimeEntryDto(
    val id: String,
    val startTime: String,
    val endTime: String? = null,
    val comment: String? = null,
)

@Serializable
data class PauseDto(
    val id: String,
    val pauseStart: String,
    val pauseEnd: String? = null,
)

@Serializable
data class SessionResponse(
    val session: SessionDto? = null,
    val timeEntry: TimeEntryDto? = null,
    val pauses: List<PauseDto> = emptyList(),
)

// ---------- Stats (/api/stats/*) ----------

@Serializable
data class WeeklyHours(
    val weeklyGoal: Int = 40,
    val hoursWorked: Double = 0.0,
    val percentage: Double = 0.0,
)

@Serializable
data class Overtime(
    val weeklyRealOvertime: Double = 0.0,
    val monthlyRealOvertime: Double = 0.0,
)

@Serializable
data class SessionSummary(
    val id: String = "",
    val startTime: String = "",
    val endTime: String? = null,
    val comment: String? = null,
    val status: String = "completed", // "completed" | "ongoing"
    val pauseDuration: String? = null,
    val duration: String? = null,
)

@Serializable
data class DayData(
    val date: String,
    val vacationStatus: String? = null,
    val sessions: List<SessionSummary> = emptyList(),
    val totalDuration: String? = null,
)

@Serializable
data class MonthStats(
    val totalHours: String = "0h 00m",
    val goalHours: String = "",
    val overtimeHours: String = "0h 00m",
    val missingHours: String? = null,
    val balanceHours: Double = 0.0,
)

@Serializable
data class PeriodResponse(
    val days: List<DayData> = emptyList(),
    val monthStats: MonthStats = MonthStats(),
)

// ---------- Modèle métier ----------

data class PauseSpan(val start: Instant, val end: Instant?)

data class ActiveSession(
    val paused: Boolean,
    val start: Instant,
    val pauses: List<PauseSpan>,
) {
    /** Temps de pause cumulé à l'instant [now] (la pause en cours compte jusqu'à maintenant). */
    fun pausedAt(now: Instant): Duration = pauses.fold(Duration.ZERO) { acc, p ->
        val end = p.end ?: if (paused) now else p.start
        acc + Duration.between(p.start, end).coerceAtLeast(Duration.ZERO)
    }

    /** Temps de travail net (hors pauses) à l'instant [now]. */
    fun workedAt(now: Instant): Duration =
        (Duration.between(start, now) - pausedAt(now)).coerceAtLeast(Duration.ZERO)
}

/** Le backend sérialise les java.util.Date en ISO-8601 avec offset (ex: 2026-11-21T11:22:53.790+00:00). */
fun String.toInstant(): Instant = OffsetDateTime.parse(this).toInstant()

fun SessionResponse.toActive(): ActiveSession? {
    val status = session?.status ?: return null
    val entry = timeEntry ?: return null
    if (status == "NULL") return null
    return ActiveSession(
        paused = status == "paused",
        start = entry.startTime.toInstant(),
        pauses = pauses.map { PauseSpan(it.pauseStart.toInstant(), it.pauseEnd?.toInstant()) },
    )
}
