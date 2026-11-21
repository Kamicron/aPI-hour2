# kotlinx.serialization : conserver les serializers générés
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class com.apihour.android.data.** {
    *** Companion;
}
-keepclasseswithmembers class com.apihour.android.data.** {
    kotlinx.serialization.KSerializer serializer(...);
}
