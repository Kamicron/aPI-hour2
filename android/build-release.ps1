<#
  Construit l'application API Hour pour la Play Console.

  Usage (PowerShell, depuis le dossier android/) :
      .\build-release.ps1          -> genere dist\api-hour-release.aab (a envoyer sur la Play Console)
      .\build-release.ps1 -Apk     -> genere aussi dist\api-hour-release.apk (installable sur ton telephone)

  Convention de stockage des cles (comme aPI-birthday), HORS du depot :
      Documents\Ludovic\Keystore\aPI-hour\apihour-release.jks
      Documents\Ludovic\Keystore\aPI-hour\keystore.properties.sauvegarde

  - Premier lancement : cree la cle + la sauvegarde dans ce dossier, puis ecrit
    android\keystore.properties (ignore par git).
  - Nouveau clone / nouveau PC : si keystore.properties manque mais que la sauvegarde
    existe, elle est restauree automatiquement.

  Sans le .jks et son mot de passe, impossible de mettre l'app a jour avec la meme cle :
  garde une copie du dossier aPI-hour ailleurs (cle USB...).

  Si l'execution est bloquee :
      powershell -ExecutionPolicy Bypass -File .\build-release.ps1
#>
param(
    [switch]$Apk,
    [string]$KeystoreRoot = (Join-Path $env:USERPROFILE 'Documents\Ludovic\Keystore'),
    [string]$ProjectFolder = 'aPI-hour'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$KeystoreDir = Join-Path $KeystoreRoot $ProjectFolder
$JksName = 'apihour-release.jks'
$BackupName = 'keystore.properties.sauvegarde'

function Fail($msg) { Write-Host "ERREUR : $msg" -ForegroundColor Red; exit 1 }
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Read-Plain($prompt) {
    $s = Read-Host $prompt -AsSecureString
    [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

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
$backupPath = Join-Path $KeystoreDir $BackupName
$jksPath = Join-Path $KeystoreDir $JksName

if (Test-Path 'keystore.properties') {
    Write-Host "`nCle de signature deja configuree (keystore.properties)"
}
elseif (Test-Path $backupPath) {
    Step "Restauration de keystore.properties depuis la sauvegarde"
    # Si storeFile n'est pas un chemin absolu, on le resout par rapport au dossier de la cle.
    $lines = Get-Content -LiteralPath $backupPath | ForEach-Object {
        if ($_ -match '^storeFile=(.+)$') {
            $v = $Matches[1].Trim()
            if (-not [System.IO.Path]::IsPathRooted($v)) {
                $v = ((Join-Path $KeystoreDir $v) -replace '\\', '/')
            }
            "storeFile=$v"
        } else { $_ }
    }
    $lines | Set-Content -Path 'keystore.properties' -Encoding ASCII
    Write-Host "Restaure depuis : $backupPath"
}
else {
    Step "Creation de la cle de signature (une seule fois)"
    if (Test-Path $jksPath) { Fail "$jksPath existe deja mais sans sauvegarde. Recree $BackupName a la main (storeFile, storePassword, keyAlias, keyPassword)." }
    New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null
    Write-Host "Dossier des cles : $KeystoreDir"
    Write-Host "Choisis un mot de passe solide et NOTE-LE."

    $storePass = Read-Plain "Mot de passe de la cle"
    $confirm = Read-Plain "Confirme le mot de passe"
    if ($storePass -ne $confirm) { Fail "Les mots de passe ne correspondent pas." }
    if ($storePass.Length -lt 8) { Fail "Mot de passe trop court (8 caracteres minimum)." }
    $alias = 'apihour'

    & $keytool -genkeypair -v -keystore $jksPath -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $storePass -keypass $storePass -dname "CN=API Hour, O=API Hour, C=FR"
    if ($LASTEXITCODE -ne 0) { Fail "keytool a echoue." }

    @(
        "storeFile=$($jksPath -replace '\\', '/')",
        "storePassword=$storePass",
        "keyAlias=$alias",
        "keyPassword=$storePass"
    ) | Set-Content -Path 'keystore.properties' -Encoding ASCII
    Copy-Item 'keystore.properties' $backupPath -Force

    Write-Host "`nCle creee : $jksPath" -ForegroundColor Yellow
    Write-Host "Sauvegarde : $backupPath" -ForegroundColor Yellow
    Write-Host "Copie le dossier $KeystoreDir hors de ce PC (cle USB...)." -ForegroundColor Yellow
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
