package com.apihour.android.util

import java.time.Duration
import java.time.LocalDate
import java.time.ZoneId
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

private val FR = Locale.FRENCH

private val timeFmt = DateTimeFormatter.ofPattern("HH:mm", FR)
private val dayNameFmt = DateTimeFormatter.ofPattern("EEEE", FR)
private val dayMonthFmt = DateTimeFormatter.ofPattern("d MMM", FR)
private val fullDateFmt = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", FR)
private val monthYearFmt = DateTimeFormatter.ofPattern("LLLL yyyy", FR)

/** 02:13:45 */
fun Duration.toClock(): String {
    val s = seconds.coerceAtLeast(0)
    return "%02d:%02d:%02d".format(s / 3600, (s % 3600) / 60, s % 60)
}

/** 3h15 */
fun Double.toHoursMinutes(): String {
    val totalMinutes = (this * 60).roundToInt().coerceAtLeast(0)
    return "%dh%02d".format(totalMinutes / 60, totalMinutes % 60)
}

fun Instant.toLocalTimeText(): String = atZone(ZoneId.systemDefault()).format(timeFmt)

fun LocalDate.dayName(): String = format(dayNameFmt).replaceFirstChar { it.uppercase() }
fun LocalDate.dayMonth(): String = format(dayMonthFmt)
fun LocalDate.fullDate(): String = format(fullDateFmt).replaceFirstChar { it.uppercase() }
fun java.time.YearMonth.title(): String = format(monthYearFmt).replaceFirstChar { it.uppercase() }

/** "jean.dupont@mail.com" -> "Jean" */
fun String.firstNameFromEmail(): String =
    substringBefore('@').split('.', '_', '-').firstOrNull().orEmpty()
        .replaceFirstChar { it.uppercase() }
