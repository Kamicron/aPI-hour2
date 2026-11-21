<#
  Construit l'application API Hour pour la Play Console.

  Usage (PowerShell, depuis le dossier android/) :
      .\build-release.ps1          -> genere dist\api-hour-release.aab (a envoyer sur la Play Console)
      .\build-release.ps1 -Apk     -> genere aussi dist\api-hour-release.apk (installable sur ton telephone)

  Les cles de signature sont rangees HORS du depot, dans -KeystoreDir
  (par defaut : Documents\Ludovic\Keystore). Au premier lancement, le script :
    - te propose de reutiliser une cle deja presente dans ce dossier, ou
    - en cree une nouvelle (apihour-release.jks) dans ce dossier,
  puis ecrit android\keystore.properties (ignore par git) qui pointe vers elle.

  SAUVEGARDE le .jks et son mot de passe : sans eux, impossible de mettre l'app a jour
  avec la meme cle.

  Si l'execution est bloquee :
      powershell -ExecutionPolicy Bypass -File .\build-release.ps1
#>
param(
    [switch]$Apk,
    [string]$KeystoreDir = (Join-Path $env:USERPROFILE 'Documents\Ludovic\Keystore')
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

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
if (Test-Path 'keystore.properties') {
    Write-Host "`nCle de signature deja configuree (keystore.properties)"
} else {
    Step "Configuration de la cle de signature (une seule fois)"
    New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null
    Write-Host "Dossier des cles : $KeystoreDir"

    # Reutiliser une cle existante ?
    $storeFile = $null
    $existing = @(Get-ChildItem -LiteralPath $KeystoreDir -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -in '.jks', '.keystore', '.p12', '.pfx' })
    if ($existing.Count -gt 0) {
        Write-Host "Cles trouvees :"
        for ($i = 0; $i -lt $existing.Count; $i++) { Write-Host ("  [{0}] {1}" -f ($i + 1), $existing[$i].Name) }
        $choice = Read-Host "Numero de la cle a reutiliser, ou Entree pour en creer une nouvelle pour API Hour"
        if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $existing.Count) {
            $storeFile = $existing[[int]$choice - 1].FullName
        }
    }

    if ($storeFile) {
        # --- Reutilisation d'une cle existante ---
        $storePass = Read-Plain "Mot de passe du keystore"
        Write-Host "`nAlias disponibles :"
        & $keytool -list -keystore $storeFile -storepass $storePass 2>&1 |
            Where-Object { $_ -match 'PrivateKeyEntry|trustedCertEntry' }
        $alias = Read-Host "Alias de la cle a utiliser"
        if (-not $alias) { Fail "Alias requis." }
        $keyPass = Read-Plain "Mot de passe de la cle (Entree = identique au keystore)"
        if (-not $keyPass) { $keyPass = $storePass }
    } else {
        # --- Creation d'une nouvelle cle ---
        $storeFile = Join-Path $KeystoreDir 'apihour-release.jks'
        if (Test-Path $storeFile) { Fail "$storeFile existe deja. Relance et choisis-le dans la liste." }
        Write-Host "Choisis un mot de passe solide et NOTE-LE."
        $storePass = Read-Plain "Mot de passe de la cle"
        $confirm = Read-Plain "Confirme le mot de passe"
        if ($storePass -ne $confirm) { Fail "Les mots de passe ne correspondent pas." }
        if ($storePass.Length -lt 8) { Fail "Mot de passe trop court (8 caracteres minimum)." }
        $alias = 'apihour'
        $keyPass = $storePass

        & $keytool -genkeypair -v -keystore $storeFile -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
            -storepass $storePass -keypass $keyPass -dname "CN=API Hour, O=API Hour, C=FR"
        if ($LASTEXITCODE -ne 0) { Fail "keytool a echoue." }
        Write-Host "`nCle creee : $storeFile" -ForegroundColor Yellow
        Write-Host "SAUVEGARDE-LA (avec son mot de passe) hors de ce PC." -ForegroundColor Yellow
    }

    $storePath = $storeFile -replace '\\', '/'
    @(
        "storeFile=$storePath",
        "storePassword=$storePass",
        "keyAlias=$alias",
        "keyPassword=$keyPass"
    ) | Set-Content -Path 'keystore.properties' -Encoding ASCII
    Write-Host "keystore.properties ecrit (ignore par git)."
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
