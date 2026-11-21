#requires -version 5
<#
.SYNOPSIS
  Pousse le code puis deploie back et/ou front sur le serveur (Optiplex).

.DESCRIPTION
  git push (sauf -NoPush) -> ssh sur le serveur -> git pull --ff-only -> bash
  deploy.sh <cible>. Le vrai travail est dans deploy.sh (versionne), ce
  script n'est que le declencheur depuis le PC.

.EXAMPLE
  .\deploy.ps1            # back + front
.EXAMPLE
  .\deploy.ps1 back       # backend seul (build + restart apihour2-back)
.EXAMPLE
  .\deploy.ps1 front      # front seul (build + copie dans /var/www/apihour2)
.EXAMPLE
  .\deploy.ps1 -NoPush    # ne push pas, deploie l'etat deja sur GitHub

.NOTES
  Sans cle SSH sur le compte : mot de passe ssh + mot de passe sudo sur le
  serveur (mis en cache ~15 min, donc en general une seule fois par session).
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('all', 'back', 'front')]
    [string]$Target = 'all',

    [string]$ServerHost = 'kamicron_admin@192.168.1.51',
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not $NoPush) {
    Write-Host "== git push ==" -ForegroundColor Cyan
    & git push
    if ($LASTEXITCODE -ne 0) { Write-Host "git push a echoue" -ForegroundColor Red; exit 1 }
}

Write-Host "== Deploiement '$Target' sur $ServerHost ==" -ForegroundColor Cyan
# Le run precedent laisse backend/ au compte du service : on reprend la main
# avant le pull, sinon git ne peut pas ecraser les fichiers suivis.
$remoteCmd = 'cd /opt/apihour2 && sudo chown -R "$(id -un):$(id -gn)" backend && git pull --ff-only && bash deploy.sh ' + $Target
& ssh -t $ServerHost $remoteCmd
$rc = $LASTEXITCODE

Write-Host ""
if ($rc -eq 0) {
    Write-Host "Deploiement OK." -ForegroundColor Green
} else {
    Write-Host "Deploiement KO (code $rc)." -ForegroundColor Red
}
exit $rc
