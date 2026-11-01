<#
.SYNOPSIS
  CCDV Pages PUBLISH (GF09-D). OPERATOR-only. Mutates GitHub.

.DESCRIPTION
  Publishes a staged release to the distribution branch of the public repository
  from an INDEPENDENT Git history, then (initial release only) makes that branch
  the default, switches Pages to GitHub Actions and dispatches the ccdv-pages
  workflow. The development repository is never pushed: every Git write happens
  in a scratch clone/init under <StageRoot>\work, and the dev repo is only read.

  Without -Execute this is a DRY RUN: all read-only preflight runs, the plan is
  printed, nothing is changed and no prompt is shown. With -Execute there is
  exactly one Y/N prompt covering the whole listed plan.

  Mutations, in order (journalled before each):
    1. push <PublicBranch>              plain push, never --force
    2. set default branch               Initial mode only
    3. Pages build_type -> workflow     Initial mode only; cname is not sent
    4. dispatch ccdv-pages workflow     then watch the run (no retry)
  The legacy branch is never touched or deleted. If any step fails after a
  mutation, the script stops, journals PARTIAL and refuses to run again for
  that SHA: inspect GitHub, then remove the journal by hand.

  Entrypoint (OPERATOR, interactive terminal, gh authenticated):
    pwsh -File scripts\ccdv-pages-publish.ps1 -ExpectedSha <40> -ExpectedManifestSha256 <64> -Mode Initial            # dry run
    pwsh -File scripts\ccdv-pages-publish.ps1 -ExpectedSha <40> -ExpectedManifestSha256 <64> -Mode Initial -Execute   # real

