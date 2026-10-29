<#
.SYNOPSIS
  CCDV Pages VERIFY (GF09-D). Read-only. Compares the staged release with the
  live site and reports what is machine-proven and what is still OPERATOR PENDING.

.DESCRIPTION
  Machine checks (HTTP level, against -BaseUrl):
    - staged tree still matches its manifest, release.json and stage receipt
    - live /release.json sourceCommit and manifestSha256 equal the staged release
    - live /release-manifest.sha256 hashes to the staged manifest SHA256
    - every manifest file is fetched live and its SHA256 compared (cache-busted)
    - every /assets/ reference in the live index.html is in the manifest
    - SPA deep-link routes return the app shell (byte-equal to index.html)
    - obsolete-site signatures/paths are absent (-ObsoletePath defaults to the 4 known
      legacy paths; absent = HTTP 404/200 carrying exactly the app shell; anything else,
      including a network failure, is NOT proof of absence and fails)
    - an unknown /assets/ file answers 404, so a 200 on a manifest file is a real file
    - optional -CheckRemote: default branch, Pages source, domain via read-only gh

  A 200 response or a green workflow is NEVER treated as parity. Browser checks
  (hard-refresh of deep links, mobile notice present, desktop notice absent,
  route-by-route behavior, layout/interaction) cannot be done here and are always
  reported OPERATOR PENDING. The script can only print "HTTP PARITY: PASS/FAIL";
  it never prints ACCEPTED.

  Entrypoint (OPERATOR):
    pwsh -File scripts\ccdv-pages-verify.ps1 -ExpectedSha <40-hex> [-CheckRemote]
         [-ObsoleteSignature 'text1','text2'] [-ObsoletePath 'old.html','css/old.css']
         [-PagesRunUrl <url>]

  Exit code 0 = every machine check passed (runtime still pending); 1 = failure.

