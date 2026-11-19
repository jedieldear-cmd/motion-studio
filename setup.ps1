# Motion Studio — instalação em uma máquina Windows nova.
# Uso (PowerShell, na pasta do projeto):
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
# Idempotente: pode rodar de novo sem problema.

$ErrorActionPreference = 'Stop'
function Update-SessionPath {
	$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Install-IfMissing($cmd, $wingetId, $extra = @()) {
	if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
		Write-Host "Instalando $wingetId..." -ForegroundColor Cyan
		winget install --id $wingetId -e --accept-source-agreements --accept-package-agreements --silent @extra
		Update-SessionPath
	} else { Write-Host "OK: $cmd" -ForegroundColor Green }
}

Update-SessionPath
Install-IfMissing node 'OpenJS.NodeJS.LTS'
Install-IfMissing ffmpeg 'Gyan.FFmpeg'
Install-IfMissing git 'Git.Git'
Install-IfMissing gh 'GitHub.cli'

# Python (para Piper e as skills ig-*)
$py = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe"
if (-not (Test-Path $py)) {
	winget install --id Python.Python.3.13 -e --scope user --accept-source-agreements --accept-package-agreements --silent
}

# Dependências do projeto + navegador headless do Remotion
npm install
npx remotion browser ensure

# Skills oficiais do Remotion (recria os links em .claude/skills)
npx -y remotion skills add

# Caminhos longos no Windows: cópia curta do Chrome headless e do compositor
$short = Join-Path $HOME '.remotion-browser'
New-Item -ItemType Directory -Force $short | Out-Null
$chrome = Get-ChildItem -Recurse -Filter chrome-headless-shell.exe 'node_modules\.remotion' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($chrome) { Copy-Item -Recurse -Force "$($chrome.DirectoryName)\*" $short }
$comp = Get-ChildItem 'node_modules\@remotion' -Directory -Filter 'compositor-win32-*' | Select-Object -First 1
if ($comp) { New-Item -ItemType Directory -Force "$short\compositor" | Out-Null; Copy-Item -Recurse -Force "$($comp.FullName)\*" "$short\compositor" }

# Piper (voz local pt-BR)
$venv = Join-Path $HOME '.mstools\piper-venv'
if (-not (Test-Path "$venv\Scripts\python.exe")) { & $py -m venv $venv }
& "$venv\Scripts\python.exe" -m pip install --quiet --disable-pip-version-check piper-tts
$voices = Join-Path $HOME '.mstools\piper-voices'
if (-not (Test-Path "$voices\pt_BR-faber-medium.onnx")) {
	& "$venv\Scripts\python.exe" -m piper.download_voices --data-dir $voices pt_BR-faber-medium
}

npx tsc --noEmit
Write-Host "`nPronto! Rode: npm run studio" -ForegroundColor Green
