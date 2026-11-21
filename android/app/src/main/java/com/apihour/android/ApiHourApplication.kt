package com.apihour.android

import android.app.Application
import com.apihour.android.data.Network
import com.apihour.android.data.Repository
import com.apihour.android.data.TokenStore

class AppContainer(app: Application) {
    private val tokens = TokenStore(app)
    val repository = Repository(Network.create(BuildConfig.API_BASE_URL, tokens), tokens)
}

class ApiHourApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