.NOTES
  Extend -ObsoleteSignature / -ObsoletePath from the OPERATOR's read-only inventory
  of the legacy branch (its 36 files). With the default 4 paths the obsolete check is
  only a PARTIAL proof and is reported as such. If both are passed empty it is PENDING.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidatePattern('(?-i)^[0-9a-f]{40}$')][string]$ExpectedSha,
  [string]$StageRoot,
  [string]$BaseUrl = 'https://ccdevunit.xyz',
  [string]$Repo = 'Scorpioon/ccdv',
  [string]$PublicBranch = 'pages-release',
  [string]$ExpectedDomain = 'ccdevunit.xyz',
  [string[]]$ObsoleteSignature = @(),
  # Known legacy paths from the OPERATOR's read-only inventory (partial: 4 of the 36 legacy files).
  [string[]]$ObsoletePath = @('admin/index.html', 'about.html', 'work.html', 'styles.css'),
  [string]$PagesRunUrl = '',
  [switch]$CheckRemote
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path.TrimEnd('\')
if (-not $StageRoot) { $StageRoot = Join-Path (Split-Path $RepoRoot -Parent) 'ccdv-pages-dist' }
$StageRoot = [System.IO.Path]::GetFullPath($StageRoot).TrimEnd('\')
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Release = Join-Path $StageRoot $ExpectedSha
$Site = Join-Path $Release 'site'
$Results = New-Object System.Collections.Generic.List[object]
$script:Failed = 0

function Record([string]$Check, [string]$Result, [string]$Detail) {
  $Results.Add([pscustomobject]@{ check = $Check; result = $Result; detail = $Detail })
  $color = switch ($Result) { 'PASS' { 'Green' } 'FAIL' { 'Red' } default { 'Yellow' } }
  Write-Host ("  [{0}] {1}  {2}" -f $Result, $Check, $Detail) -ForegroundColor $color
  if ($Result -eq 'FAIL') { $script:Failed++ }
}

# base URL must be a domain root: assets are root-absolute.
$uri = [System.Uri]$BaseUrl
if ($uri.AbsolutePath -ne '/' -or $uri.Scheme -ne 'https') { Write-Host "BaseUrl must be an https domain root, got $BaseUrl" -ForegroundColor Red; exit 1 }
$Base = $BaseUrl.TrimEnd('/')

Add-Type -AssemblyName System.Net.Http
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AllowAutoRedirect = $false
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(30)
$client.DefaultRequestHeaders.CacheControl = New-Object System.Net.Http.Headers.CacheControlHeaderValue
$client.DefaultRequestHeaders.CacheControl.NoCache = $true
$Stamp = [DateTime]::UtcNow.Ticks

function Fetch([string]$Path) {
  $escaped = (($Path.TrimStart('/') -split '/') | ForEach-Object { [System.Uri]::EscapeDataString($_) }) -join '/'
  $url = "$Base/$escaped"
  $url += $(if ($url.Contains('?')) { '&' } else { '?' }) + "cb=$Stamp"
  try {
    $resp = $client.GetAsync($url).GetAwaiter().GetResult()
    $bytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    $sha = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    return [pscustomobject]@{ Ok = $true; Status = [int]$resp.StatusCode; Bytes = $bytes; Sha = $sha; Text = $Utf8NoBom.GetString($bytes) }
  } catch {
    return [pscustomobject]@{ Ok = $false; Status = 0; Bytes = @(); Sha = ''; Text = $_.Exception.Message }
  }
}

Write-Host "CCDV Pages VERIFY  sha=$ExpectedSha  base=$Base"

# ---- staged side ------------------------------------------------------------
$manifestFile = Join-Path $Site 'release-manifest.sha256'
$receiptPath = Join-Path $StageRoot "receipts\stage-$ExpectedSha.json"
if (-not (Test-Path -LiteralPath $manifestFile) -or -not (Test-Path -LiteralPath $receiptPath)) {
  Write-Host "Staged release or stage receipt missing under $StageRoot" -ForegroundColor Red; exit 1
}
$stageReceipt = [System.IO.File]::ReadAllText($receiptPath) | ConvertFrom-Json
$manifestSha = (Get-FileHash -LiteralPath $manifestFile -Algorithm SHA256).Hash.ToLowerInvariant()
$releaseJson = [System.IO.File]::ReadAllText((Join-Path $Site 'release.json')) | ConvertFrom-Json
$stagedReleaseSha = (Get-FileHash -LiteralPath (Join-Path $Site 'release.json') -Algorithm SHA256).Hash.ToLowerInvariant()
$stagedIndexSha = (Get-FileHash -LiteralPath (Join-Path $Site 'index.html') -Algorithm SHA256).Hash.ToLowerInvariant()
if ($stageReceipt.sourceCommit -ceq $ExpectedSha -and $stageReceipt.manifestSha256 -ceq $manifestSha -and $releaseJson.sourceCommit -ceq $ExpectedSha -and $releaseJson.manifestSha256 -ceq $manifestSha) {
  Record 'staged-identity' 'PASS' "manifest $manifestSha"
} else { Record 'staged-identity' 'FAIL' 'stage receipt, release.json and manifest disagree' }

$entries = @(); $malformed = 0
foreach ($line in ([System.IO.File]::ReadAllText($manifestFile) -split "`n")) {
  if (-not $line) { continue }
  if ($line -cmatch '^([0-9a-f]{64})  (.+)$') { $entries += [pscustomobject]@{ Sha = $Matches[1]; Path = $Matches[2] } } else { $malformed++ }
}
$localMismatch = @($entries | Where-Object {
  $p = Join-Path $Site $_.Path.Replace('/', '\')
  -not (Test-Path -LiteralPath $p) -or (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant() -cne $_.Sha
})
$siteBase = (Resolve-Path -LiteralPath $Site).Path.TrimEnd('\')
$entryPaths = @($entries | ForEach-Object { $_.Path })
$unlisted = @(Get-ChildItem -LiteralPath $siteBase -Recurse -File -Force | ForEach-Object { $_.FullName.Substring($siteBase.Length + 1).Replace('\', '/') } |
  Where-Object { @('release.json', 'release-manifest.sha256') -cnotcontains $_ -and $entryPaths -cnotcontains $_ })
if ($localMismatch.Count -eq 0 -and $unlisted.Count -eq 0 -and $malformed -eq 0 -and $entries.Count -gt 0) { Record 'staged-inventory' 'PASS' "$($entries.Count) files match manifest" }
else { Record 'staged-inventory' 'FAIL' "$($localMismatch.Count) staged files differ from manifest, $($unlisted.Count) not listed, $malformed malformed manifest lines" }

# ---- live identity ------------------------------------------------------------
$liveRelease = Fetch 'release.json'
if (-not $liveRelease.Ok -or $liveRelease.Status -ne 200) {
  Record 'live-release-json' 'FAIL' "HTTP $($liveRelease.Status) $($liveRelease.Text.Substring(0, [Math]::Min(120, $liveRelease.Text.Length)))"
} else {
  try {
    $lr = $liveRelease.Text | ConvertFrom-Json
    if ($lr.sourceCommit -ceq $ExpectedSha -and $lr.manifestSha256 -ceq $manifestSha -and $liveRelease.Sha -ceq $stagedReleaseSha) { Record 'live-release-json' 'PASS' "sourceCommit $($lr.sourceCommit), byte-identical to staged release.json" }
    else { Record 'live-release-json' 'FAIL' "live sourceCommit=$($lr.sourceCommit) manifest=$($lr.manifestSha256) bytesEqualStaged=$($liveRelease.Sha -ceq $stagedReleaseSha)" }
  } catch { Record 'live-release-json' 'FAIL' 'live release.json is not valid JSON (likely an obsolete or missing deployment)' }
}
$liveManifest = Fetch 'release-manifest.sha256'
if ($liveManifest.Ok -and $liveManifest.Status -eq 200 -and $liveManifest.Sha -ceq $manifestSha) { Record 'live-manifest' 'PASS' "sha256 $manifestSha" }
else { Record 'live-manifest' 'FAIL' "HTTP $($liveManifest.Status) sha=$($liveManifest.Sha)" }

# ---- every deployed file ------------------------------------------------------
$badFiles = @()
foreach ($e in $entries) {
  $r = Fetch $e.Path
  if (-not $r.Ok -or $r.Status -ne 200 -or $r.Sha -cne $e.Sha) { $badFiles += "$($e.Path) (HTTP $($r.Status))" }
}
if ($badFiles.Count -eq 0 -and $entries.Count -gt 0) { Record 'live-assets-hash' 'PASS' "$($entries.Count) files byte-identical to the staged release" }
else { Record 'live-assets-hash' 'FAIL' ("{0} mismatched/missing: {1}" -f $badFiles.Count, (($badFiles | Select-Object -First 8) -join '; ')) }

$liveIndex = Fetch ''
$known = @{}
foreach ($e in $entries) { $known["/$($e.Path)"] = $true }
$refs = @([regex]::Matches($liveIndex.Text, '"(/assets/[^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
$unknownRefs = @($refs | Where-Object { -not $known.ContainsKey($_) })
if ($liveIndex.Status -eq 200 -and $liveIndex.Sha -ceq $stagedIndexSha -and $refs.Count -gt 0 -and $unknownRefs.Count -eq 0) {
  Record 'live-index-refs' 'PASS' "$($refs.Count) /assets/ references, all in the manifest"
} else {
  Record 'live-index-refs' 'FAIL' "index HTTP $($liveIndex.Status), bytes-equal-to-staged=$($liveIndex.Sha -ceq $stagedIndexSha), unknown refs: $($unknownRefs -join ', ')"
}

# ---- SPA deep links (HTTP layer only) -------------------------------------------
$routes = @('studio', 'work', 'services', 'products', 'contact', 'products/ccos',
  'products/ccos/wrkops', 'products/ccos/kaia', 'products/ccos/aethernos', 'products/ccos/panoptes', 'products/ccos/kron', 'products/ccos/kairon')
$badRoutes = @(); $status404 = 0
foreach ($rt in $routes) {
  $r = Fetch $rt
  if ($r.Ok -and $r.Status -eq 404) { $status404++ }
  if (-not $r.Ok -or ($r.Status -ne 200 -and $r.Status -ne 404) -or $r.Sha -cne $stagedIndexSha) { $badRoutes += "/$rt (HTTP $($r.Status))" }
}
if ($badRoutes.Count -eq 0) {
  Record 'deep-link-http' 'PASS' "$($routes.Count) routes return the app shell ($status404 via the 404.html fallback; HTTP 404 with the SPA body is expected on GitHub Pages)"
} else { Record 'deep-link-http' 'FAIL' ($badRoutes -join '; ') }

# Control: the fallback answers 404 for anything that is not a real file, so a deep link
# (shell body, 404) is distinguishable from a real asset (manifest hash, 200) above.
$ctl = Fetch ("assets/ccdv-missing-{0}.js" -f $Stamp)
if ($ctl.Ok -and $ctl.Status -eq 404) { Record 'missing-asset-control' 'PASS' 'an unknown /assets/ file answers HTTP 404; the shell fallback cannot masquerade as an asset' }
else { Record 'missing-asset-control' 'FAIL' "an unknown /assets/ file answered HTTP $($ctl.Status)" }

# ---- obsolete site ----------------------------------------------------------------
if ($ObsoleteSignature.Count -eq 0 -and $ObsoletePath.Count -eq 0) {
  Record 'obsolete-absent' 'OPERATOR PENDING' 'no -ObsoleteSignature/-ObsoletePath supplied; the positive identity checks above are the only evidence'
} else {
  $found = @()
  foreach ($sig in $ObsoleteSignature) { if ($liveIndex.Text.Contains($sig)) { $found += "signature '$sig' in /" } }
  foreach ($p in $ObsoletePath) {
    $r = Fetch $p
    # Absent = Pages answered with the app-shell fallback. Anything else (a real file, a
    # redirect, a server error, no answer) does not prove absence.
    if (-not $r.Ok) { $found += "/$p unreachable (absence not proven)" }
    elseif (($r.Status -eq 404 -or $r.Status -eq 200) -and $r.Sha -ceq $stagedIndexSha) { }
    else { $found += "/$p HTTP $($r.Status), not the app-shell fallback" }
  }
  if ($found.Count -eq 0) { Record 'obsolete-absent' 'PASS' "$($ObsoleteSignature.Count) signatures, $($ObsoletePath.Count) paths absent. PARTIAL proof: the full 36-file legacy inventory is OPERATOR-supplied" }
  else { Record 'obsolete-absent' 'FAIL' ($found -join '; ') }
}

# ---- optional remote state (read-only gh) --------------------------------------------
if ($CheckRemote) {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Record 'remote-state' 'OPERATOR PENDING' 'gh not on PATH' }
  else {
    $prev = $ErrorActionPreference
    try {
      $ErrorActionPreference = 'Continue'
      $repoJson = (& gh repo view $Repo --json defaultBranchRef,visibility 2>&1) -join "`n"
      if ($LASTEXITCODE -ne 0) { throw $repoJson }
      $pagesJson = (& gh api "repos/$Repo/pages" 2>&1) -join "`n"
      if ($LASTEXITCODE -ne 0) { throw $pagesJson }
      $ErrorActionPreference = $prev
      $rv = $repoJson | ConvertFrom-Json
      $pg = $pagesJson | ConvertFrom-Json
      $problems = @()
      if ($rv.defaultBranchRef.name -ne $PublicBranch) { $problems += "default branch is $($rv.defaultBranchRef.name)" }
      if ($pg.build_type -ne 'workflow') { $problems += "Pages build_type is $($pg.build_type)" }
      if ($pg.cname -ne $ExpectedDomain) { $problems += "cname is $($pg.cname)" }
      if ($problems.Count -eq 0) { Record 'remote-state' 'PASS' "default=$PublicBranch, Pages=workflow, domain=$($pg.cname), https_enforced=$($pg.https_enforced), status=$($pg.status)" }
      else { Record 'remote-state' 'FAIL' ($problems -join '; ') }
    } catch { $ErrorActionPreference = $prev; Record 'remote-state' 'FAIL' $_.Exception.Message }
  }
} else { Record 'remote-state' 'OPERATOR PENDING' 'rerun with -CheckRemote (read-only gh) to confirm default branch, Pages source and domain' }

# ---- what this script cannot prove ------------------------------------------------------
foreach ($p in @(
  'browser hard refresh of every deep link (Home, Studio, Work, Services, Products, Contact, CCOS hub, six CCOS leaves)',
  'mobile viewport: notice present, top-left, gray, left-aligned, copy exact, navigation not obstructed',
  'desktop viewport: notice absent, layout unchanged versus local',
  'route-by-route interaction and motion parity versus the local build',
  'no significant layout or interaction regression'
)) { Record 'runtime-parity' 'OPERATOR PENDING' $p }

# ---- verdict + receipt ----------------------------------------------------------------------
$httpVerdict = if ($script:Failed -eq 0) { 'PASS' } else { 'FAIL' }
$receipt = [ordered]@{
  kind = 'ccdv-pages-verify'
  sourceCommit = $ExpectedSha
  manifestSha256 = $manifestSha
  baseUrl = $Base
  pagesRunUrl = $PagesRunUrl
  verifiedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
  httpParity = $httpVerdict
  runtimeParity = 'OPERATOR PENDING - NOT ACCEPTED'
  results = $Results
}
$null = New-Item -ItemType Directory -Path (Join-Path $StageRoot 'receipts') -Force
$out = Join-Path $StageRoot ("receipts\verify-{0}-{1}.json" -f $ExpectedSha.Substring(0, 12), (Get-Date -Format 'yyyyMMddHHmmss'))
[System.IO.File]::WriteAllText($out, (($receipt | ConvertTo-Json -Depth 5) + "`n"), $Utf8NoBom)
Write-Host ''
Write-Host "HTTP PARITY: $httpVerdict    RUNTIME PARITY: OPERATOR PENDING (release NOT ACCEPTED until the browser checks pass)"
Write-Host "receipt: $out"
if ($script:Failed -eq 0) { exit 0 } else { exit 1 }
