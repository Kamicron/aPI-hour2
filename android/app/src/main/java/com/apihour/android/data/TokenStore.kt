package com.apihour.android.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.authStore by preferencesDataStore(name = "auth")

class TokenStore(private val context: Context) {
    private object Keys {
        val access = stringPreferencesKey("access_token")
        val refresh = stringPreferencesKey("refresh_token")
        val email = stringPreferencesKey("email")
    }

    private val data: Flow<Preferences> get() = context.authStore.data

    val accessFlow: Flow<String?> get() = data.map { it[Keys.access] }
    val emailFlow: Flow<String?> get() = data.map { it[Keys.email] }

    suspend fun access(): String? = accessFlow.first()
    suspend fun refresh(): String? = data.map { it[Keys.refresh] }.first()

    suspend fun save(access: String, refresh: String, email: String? = null) {
        context.authStore.edit {
            it[Keys.access] = access
            it[Keys.refresh] = refresh
            if (email != null) it[Keys.email] = email
        }
    }

    suspend fun clear() {
        context.authStore.edit { it.clear() }
    }
}
