package com.apihour.android.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import retrofit2.HttpException
import java.io.IOException
import java.time.LocalDate

class Repository(
    private val api: ApiHourApi,
    private val tokens: TokenStore,
) {
    val isLoggedIn: Flow<Boolean> = tokens.accessFlow.map { it != null }.distinctUntilChanged()
    val email: Flow<String?> = tokens.emailFlow

    suspend fun login(email: String, password: String) {
        val clean = email.trim()
        val auth = api.login(LoginRequest(clean, password))
        tokens.save(auth.token, auth.refreshToken, clean)
    }

    suspend fun logout() = tokens.clear()

    suspend fun currentSession(): ActiveSession? = api.currentSession().toActive()
    suspend fun startSession(): ActiveSession? = api.startSession().toActive()
    suspend fun pauseSession(): ActiveSession? = api.pauseSession().toActive()
    suspend fun resumeSession(): ActiveSession? = api.resumeSession().toActive()
    suspend fun stopSession() {
        api.stopSession()
    }

    suspend fun weeklyHours(): WeeklyHours = api.weeklyHours()
    suspend fun overtime(): Overtime = api.overtime()
    suspend fun range(start: LocalDate, end: LocalDate): PeriodResponse =
        api.range(start.toString(), end.toString())

    suspend fun calendar(year: Int, month: Int): PeriodResponse = api.calendar(year, month)
}

/** Message lisible en français pour une erreur réseau/HTTP. */
fun Throwable.userMessage(): String = when (this) {
    is HttpException -> when (code()) {
        401 -> "Email ou mot de passe incorrect."
        403 -> {
            val body = runCatching { response()?.errorBody()?.string() }.getOrNull().orEmpty()
            if ("EMAIL_NOT_VERIFIED" in body) {
                "Adresse email non vérifiée : clique sur le lien reçu par email."
            } else {
                "Accès refusé."
            }
        }
        in 500..599 -> "Le serveur rencontre un problème. Réessaie dans un instant."
        else -> "Erreur ${code()}."
    }
    is IOException -> "Impossible de joindre le serveur. Vérifie ta connexion."
    else -> message ?: "Erreur inconnue."
}
