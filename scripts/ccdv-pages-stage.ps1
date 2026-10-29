<#
.SYNOPSIS
  CCDV Pages release STAGE (GF09-D). Local only: no GitHub mutation, no network.

.DESCRIPTION
  Turns an approved local commit plus its existing build/client output into an
  isolated distribution tree:

    <StageRoot>\<sha>\
      site\                         compiled site (build/client) + 404.html
        release.json                release identity (source SHA, manifest SHA256)
        release-manifest.sha256     sha256sum-format inventory of site\ files
      .github\workflows\ccdv-pages.yml
      README.md

  The inventory covers every file in site\ except release.json and
  release-manifest.sha256, so no file has to hash itself. release.json records
  the SHA256 of the manifest file.

  It does NOT run npm or the build. The OPERATOR builds first, commits, then
  runs this script. Fails closed: any failed check aborts with exit 1 and no
  receipt of success.

  Entrypoint (OPERATOR, from the repo root):
    pwsh -File scripts\ccdv-pages-stage.ps1 -ExpectedSha <40-hex> [-AllowTaskClaudeMd]

.PARAMETER ExpectedSha
  Approved source commit. HEAD must equal it.
.PARAMETER StageRoot
  Where distribution trees and receipts go. Default: a sibling of the repo
  (..\ccdv-pages-dist). Must be outside the repo working tree.
.PARAMETER AllowTaskClaudeMd
  Tolerate the task-generated CLAUDE.md modification (only valid before
  lifecycle closure). Any other change refuses.
