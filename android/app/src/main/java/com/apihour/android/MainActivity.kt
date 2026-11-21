package com.apihour.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.apihour.android.ui.calendar.CalendarScreen
import com.apihour.android.ui.calendar.CalendarViewModel
import com.apihour.android.ui.dashboard.DashboardScreen
import com.apihour.android.ui.dashboard.DashboardViewModel
import com.apihour.android.ui.login.LoginScreen
import com.apihour.android.ui.login.LoginViewModel
import com.apihour.android.ui.settings.SettingsScreen
import com.apihour.android.ui.theme.ApiHourTheme
import com.apihour.android.ui.vmFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as ApiHourApplication).container
        setContent {
            ApiHourTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Root(container)
                }
            }
        }
    }
}

@Composable
private fun Root(container: AppContainer) {
    val repo = container.repository
    val loggedIn by repo.isLoggedIn.collectAsStateWithLifecycle(initialValue = null)

    when (loggedIn) {
        null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        false -> {
            val vm: LoginViewModel = viewModel(factory = vmFactory { LoginViewModel(repo) })
            LoginScreen(vm)
        }
        true -> MainScaffold(container)
    }
}

private enum class Tab(val label: String, val icon: ImageVector) {
    Dashboard("Tableau de bord", Icons.Default.Home),
    Calendar("Calendrier", Icons.Default.DateRange),
    Settings("Paramètres", Icons.Default.Settings),
}

@Composable
private fun MainScaffold(container: AppContainer) {
    val repo = container.repository
    var tab by rememberSaveable { mutableIntStateOf(0) }

    // Les ViewModels sont rattachés à l'activité : leur état survit aux changements d'onglet.
    val dashboardVm: DashboardViewModel = viewModel(factory = vmFactory { DashboardViewModel(repo) })
    val calendarVm: CalendarViewModel = viewModel(factory = vmFactory { CalendarViewModel(repo) })

    Scaffold(
        bottomBar = {
            NavigationBar {
                Tab.entries.forEachIndexed { index, t ->
                    NavigationBarItem(
                        selected = tab == index,
                        onClick = { tab = index },
                        icon = { Icon(t.icon, contentDescription = t.label) },
                        label = { Text(t.label, maxLines = 1) },
                    )
                }
            }
        },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (Tab.entries[tab]) {
                Tab.Dashboard -> DashboardScreen(dashboardVm, repo)
                Tab.Calendar -> CalendarScreen(calendarVm)
                Tab.Settings -> SettingsScreen(repo)
            }
        }
    }
}
