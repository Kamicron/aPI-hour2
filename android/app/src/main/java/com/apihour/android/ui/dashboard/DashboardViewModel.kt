package com.apihour.android.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apihour.android.data.ActiveSession
import com.apihour.android.data.DayData
import com.apihour.android.data.Overtime
import com.apihour.android.data.Repository
import com.apihour.android.data.WeeklyHours
import com.apihour.android.data.userMessage
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.supervisorScope
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters

data class DashboardState(
    val loading: Boolean = true,
    val busy: Boolean = false,
    val error: String? = null,
    val active: ActiveSession? = null,
    val weekly: WeeklyHours? = null,
    val overtime: Overtime? = null,
    val weekStart: LocalDate = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
    val week: List<DayData> = emptyList(),
)

class DashboardViewModel(private val repo: Repository) : ViewModel() {
    private val _state = MutableStateFlow(DashboardState())
    val state: StateFlow<DashboardState> = _state.asStateFlow()

    fun refresh() {
        viewModelScope.launch { load() }
    }

    fun start() = act { repo.startSession() }
    fun pause() = act { repo.pauseSession() }
    fun resume() = act { repo.resumeSession() }
    fun stop() = act { repo.stopSession() }

    private fun act(block: suspend () -> Unit) {
        if (_state.value.busy) return
        _state.update { it.copy(busy = true) }
        viewModelScope.launch {
            val failure = runCatching { block() }.exceptionOrNull()
            load()
            _state.update { st ->
                st.copy(busy = false, error = failure?.userMessage() ?: st.error)
            }
        }
    }

    private suspend fun load() {
        _state.update { it.copy(loading = true) }
        val monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val sunday = monday.plusDays(6)

        supervisorScope {
            val session = async { runCatching { repo.currentSession() } }
            val weekly = async { runCatching { repo.weeklyHours() } }
            val overtime = async { runCatching { repo.overtime() } }
            val range = async { runCatching { repo.range(monday, sunday) } }

            val s = session.await()
            val w = weekly.await()
            val o = overtime.await()
            val r = range.await()

            val failure = listOf<Result<Any?>>(s, w, o, r).firstNotNullOfOrNull { it.exceptionOrNull() }

            _state.update { st ->
                st.copy(
                    loading = false,
                    error = failure?.userMessage(),
                    // currentSession() peut légitimement valoir null (aucune session) : on ne
                    // conserve l'ancienne valeur qu'en cas d'échec réseau.
                    active = if (s.isSuccess) s.getOrNull() else st.active,
                    weekly = w.getOrNull() ?: st.weekly,
                    overtime = o.getOrNull() ?: st.overtime,
                    weekStart = monday,
                    week = r.getOrNull()?.days ?: st.week,
                )
            }
        }
    }
}
