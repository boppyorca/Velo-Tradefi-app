# Confirm email for Velo test users via Supabase Admin API (fixes "Invalid login credentials" when confirm is required)
$ErrorActionPreference = "Stop"
$envPath = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envPath)) { throw "Missing $envPath" }

$lines = Get-Content $envPath
$supabaseUrl = ($lines | Where-Object { $_ -match '^SUPABASE_URL=' }) -replace '^SUPABASE_URL=', ''
$serviceKey = ($lines | Where-Object { $_ -match '^SUPABASE_SERVICE_ROLE_KEY=' }) -replace '^SUPABASE_SERVICE_ROLE_KEY=', ''

if (-not $supabaseUrl -or -not $serviceKey) {
    throw "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in backend/.env"
}

$headers = @{
    apikey        = $serviceKey
    Authorization = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

$listUri = "$supabaseUrl/auth/v1/admin/users?per_page=200"
$users = (Invoke-RestMethod -Uri $listUri -Headers $headers -Method Get).users

$targets = @("admin@velo.finance", "trader@velo.finance")
foreach ($email in $targets) {
    $u = $users | Where-Object { $_.email -eq $email }
    if (-not $u) {
        Write-Host "[MISS] No user: $email" -ForegroundColor Yellow
        continue
    }
    $id = $u.id
    $patchUri = "$supabaseUrl/auth/v1/admin/users/$id"
    $body = '{"email_confirm":true}' 
    try {
        Invoke-RestMethod -Uri $patchUri -Headers $headers -Method Put -Body $body | Out-Null
        Write-Host "[OK] Confirmed email: $email" -ForegroundColor Green
    } catch {
        # Some Supabase versions use PATCH
        try {
            Invoke-RestMethod -Uri $patchUri -Headers $headers -Method Patch -Body $body | Out-Null
            Write-Host "[OK] Confirmed email (PATCH): $email" -ForegroundColor Green
        } catch {
            Write-Host "[ERR] $email : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "Done." -ForegroundColor Cyan
