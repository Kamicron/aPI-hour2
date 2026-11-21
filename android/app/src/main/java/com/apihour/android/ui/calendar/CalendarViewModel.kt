package com.apihour.android.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apihour.android.data.DayData
import com.apihour.android.data.MonthStats
import com.apihour.android.data.Repository
import com.apihour.android.data.userMessage
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth

data class CalendarState(
    val month: YearMonth = YearMonth.now(),
    val loading: Boolean = true,
    val error: String? = null,
    val days: Map<String, DayData> = emptyMap(),
    val stats: MonthStats = MonthStats(),
    val selected: LocalDate? = null,
)

class CalendarViewModel(private val repo: Repository) : ViewModel() {
    private val _state = MutableStateFlow(CalendarState())
    val state: StateFlow<CalendarState> = _state.asStateFlow()

    private var job: Job? = null

    init {
        load(_state.value.month)
    }

    fun previousMonth() = load(_state.value.month.minusMonths(1))
    fun nextMonth() = load(_state.value.month.plusMonths(1))
    fun reload() = load(_state.value.month)
    fun select(date: LocalDate?) = _state.update { it.copy(selected = date) }

    private fun load(month: YearMonth) {
        job?.cancel()
        _state.update { it.copy(month = month, loading = true, error = null, selected = null) }
        job = viewModelScope.launch {
            runCatching { repo.calendar(month.year, month.monthValue) }
                .onSuccess { res ->
                    _state.update {
                        it.copy(loading = false, days = res.days.associateBy { d -> d.date }, stats = res.monthStats)
                    }
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, days = emptyMap(), error = e.userMessage()) }
                }
        }
    }
}