.PARAMETER Mode
  Initial: pages-release must not exist, default must be the legacy branch,
  Pages must be legacy-mode. Update: pages-release must exist and be default,
  Pages must already be workflow-mode.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][ValidatePattern('(?-i)^[0-9a-f]{40}$')][string]$ExpectedSha,
  [Parameter(Mandatory)][ValidatePattern('(?-i)^[0-9a-f]{64}$')][string]$ExpectedManifestSha256,
  [Parameter(Mandatory)][ValidateSet('Initial', 'Update')][string]$Mode,
  [string]$StageRoot,
  [ValidatePattern('^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$')][string]$Repo = 'Scorpioon/ccdv',
  [ValidatePattern('^[a-z0-9.-]+$')][string]$ExpectedDomain = 'ccdevunit.xyz',
  # Fixed on purpose: the only branch this script may write is pages-release, and
  # the legacy branch can never be named as the push target.
  [ValidateSet('public-pristine', IgnoreCase = $false)][string]$LegacyBranch = 'public-pristine',
  [ValidateSet('pages-release', IgnoreCase = $false)][string]$PublicBranch = 'pages-release',
  [switch]$Execute
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path.TrimEnd('\')
if (-not $StageRoot) { $StageRoot = Join-Path (Split-Path $RepoRoot -Parent) 'ccdv-pages-dist' }
$StageRoot = [System.IO.Path]::GetFullPath($StageRoot).TrimEnd('\')
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$RemoteUrl = "https://github.com/$Repo.git"
$Sha12 = $ExpectedSha.Substring(0, 12)
$Release = Join-Path $StageRoot $ExpectedSha
$Site = Join-Path $Release 'site'
$Receipts = Join-Path $StageRoot 'receipts'
$JournalPath = Join-Path $Receipts "publish-$Sha12.journal.json"
$Journal = [ordered]@{ kind = 'ccdv-pages-publish-journal'; status = 'PREFLIGHT'; sourceCommit = $ExpectedSha; manifestSha256 = $ExpectedManifestSha256; mode = $Mode; repo = $Repo; steps = @() }
$Mutated = $false

function Save-Journal { [System.IO.File]::WriteAllText($JournalPath, (($Journal | ConvertTo-Json -Depth 6) + "`n"), $Utf8NoBom) }
function Journal-Step([string]$Name, [string]$State, [string]$Detail) {
  $Journal.steps = @($Journal.steps) + [pscustomobject]@{ step = $Name; state = $State; atUtc = (Get-Date).ToUniversalTime().ToString('o'); detail = $Detail }
  Save-Journal
}
function Refuse([string]$Message) {
  Write-Host "  [REFUSED] $Message" -ForegroundColor Red
  Write-Host 'No GitHub state was changed.' -ForegroundColor Red
  exit 1
}
function Invoke-Native {
  param([Parameter(Mandatory)][string]$File, [string[]]$Arguments = @(), [switch]$AllowFail)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { $out = & $File @Arguments 2>&1 } finally { $ErrorActionPreference = $prev }
  $code = $LASTEXITCODE
  $text = (($out | ForEach-Object { "$_" }) -join "`n").TrimEnd()
  if ($code -ne 0 -and -not $AllowFail) { throw "$File $($Arguments -join ' ') failed (exit $code): $text" }
  return [pscustomobject]@{ Code = $code; Text = $text }
}
# Not named "Gh": a function of that name would shadow gh.exe inside Invoke-Native (& 'gh')
# and make Get-Command 'gh' succeed without gh being installed.
function Invoke-Gh([string[]]$Arguments) { return (Invoke-Native -File 'gh' -Arguments $Arguments).Text }
function GitIn([string]$Dir, [string[]]$Arguments) { return (Invoke-Native -File 'git' -Arguments (@('-C', $Dir) + $Arguments)).Text }

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

Write-Host "CCDV Pages PUBLISH  mode=$Mode  repo=$Repo  execute=$([bool]$Execute)"

# ---- operator-only ----------------------------------------------------------
if ($env:CI -or $env:GITHUB_ACTIONS) { Refuse 'CI environment detected; this script is OPERATOR-only' }
if (-not [Environment]::UserInteractive -or [Console]::IsInputRedirected) { Refuse 'needs an interactive terminal' }
foreach ($tool in 'git', 'gh') { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Refuse "$tool not found on PATH" } }
if ((Invoke-Native -File 'gh' -Arguments @('auth', 'status') -AllowFail).Code -ne 0) { Refuse 'gh is not authenticated (run gh auth login)' }
foreach ($key in 'user.name', 'user.email') {
  if (-not (Invoke-Native -File 'git' -Arguments @('config', '--get', $key) -AllowFail).Text) { Refuse "git config $key is not set" }
}
Write-Host '  [ok] operator context, git, gh auth, git identity'

# ---- no unattended retry after partial mutation -------------------------------
if (Test-Path -LiteralPath $JournalPath) {
  $prior = [System.IO.File]::ReadAllText($JournalPath) | ConvertFrom-Json
  if ($prior.status -ne 'COMPLETE') { Refuse "journal $JournalPath has status '$($prior.status)'; inspect GitHub, then delete it by hand" }
  Refuse "release $Sha12 already published (COMPLETE journal at $JournalPath)"
}

# ---- staged artifact --------------------------------------------------------
try {
  $stageReceiptPath = Join-Path $Receipts "stage-$ExpectedSha.json"
  if (-not (Test-Path -LiteralPath $stageReceiptPath)) { Refuse "missing stage receipt $stageReceiptPath" }
  $stageReceipt = [System.IO.File]::ReadAllText($stageReceiptPath) | ConvertFrom-Json
  if ($stageReceipt.status -cne 'STAGED' -or $stageReceipt.sourceCommit -cne $ExpectedSha) { Refuse 'stage receipt does not match -ExpectedSha' }
  if ($stageReceipt.manifestSha256 -cne $ExpectedManifestSha256) { Refuse 'stage receipt manifest differs from -ExpectedManifestSha256' }

  $manifestFile = Join-Path $Site 'release-manifest.sha256'
  $releaseJson = [System.IO.File]::ReadAllText((Join-Path $Site 'release.json')) | ConvertFrom-Json
  if ((Get-FileHash -LiteralPath $manifestFile -Algorithm SHA256).Hash.ToLowerInvariant() -cne $ExpectedManifestSha256) { Refuse 'staged manifest file hash differs from -ExpectedManifestSha256' }
  if ($releaseJson.sourceCommit -cne $ExpectedSha -or $releaseJson.manifestSha256 -cne $ExpectedManifestSha256) { Refuse 'staged release.json identity differs' }
  $inv = Get-Inventory -SiteDir $Site -Exclude @('release.json', 'release-manifest.sha256')
  if ($inv.Text -cne [System.IO.File]::ReadAllText($manifestFile)) { Refuse 'staged site/ no longer matches its manifest (tampered or modified)' }
  $topNames = @(Get-ChildItem -LiteralPath $Release -Force | ForEach-Object { $_.Name })
  foreach ($t in $topNames) { if (@('site', '.github', 'README.md') -notcontains $t) { Refuse "unexpected top-level entry in staged tree: $t" } }
  Write-Host "  [ok] staged tree verified: $($inv.Count) files, manifest $ExpectedManifestSha256"

  $devHead = (Invoke-Native -File 'git' -Arguments @('-C', $RepoRoot, 'rev-parse', 'HEAD')).Text
  if ($devHead -cne $ExpectedSha) { Refuse "dev repo HEAD $devHead moved away from $ExpectedSha" }
  Write-Host '  [ok] dev repo HEAD still equals the approved SHA (read-only)'

  # ---- remote identity and state (read-only) -----------------------------------
  $view = Invoke-Gh @('repo', 'view', $Repo, '--json', 'nameWithOwner,visibility,defaultBranchRef,url') | ConvertFrom-Json
  if ($view.nameWithOwner -ne $Repo) { Refuse "remote identity '$($view.nameWithOwner)' is not '$Repo'" }
  if ($view.visibility -ne 'PUBLIC') { Refuse "repository visibility is '$($view.visibility)', expected PUBLIC" }
  $defaultBranch = $view.defaultBranchRef.name
  $branches = @((Invoke-Gh @('api', "repos/$Repo/branches?per_page=100", '--paginate', '--jq', '.[].name')) -split "`n" | Where-Object { $_ })
  $lsRemote = (Invoke-Native -File 'git' -Arguments @('ls-remote', '--heads', $RemoteUrl)).Text
  $remoteHeads = @{}
  foreach ($l in ($lsRemote -split "`n")) { if ($l -match '^([0-9a-f]{40})\s+refs/heads/(.+)$') { $remoteHeads[$Matches[2]] = $Matches[1] } }
  $pages = Invoke-Gh @('api', "repos/$Repo/pages") | ConvertFrom-Json
  $pagesBefore = [ordered]@{ build_type = $pages.build_type; cname = $pages.cname; https_enforced = $pages.https_enforced; html_url = $pages.html_url; status = $pages.status }
  Write-Host "  remote default=$defaultBranch  branches=[$($branches -join ', ')]  pages=$($pagesBefore.build_type) cname=$($pagesBefore.cname)"

  if ($branches -contains 'main') { Refuse "remote has a 'main' branch; unexpected for this release model" }
  if ($pages.cname -ne $ExpectedDomain) { Refuse "Pages custom domain '$($pages.cname)' is not '$ExpectedDomain'" }
  if ($Mode -eq 'Initial') {
    if ($defaultBranch -ne $LegacyBranch) { Refuse "default branch '$defaultBranch' is not '$LegacyBranch'" }
    if ($branches -notcontains $LegacyBranch) { Refuse "legacy branch '$LegacyBranch' not found" }
    if ($branches -contains $PublicBranch -or $remoteHeads.ContainsKey($PublicBranch)) { Refuse "'$PublicBranch' already exists; use -Mode Update" }
    if ($pages.build_type -ne 'legacy') { Refuse "Pages build_type '$($pages.build_type)', expected 'legacy' for Initial" }
  } else {
    if ($defaultBranch -ne $PublicBranch) { Refuse "default branch '$defaultBranch' is not '$PublicBranch'" }
    if (-not $remoteHeads.ContainsKey($PublicBranch)) { Refuse "'$PublicBranch' not found on remote" }
    if ($pages.build_type -ne 'workflow') { Refuse "Pages build_type '$($pages.build_type)', expected 'workflow' for Update" }
  }
  $preSha = if ($remoteHeads.ContainsKey($PublicBranch)) { $remoteHeads[$PublicBranch] } else { '(absent)' }
  $legacySha = if ($remoteHeads.ContainsKey($LegacyBranch)) { $remoteHeads[$LegacyBranch] } else { '(absent)' }
  Write-Host '  [ok] remote identity, visibility, branches, Pages mode and domain match the expected state'
} catch { Refuse $_.Exception.Message }

# ---- plan ---------------------------------------------------------------------
Write-Host ''
Write-Host 'PLAN'
Write-Host "  1. push '$PublicBranch' to $RemoteUrl from an independent history (plain push, no force); pre-state: $preSha"
if ($Mode -eq 'Initial') {
  Write-Host "  2. set default branch '$LegacyBranch' -> '$PublicBranch'  ('$LegacyBranch' is kept)"
  Write-Host "  3. Pages build_type legacy -> workflow  (custom domain '$ExpectedDomain' not sent; verified unchanged after)"
}
Write-Host "  4. dispatch ccdv-pages.yml on '$PublicBranch' with expected_sha=$Sha12... and the manifest hash, then watch the run"
Write-Host "  Source commit $ExpectedSha  manifest $ExpectedManifestSha256"
Write-Host "  '$LegacyBranch' must remain at $legacySha (re-checked before completion)"
Write-Host '  The site may be unavailable between step 3 and a successful deploy.'
if (-not $Execute) {
  Write-Host ''
  Write-Host 'DRY RUN complete. Nothing changed. Add -Execute to publish.' -ForegroundColor Yellow
  exit 0
}

# ---- the single authorization -----------------------------------------------
Write-Host ''
$answer = Read-Host "Authorize this publication to ${Repo}? Type Y/y to proceed (anything else aborts)"
if (-not ($answer -ceq 'Y' -or $answer -ceq 'y')) { Write-Host 'Not authorized. Aborted; nothing changed.'; exit 1 }

$null = New-Item -ItemType Directory -Path $Receipts -Force
$Journal.status = 'IN_PROGRESS'; $Journal['preRemoteSha'] = $preSha; $Journal['preLegacySha'] = $legacySha; $Journal['pagesBefore'] = $pagesBefore
Save-Journal

try {
  # ---- 1: independent history + push ------------------------------------------
  $Work = Join-Path $StageRoot ("work\{0}-{1}" -f $Sha12, (Get-Date -Format 'yyyyMMddHHmmss'))
  $null = New-Item -ItemType Directory -Path (Split-Path $Work -Parent) -Force
  if ($Mode -eq 'Initial') {
    $null = New-Item -ItemType Directory -Path $Work
    $null = Invoke-Native -File 'git' -Arguments @('init', $Work)
    $null = GitIn $Work @('symbolic-ref', 'HEAD', "refs/heads/$PublicBranch")
    $null = GitIn $Work @('remote', 'add', 'origin', $RemoteUrl)
  } else {
    $null = Invoke-Native -File 'git' -Arguments @('clone', '--single-branch', '--branch', $PublicBranch, $RemoteUrl, $Work)
    # The clone must be exactly the state the plan was shown for; otherwise stop before any push.
    if ((GitIn $Work @('rev-parse', 'HEAD')) -cne $preSha) { throw "remote $PublicBranch moved since preflight (expected $preSha); nothing was pushed" }
    foreach ($item in Get-ChildItem -LiteralPath $Work -Force) { if ($item.Name -ne '.git') { Remove-Item -LiteralPath $item.FullName -Recurse -Force } }
  }
  # Byte-exact commit: no CRLF/filter conversion may alter a hashed file between stage and remote.
  $null = GitIn $Work @('config', 'core.autocrlf', 'false')
  $null = GitIn $Work @('config', 'core.safecrlf', 'false')
  $null = New-Item -ItemType Directory -Path (Join-Path $Work '.git\info') -Force
  [System.IO.File]::WriteAllText((Join-Path $Work '.git\info\attributes'), "* -text`n", $Utf8NoBom)
  foreach ($name in 'site', '.github', 'README.md') {
    Copy-Item -LiteralPath (Join-Path $Release $name) -Destination (Join-Path $Work $name) -Recurse -Force
  }
  $workInv = Get-Inventory -SiteDir (Join-Path $Work 'site') -Exclude @('release.json', 'release-manifest.sha256')
  if ($workInv.Text -cne [System.IO.File]::ReadAllText($manifestFile)) { throw 'copied site/ differs from the manifest before commit; nothing was pushed' }
  $null = GitIn $Work @('add', '--all')
  if (-not (GitIn $Work @('status', '--porcelain'))) { throw 'no changes versus the remote branch; nothing to publish' }
  $null = GitIn $Work @('commit', '-m', "release: ccdv $Sha12 manifest $($ExpectedManifestSha256.Substring(0, 12))", '-m', "source commit $ExpectedSha`nmanifest sha256 $ExpectedManifestSha256")
  $newSha = GitIn $Work @('rev-parse', 'HEAD')
  if ($Mode -eq 'Initial' -and (GitIn $Work @('rev-list', '--count', 'HEAD')) -ne '1') { throw 'initial distribution history is not a single root commit' }
  Journal-Step 'commit' 'done' "distribution commit $newSha in $Work"

  Journal-Step 'push' 'started' "$PublicBranch -> $RemoteUrl"
  $Mutated = $true
  $null = GitIn $Work @('push', 'origin', "HEAD:refs/heads/$PublicBranch")
  $remoteNow = ((Invoke-Native -File 'git' -Arguments @('ls-remote', '--heads', $RemoteUrl, "refs/heads/$PublicBranch")).Text -split '\s+')[0]
  if ($remoteNow -cne $newSha) { throw "remote $PublicBranch is $remoteNow after push, expected $newSha" }
  $Journal['newPublicSha'] = $newSha
  Journal-Step 'push' 'done' "remote $PublicBranch = $newSha"

  # ---- 2 + 3: default branch and Pages source (Initial only) ----------------------
  if ($Mode -eq 'Initial') {
    Journal-Step 'default-branch' 'started' "$LegacyBranch -> $PublicBranch"
    $newDefault = Invoke-Gh @('api', '-X', 'PATCH', "repos/$Repo", '-f', "default_branch=$PublicBranch", '--jq', '.default_branch')
    if ($newDefault -ne $PublicBranch) { throw "default branch is '$newDefault' after PATCH" }
    Journal-Step 'default-branch' 'done' $newDefault

    Journal-Step 'pages-source' 'started' 'build_type -> workflow'
    $null = Invoke-Gh @('api', '-X', 'PUT', "repos/$Repo/pages", '-f', 'build_type=workflow')
    $after = Invoke-Gh @('api', "repos/$Repo/pages") | ConvertFrom-Json
    $Journal['pagesAfter'] = [ordered]@{ build_type = $after.build_type; cname = $after.cname; https_enforced = $after.https_enforced; html_url = $after.html_url }
    if ($after.build_type -ne 'workflow') { throw "Pages build_type is '$($after.build_type)' after PUT" }
    if ($after.cname -ne $pagesBefore.cname) { throw "CUSTOM DOMAIN CHANGED: '$($pagesBefore.cname)' -> '$($after.cname)'. Restore it by hand." }
    if ($after.https_enforced -ne $pagesBefore.https_enforced) { throw 'https_enforced changed; inspect Pages settings by hand' }
    Journal-Step 'pages-source' 'done' 'workflow; cname and https_enforced unchanged'
  }

  # ---- 4: dispatch and watch (single attempt) --------------------------------------
  # Run identity = a workflow_dispatch run of this workflow on this branch, for the commit just
  # pushed, that did not exist before the dispatch. More than one candidate is ambiguous: stop.
  $listArgs = @('run', 'list', '-R', $Repo, '--workflow', 'ccdv-pages.yml', '--branch', $PublicBranch, '--event', 'workflow_dispatch', '--limit', '20', '--json', 'databaseId,headSha,url')
  $pre = Invoke-Native -File 'gh' -Arguments $listArgs -AllowFail
  $priorIds = @()
  if ($pre.Code -eq 0 -and $pre.Text) { $priorIds = @(($pre.Text | ConvertFrom-Json) | ForEach-Object { [string]$_.databaseId }) }
  Journal-Step 'dispatch' 'started' "ccdv-pages.yml; $($priorIds.Count) earlier dispatch runs ignored"
  $null = Invoke-Gh @('workflow', 'run', 'ccdv-pages.yml', '-R', $Repo, '--ref', $PublicBranch, '-f', "expected_sha=$ExpectedSha", '-f', "expected_manifest_sha256=$ExpectedManifestSha256")
  $runId = $null
  for ($i = 0; $i -lt 12 -and -not $runId; $i++) {
    Start-Sleep -Seconds 5
    $listed = Invoke-Native -File 'gh' -Arguments $listArgs -AllowFail
    if ($listed.Code -ne 0 -or -not $listed.Text) { continue }
    $cands = @(($listed.Text | ConvertFrom-Json) | Where-Object { $priorIds -notcontains [string]$_.databaseId -and $_.headSha -ceq $newSha })
    if ($cands.Count -gt 1) { throw "more than one new workflow run matches $newSha ($(($cands | ForEach-Object { $_.url }) -join ', ')); inspect the Actions tab by hand" }
    if ($cands.Count -eq 1) { $runId = $cands[0].databaseId }
  }
  if (-not $runId) { throw 'dispatched, but no matching workflow run appeared within 60s; check the Actions tab by hand (do NOT redispatch blindly)' }
  Journal-Step 'dispatch' 'done' "run $runId"
  Write-Host "  watching run $runId (no retry on failure)"
  $watch = Invoke-Native -File 'gh' -Arguments @('run', 'watch', "$runId", '-R', $Repo, '--exit-status') -AllowFail
  $run = Invoke-Gh @('run', 'view', "$runId", '-R', $Repo, '--json', 'status,conclusion,url,headSha,createdAt,updatedAt') | ConvertFrom-Json
  $Journal['workflowRun'] = [ordered]@{ id = $runId; url = $run.url; status = $run.status; conclusion = $run.conclusion; headSha = $run.headSha }
  if ($watch.Code -ne 0 -or $run.conclusion -ne 'success') { throw "workflow run $($run.url) concluded '$($run.conclusion)'" }
  if ($run.headSha -cne $newSha) { throw "workflow headSha $($run.headSha) differs from pushed $newSha" }

  # The legacy branch must be exactly where the plan found it.
  if ($legacySha -ne '(absent)') {
    $legacyNow = ((Invoke-Native -File 'git' -Arguments @('ls-remote', '--heads', $RemoteUrl, "refs/heads/$LegacyBranch")).Text -split '\s+')[0]
    if ($legacyNow -cne $legacySha) { throw "'$LegacyBranch' is $legacyNow, expected $legacySha (it must not change)" }
    Journal-Step 'legacy-intact' 'done' "$LegacyBranch = $legacySha"
  }

  $Journal.status = 'COMPLETE'
  Journal-Step 'complete' 'done' $run.url
  $final = Join-Path $Receipts "publish-$ExpectedSha.json"
  [System.IO.File]::WriteAllText($final, (($Journal | ConvertTo-Json -Depth 6) + "`n"), $Utf8NoBom)
  Write-Host ''
  Write-Host 'PUBLISHED. Deployment workflow succeeded - this is NOT parity acceptance.' -ForegroundColor Green
  Write-Host "  public branch SHA : $newSha"
  Write-Host "  workflow run      : $($run.url)"
  Write-Host "  receipt           : $final"
  Write-Host "  Next: scripts\ccdv-pages-verify.ps1 -ExpectedSha $ExpectedSha -CheckRemote"
  exit 0
} catch {
  $Journal.status = $(if ($Mutated) { 'PARTIAL' } else { 'FAILED' })
  $Journal['error'] = $_.Exception.Message
  Save-Journal
  Write-Host ''
  Write-Host "PUBLISH STOPPED ($($Journal.status)): $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'No automatic retry. Inspect GitHub state; journal: ' -NoNewline
  Write-Host $JournalPath
  if ($Mutated) { Write-Host 'Remote state was MUTATED. public-pristine was not touched.' -ForegroundColor Red }
  exit 1
}