.PARAMETER Replace
  Delete and rebuild an existing <StageRoot>\<sha> tree. Without it, an
  existing tree refuses.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidatePattern('(?-i)^[0-9a-f]{40}$')][string]$ExpectedSha,
  [string]$StageRoot,
  [switch]$AllowTaskClaudeMd,
  [switch]$Replace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path.TrimEnd('\')
if (-not $StageRoot) { $StageRoot = Join-Path (Split-Path $RepoRoot -Parent) 'ccdv-pages-dist' }
$StageRoot = [System.IO.Path]::GetFullPath($StageRoot).TrimEnd('\')

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Checks = New-Object System.Collections.Generic.List[object]

function Step([string]$Name, [string]$Detail) {
  $Checks.Add([pscustomobject]@{ check = $Name; result = 'PASS'; detail = $Detail })
  Write-Host ("  [PASS] {0}  {1}" -f $Name, $Detail)
}
function Fail([string]$Message) {
  Write-Host ("  [FAIL] {0}" -f $Message) -ForegroundColor Red
  Write-Host "STAGE REFUSED. Nothing was published; fix the cause and rerun." -ForegroundColor Red
  exit 1
}
function Invoke-Native {
  param([Parameter(Mandatory)][string]$File, [string[]]$Arguments = @())
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { $out = & $File @Arguments 2>&1 } finally { $ErrorActionPreference = $prev }
  $code = $LASTEXITCODE
  $text = (($out | ForEach-Object { "$_" }) -join "`n").TrimEnd()
  if ($code -ne 0) { throw "$File $($Arguments -join ' ') failed (exit $code): $text" }
  return $text
}
# Not named "Git": a function of that name would shadow git.exe inside Invoke-Native (& 'git').
function Invoke-Git { param([string[]]$Arguments) return Invoke-Native -File 'git' -Arguments (@('-C', $RepoRoot) + $Arguments) }

function Get-Inventory([string]$SiteDir, [string[]]$Exclude) {
  $base = (Resolve-Path -LiteralPath $SiteDir).Path.TrimEnd('\')
  $map = @{}
  foreach ($f in Get-ChildItem -LiteralPath $base -Recurse -File -Force) {
    if ($f.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw "reparse point/symlink in site: $($f.FullName)" }
    $rel = $f.FullName.Substring($base.Length + 1).Replace('\', '/')
    if ($Exclude -contains $rel) { continue }
    $map[$rel] = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  $keys = [string[]]@($map.Keys)
  [Array]::Sort($keys, [System.StringComparer]::Ordinal)
  $lines = foreach ($k in $keys) { "{0}  {1}" -f $map[$k], $k }
  return [pscustomobject]@{ Count = $keys.Count; Text = (($lines -join "`n") + "`n") }
}

Write-Host "CCDV Pages STAGE  repo=$RepoRoot"
Write-Host "                  stageRoot=$StageRoot"

# ---- preflight: repository ------------------------------------------------
try {
  $top = (Invoke-Git @('rev-parse', '--show-toplevel')).Replace('/', '\')
  if ([System.IO.Path]::GetFullPath($top).TrimEnd('\') -ne $RepoRoot) { Fail "git toplevel '$top' is not the script's repo '$RepoRoot'" }
  $head = Invoke-Git @('rev-parse', 'HEAD')
  if ($head -cne $ExpectedSha) { Fail "HEAD $head does not equal -ExpectedSha $ExpectedSha" }
  Step 'head' $head
  $branch = Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')
  if ($branch -ne 'main') { Fail "branch is '$branch', expected 'main'" }
  Step 'branch' $branch

  $gitDir = (Invoke-Git @('rev-parse', '--absolute-git-dir')).Replace('/', '\')
  foreach ($marker in 'MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD', 'REVERT_HEAD') {
    if (Test-Path -LiteralPath (Join-Path $gitDir $marker)) { Fail "repository is mid-operation ($marker)" }
  }
  Step 'no-inflight-op' 'no merge/rebase/cherry-pick/revert'

  $statusRaw = Invoke-Git @('status', '--porcelain=v1', '--untracked-files=all')
  $unexpected = @()
  foreach ($line in ($statusRaw -split "`n")) {
    if (-not $line.Trim()) { continue }
    $isClaudeMd = ($line -eq ' M CLAUDE.md') -or ($line -eq 'M  CLAUDE.md')
    if ($isClaudeMd -and $AllowTaskClaudeMd) { continue }
    $unexpected += $line
  }
  if ($unexpected.Count -gt 0) { Fail ("unexpected Git changes:`n    " + ($unexpected -join "`n    ")) }
  Step 'worktree' $(if ($AllowTaskClaudeMd) { 'clean (task CLAUDE.md change tolerated)' } else { 'clean' })

  foreach ($p in 'scripts/ccdv-pages-stage.ps1', 'scripts/ccdv-pages-publish.ps1', 'scripts/ccdv-pages-verify.ps1', '.github/workflows/ccdv-pages.yml', 'app/root.tsx') {
    $null = Invoke-Git @('cat-file', '-e', "HEAD:$p")
  }
  Step 'release-files-committed' 'scripts, workflow and app/root.tsx exist in HEAD'
} catch { Fail $_.Exception.Message }

# ---- preflight: build output ----------------------------------------------
$Build = Join-Path $RepoRoot 'build\client'
$BuildIndex = Join-Path $Build 'index.html'
if (-not (Test-Path -LiteralPath $BuildIndex)) { Fail "missing $BuildIndex - run the production build first" }

# Staleness guard (heuristic): build must be newer than every tracked input.
$inputs = @((Invoke-Git @('-c', 'core.quotepath=false', 'ls-files', 'app', 'package.json', 'package-lock.json', 'vite.config.ts', 'react-router.config.ts', 'tsconfig.json')) -split "`n" | Where-Object { $_ })
if ($inputs.Count -eq 0) { Fail 'no tracked source inputs found for the staleness check' }
$newestInput = $inputs | ForEach-Object { (Get-Item -LiteralPath (Join-Path $RepoRoot $_)).LastWriteTimeUtc } | Sort-Object -Descending | Select-Object -First 1
$buildTime = (Get-Item -LiteralPath $BuildIndex).LastWriteTimeUtc
if ($buildTime -lt $newestInput) { Fail "build/client/index.html ($buildTime UTC) is older than newest source input ($newestInput UTC) - rebuild" }
Step 'build-fresh' "index.html $($buildTime.ToString('o')) >= newest input $($newestInput.ToString('o'))"

$allowedExt = @('.html', '.js', '.css', '.woff2', '.woff', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.json', '.txt')
$denySegment = '^(\.claude|_wrkops|work_assets|reference_material|node_modules|\.git|\.react-router|\.env.*|.*\.map|.*\.pem|.*\.key|.*\.ps1|.*\.py)$'
foreach ($d in Get-ChildItem -LiteralPath $Build -Recurse -Directory -Force) {
  if ($d.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { Fail "reparse point/symlink directory in build output: $($d.FullName)" }
}
foreach ($f in Get-ChildItem -LiteralPath $Build -Recurse -File -Force) {
  if ($f.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { Fail "reparse point/symlink file in build output: $($f.FullName)" }
  $rel = $f.FullName.Substring($Build.Length + 1)
  if ($allowedExt -notcontains $f.Extension.ToLowerInvariant()) { Fail "build file with non-allowed type: $rel" }
  foreach ($seg in $rel.Split('\')) { if ($seg -match $denySegment) { Fail "build path hits deny list: $rel" } }
}
Step 'build-file-types' 'only allowed static types, no deny-listed names'

$indexHtml = [System.IO.File]::ReadAllText($BuildIndex)
$preloads = @([regex]::Matches($indexHtml, 'href="([^"]+)"') | ForEach-Object { $_.Groups[1].Value })
$bad = @($preloads | Where-Object { $_ -notmatch '^/assets/' })
if ($preloads.Count -eq 0 -or $bad.Count -gt 0) { Fail "index.html href values are not all root-absolute /assets/ paths (base path changed?): $($bad -join ', ')" }
Step 'base-path' 'root base "/" (valid for the domain root only)'

$allAssets = Get-ChildItem -LiteralPath (Join-Path $Build 'assets') -File
$css = @($allAssets | Where-Object { $_.Name -like '*.css' })
$js = @($allAssets | Where-Object { $_.Name -like '*.js' })
if (-not ($css | Select-String -SimpleMatch -Pattern '.mobile-notice' -List)) { Fail 'built CSS lacks .mobile-notice - build predates GF09-D' }
foreach ($needle in 'we are working on the responsive', 'check on desktop!') {
  if (-not ($js | Select-String -SimpleMatch -Pattern $needle -List)) { Fail "built JS lacks notice copy fragment '$needle'" }
}
Step 'notice-in-build' 'CSS rule and exact copy present in compiled output'

# ---- stage ----------------------------------------------------------------
if ($StageRoot.StartsWith($RepoRoot + '\', [System.StringComparison]::OrdinalIgnoreCase) -or $StageRoot -eq $RepoRoot) { Fail 'StageRoot must be outside the repository tree' }
$Release = Join-Path $StageRoot $ExpectedSha
$receiptPath = Join-Path $StageRoot "receipts\stage-$ExpectedSha.json"
# A leftover receipt must never outlive the tree it described: restage clears both.
if ((Test-Path -LiteralPath $Release) -or (Test-Path -LiteralPath $receiptPath)) {
  if (-not $Replace) { Fail "$Release or its stage receipt already exists (use -Replace to rebuild)" }
  if ((Split-Path $Release -Parent) -ne $StageRoot -or (Split-Path $Release -Leaf) -cne $ExpectedSha) { Fail 'refusing to delete unexpected path' }
  if (Test-Path -LiteralPath $Release) { Remove-Item -LiteralPath $Release -Recurse -Force }
  if (Test-Path -LiteralPath $receiptPath) { Remove-Item -LiteralPath $receiptPath -Force }
}
$Site = Join-Path $Release 'site'
$null = New-Item -ItemType Directory -Path $Site -Force
$null = New-Item -ItemType Directory -Path (Join-Path $Release '.github\workflows') -Force
$null = New-Item -ItemType Directory -Path (Join-Path $StageRoot 'receipts') -Force

Copy-Item -Path (Join-Path $Build '*') -Destination $Site -Recurse -Force
# ssr:false build has no per-route HTML; GitHub Pages serves 404.html for unknown paths,
# so the app shell as 404.html makes deep links hard-refresh into the SPA.
Copy-Item -LiteralPath (Join-Path $Site 'index.html') -Destination (Join-Path $Site '404.html') -Force
Copy-Item -LiteralPath (Join-Path $RepoRoot '.github\workflows\ccdv-pages.yml') -Destination (Join-Path $Release '.github\workflows\ccdv-pages.yml') -Force

$readme = "# CCDV - distribution`n`nDistribution-only repository: compiled site and its Pages workflow.`nNo application source lives here. Releases are deployed manually via the`nccdv-pages workflow; each release records its source commit in site/release.json.`n"
[System.IO.File]::WriteAllText((Join-Path $Release 'README.md'), $readme, $Utf8NoBom)
Step 'copied' "site + 404.html + workflow + README under $Release"

# ---- private/internal exposure check --------------------------------------
foreach ($f in Get-ChildItem -LiteralPath $Release -Recurse -File -Force) {
  $rel = $f.FullName.Substring($Release.Length + 1)
  foreach ($seg in $rel.Split('\')) { if ($seg -match $denySegment) { Fail "distribution path hits deny list: $rel" } }
}
$textExt = @('.html', '.js', '.css', '.json', '.txt', '.svg')
$secretPatterns = @('_wrkops', '\.claude', 'work_assets', 'reference_material', 'C:\\\\?Users', '/Users/', 'BEGIN [A-Z ]*PRIVATE KEY', 'ghp_[A-Za-z0-9]{20,}', 'github_pat_[A-Za-z0-9_]{20,}', 'AKIA[0-9A-Z]{16}')
foreach ($f in Get-ChildItem -LiteralPath $Site -Recurse -File -Force) {
  if ($textExt -notcontains $f.Extension.ToLowerInvariant()) { continue }
  $hit = Select-String -LiteralPath $f.FullName -Pattern $secretPatterns -CaseSensitive -List
  if ($hit) { Fail "private/internal marker '$($hit.Pattern)' in $($f.Name)" }
}
Step 'exposure-scan' 'no private paths, user paths or credential markers in the distribution'

# ---- inventory + release identity -----------------------------------------
$meta = @('release.json', 'release-manifest.sha256')
$inv = Get-Inventory -SiteDir $Site -Exclude $meta
$manifestPath = Join-Path $Site 'release-manifest.sha256'
[System.IO.File]::WriteAllText($manifestPath, $inv.Text, $Utf8NoBom)
$manifestSha = (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
$commitTime = Invoke-Git @('show', '-s', '--format=%cI', 'HEAD')
$releaseObj = [ordered]@{
  schema = 1
  project = 'ccdv'
  sourceCommit = $ExpectedSha
  sourceBranch = 'main'
  sourceCommitTime = $commitTime
  stagedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  manifestAlgorithm = 'sha256'
  manifestFile = 'release-manifest.sha256'
  manifestSha256 = $manifestSha
  manifestFileCount = $inv.Count
  hosting = 'domain-root only (assets are root-absolute)'
  spaFallback = '404.html is a byte copy of index.html'
}
[System.IO.File]::WriteAllText((Join-Path $Site 'release.json'), (($releaseObj | ConvertTo-Json) + "`n"), $Utf8NoBom)
Step 'inventory' "$($inv.Count) files, manifest sha256 $manifestSha"

# ---- distribution allowlist ------------------------------------------------
$top = @(Get-ChildItem -LiteralPath $Release -Force | ForEach-Object { $_.Name })
foreach ($t in $top) { if (@('site', '.github', 'README.md') -notcontains $t) { Fail "unexpected top-level entry in distribution: $t" } }
$gh = @(Get-ChildItem -LiteralPath (Join-Path $Release '.github') -Recurse -File | ForEach-Object { $_.FullName.Substring($Release.Length + 1) })
if ($gh.Count -ne 1 -or $gh[0] -ne '.github\workflows\ccdv-pages.yml') { Fail '.github must contain only workflows/ccdv-pages.yml' }
Step 'distribution-allowlist' 'site/, .github/workflows/ccdv-pages.yml, README.md only'

# ---- receipt ----------------------------------------------------------------
try { if ((Invoke-Git @('rev-parse', 'HEAD')) -cne $ExpectedSha) { Fail 'HEAD moved while staging' } } catch { Fail $_.Exception.Message }
$receipt = [ordered]@{
  kind = 'ccdv-pages-stage'
  status = 'STAGED'
  sourceCommit = $ExpectedSha
  manifestSha256 = $manifestSha
  manifestFileCount = $inv.Count
  releaseDir = $Release
  stagedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  stagedBy = "$env:USERNAME@$env:COMPUTERNAME"
  powershell = $PSVersionTable.PSVersion.ToString()
  claudeMdChangeTolerated = [bool]$AllowTaskClaudeMd
  checks = $Checks
}
[System.IO.File]::WriteAllText($receiptPath, (($receipt | ConvertTo-Json -Depth 5) + "`n"), $Utf8NoBom)

Write-Host ''
Write-Host 'STAGED OK' -ForegroundColor Green
Write-Host "  source commit   : $ExpectedSha"
Write-Host "  manifest sha256 : $manifestSha"
Write-Host "  distribution    : $Release"
Write-Host "  receipt         : $receiptPath"
Write-Host '  Nothing was published. Next: OPERATOR-authorised ccdv-pages-publish.ps1.'
exit 0
