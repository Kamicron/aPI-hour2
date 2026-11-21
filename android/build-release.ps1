<#
  Construit l'application API Hour pour la Play Console.

  Usage (PowerShell, depuis le dossier android/) :
      .\build-release.ps1          -> genere dist\api-hour-release.aab (a envoyer sur la Play Console)
      .\build-release.ps1 -Apk     -> genere aussi dist\api-hour-release.apk (installable sur ton telephone)

  Au premier lancement, le script cree la cle de signature (apihour-release.jks)
  et keystore.properties. SAUVEGARDE ces deux fichiers ailleurs (cle USB, gestionnaire
  de mots de passe) : sans eux, tu ne pourras plus mettre l'app a jour avec la meme cle.
  Ils sont ignores par git.

  Si l'execution est bloquee :
      powershell -ExecutionPolicy Bypass -File .\build-release.ps1
#>
param(
    [switch]$Apk
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Fail($msg) { Write-Host "ERREUR : $msg" -ForegroundColor Red; exit 1 }
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# ---------- 1. Java (JDK d'Android Studio de preference) ----------
Step "Recherche de Java"
$jdkCandidates = @(
    $env:JAVA_HOME,
    "$env:ProgramFiles\Android\Android Studio\jbr",
    "${env:ProgramFiles(x86)}\Android\Android Studio\jbr",
    "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
)
$jdkCandidates += @(Get-ChildItem "$env:USERPROFILE\.jdks" -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })

$javaHome = $jdkCandidates | Where-Object { $_ -and (Test-Path (Join-Path $_ 'bin\keytool.exe')) } | Select-Object -First 1
if (-not $javaHome) { Fail "JDK introuvable. Installe Android Studio ou definis JAVA_HOME." }
$env:JAVA_HOME = $javaHome
$keytool = Join-Path $javaHome 'bin\keytool.exe'
Write-Host "JDK : $javaHome"

# ---------- 2. SDK Android ----------
Step "Recherche du SDK Android"
if (-not (Test-Path 'local.properties')) {
    $sdk = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk") |
        Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
    if (-not $sdk) { Fail "SDK Android introuvable. Ouvre le projet une fois dans Android Studio." }
    $sdkEscaped = $sdk -replace '\\', '\\'
    Set-Content -Path 'local.properties' -Value "sdk.dir=$sdkEscaped" -Encoding ASCII
    Write-Host "local.properties cree ($sdk)"
} else {
    Write-Host "local.properties deja present"
}

# ---------- 3. Cle de signature ----------
if (-not (Test-Path 'keystore.properties')) {
    Step "Creation de la cle de signature (une seule fois)"
    Write-Host "Choisis un mot de passe solide et NOTE-LE : il protege ta cle de publication."
    $p1 = Read-Host "Mot de passe de la cle" -AsSecureString
    $p2 = Read-Host "Confirme le mot de passe" -AsSecureString
    $plain1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p1))
    $plain2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p2))
    if ($plain1 -ne $plain2) { Fail "Les mots de passe ne correspondent pas." }
    if ($plain1.Length -lt 8) { Fail "Mot de passe trop court (8 caracteres minimum)." }

    $jks = 'apihour-release.jks'
    if (Test-Path $jks) { Fail "$jks existe deja sans keystore.properties. Deplace-le ou recree keystore.properties a la main." }

    & $keytool -genkeypair -v -keystore $jks -alias apihour -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $plain1 -keypass $plain1 -dname "CN=API Hour, O=API Hour, C=FR"
    if ($LASTEXITCODE -ne 0) { Fail "keytool a echoue." }

    @(
        "storeFile=$jks",
        "storePassword=$plain1",
        "keyAlias=apihour",
        "keyPassword=$plain1"
    ) | Set-Content -Path 'keystore.properties' -Encoding ASCII

    Write-Host "`nCle creee : apihour-release.jks + keystore.properties" -ForegroundColor Yellow
    Write-Host "SAUVEGARDE-LES MAINTENANT hors de ce PC." -ForegroundColor Yellow
} else {
    Write-Host "`nCle de signature deja presente (keystore.properties)"
}

# ---------- 4. Build ----------
$tasks = @('bundleRelease')
if ($Apk) { $tasks += 'assembleRelease' }

Step ("Compilation : " + ($tasks -join ', ') + " (la premiere fois, Gradle telecharge beaucoup de choses)")
& .\gradlew.bat @tasks
if ($LASTEXITCODE -ne 0) { Fail "La compilation a echoue. Copie les erreurs ci-dessus pour les faire corriger." }

# ---------- 5. Resultat ----------
Step "Copie des fichiers"
New-Item -ItemType Directory -Force -Path 'dist' | Out-Null

$aab = 'app\build\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aab)) { Fail "AAB introuvable : $aab" }
Copy-Item $aab 'dist\api-hour-release.aab' -Force

if ($Apk) {
    $apk = 'app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path $apk)) { Fail "APK introuvable : $apk" }
    Copy-Item $apk 'dist\api-hour-release.apk' -Force
}

Write-Host "`nTermine. Fichiers dans : $PWD\dist" -ForegroundColor Green
Write-Host " - api-hour-release.aab  -> a envoyer sur la Play Console (Production / Test)"
if ($Apk) { Write-Host " - api-hour-release.apk  -> installable directement sur ton telephone" }
Start-Process explorer.exe (Join-Path $PWD 'dist')
