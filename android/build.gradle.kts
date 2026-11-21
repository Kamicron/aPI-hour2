// AGP 9 embarque Kotlin (KGP 2.2.10 par défaut). On force KGP 2.3.21 pour
// rester aligné avec les plugins Compose / Serialization.
buildscript {
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin") {
            version { strictly("2.3.21") }
        }
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
