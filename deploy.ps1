#requires -version 5
<#
.SYNOPSIS
  Pousse le code puis deploie back et/ou front sur l'Optiplex.

.DESCRIPTION
  git push (sauf -NoPush) -> ssh sur l'Optiplex -> git pull --ff-only -> bash
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
  Sans cle SSH : 1 mot de passe ssh + le mot de passe sudo sur l'Optiplex
  (mis en cache ~15 min, donc en general une seule fois).
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('all', 'back', 'front')]
    [string]$Target = 'all',

    [string]$OptiplexHost = 'kamicron_admin@192.168.1.51',
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not $NoPush) {
    Write-Host "== git push ==" -ForegroundColor Cyan
    & git push
    if ($LASTEXITCODE -ne 0) { Write-Host "git push a echoue" -ForegroundColor Red; exit 1 }
}

Write-Host "== Deploiement '$Target' sur $OptiplexHost ==" -ForegroundColor Cyan
& ssh -t $OptiplexHost "cd /opt/apihour2 && git pull --ff-only && bash deploy.sh $Target"
$rc = $LASTEXITCODE

Write-Host ""
if ($rc -eq 0) {
    Write-Host "Deploiement OK." -ForegroundColor Green
} else {
    Write-Host "Deploiement KO (code $rc)." -ForegroundColor Red
}
exit $rc
