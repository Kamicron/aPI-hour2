package com.apihour.android.data

import kotlinx.coroutines.runBlocking
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import java.io.IOException
import java.util.concurrent.TimeUnit

interface ApiHourApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @GET("session/current")
    suspend fun currentSession(): SessionResponse

    @POST("session/start")
    suspend fun startSession(): SessionResponse

    @POST("session/pause")
    suspend fun pauseSession(): SessionResponse

    @POST("session/resume")
    suspend fun resumeSession(): SessionResponse

    @POST("session/stop")
    suspend fun stopSession(): MessageResponse

    @GET("stats/weekly-hours")
    suspend fun weeklyHours(): WeeklyHours

    @GET("stats/overtime")
    suspend fun overtime(): Overtime

    @GET("stats/range")
    suspend fun range(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String,
    ): PeriodResponse

    @GET("stats/calendar/{year}/{month}")
    suspend fun calendar(
        @Path("year") year: Int,
        @Path("month") month: Int,
    ): PeriodResponse
}

object Network {
    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
    }

    fun create(baseUrl: String, tokens: TokenStore): ApiHourApi {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .addInterceptor(AuthInterceptor(baseUrl, tokens, OkHttpClient(), json))
            .build()

        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(ApiHourApi::class.java)
    }
}

/**
 * Ajoute le Bearer token et, sur 401/403 (le backend Spring renvoie 403 quand le JWT
 * est expiré), tente un refresh puis rejoue la requête une fois.
 * Si le refresh token est refusé, la session locale est effacée (retour à l'écran de connexion).
 */
private class AuthInterceptor(
    private val baseUrl: String,
    private val tokens: TokenStore,
    private val plainClient: OkHttpClient,
    private val json: Json,
) : Interceptor {
    private val lock = Any()

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.url.encodedPath.contains("/auth/")) return chain.proceed(request)

        val used = runBlocking { tokens.access() }
        val response = chain.proceed(request.withToken(used))
        if (used == null || (response.code != 401 && response.code != 403)) return response

        val fresh = synchronized(lock) {
            val current = runBlocking { tokens.access() }
            // Un autre appel a peut-être déjà rafraîchi le token entre-temps.
            if (current != null && current != used) current else refresh()
        } ?: return response

        response.close()
        return chain.proceed(request.withToken(fresh))
    }

    private fun Request.withToken(token: String?): Request =
        if (token == null) this else newBuilder().header("Authorization", "Bearer $token").build()

    private fun refresh(): String? {
        val refreshToken = runBlocking { tokens.refresh() } ?: return null
        val body = json.encodeToString(RefreshRequest(refreshToken))
            .toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url(baseUrl + "auth/refresh-token").post(body).build()
        return try {
            plainClient.newCall(request).execute().use { r ->
                if (r.isSuccessful) {
                    val auth = json.decodeFromString<AuthResponse>(r.body.string())
                    runBlocking { tokens.save(auth.token, auth.refreshToken) }
                    auth.token
                } else {
                    if (r.code in 400..403) runBlocking { tokens.clear() }
                    null
                }
            }
        } catch (_: IOException) {
            null // réseau coupé : on ne déconnecte pas l'utilisateur
        }
    }
}
