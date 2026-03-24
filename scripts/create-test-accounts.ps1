# Script tạo tài khoản test qua Supabase Auth API

$SUPABASE_URL = "https://shloeixwkwzyxwwzmkmh.supabase.co"
$SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobG9laXh3a3d6eXh3d3pta21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjI1NzgsImV4cCI6MjA4OTU5ODU3OH0.Pdc3neAfOgBffJgCND6KOiFaA1jIMnTe_Sc38dUkW6c"

$headers = @{
    "apikey" = $SUPABASE_KEY
    "Content-Type" = "application/json"
}

function Create-Account {
    param([string]$email, [string]$password, [string]$fullName)

    $body = @{
        email = $email
        password = $password
        options = @{
            data = @{
                full_name = $fullName
            }
        }
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/signup" `
            -Method Post `
            -Headers $headers `
            -Body $body

        if ($response.user) {
            Write-Host "[OK] Created: $email" -ForegroundColor Green
            return $true
        }
    } catch {
        $errDetail = $_.Exception.Response
        if ($errDetail -ne $null) {
            $stream = $errDetail.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $bodyResponse = $reader.ReadToEnd()
            $reader.Close()

            if ($bodyResponse -match "already registered") {
                Write-Host "[SKIP] Already exists: $email" -ForegroundColor Yellow
            } else {
                Write-Host "[ERROR] $email : $bodyResponse" -ForegroundColor Red
            }
        }
    }
    return $false
}

Write-Host "Creating test accounts..." -ForegroundColor Cyan
Write-Host ""

Create-Account "admin@velo.finance" "Admin123!" "Admin User"
Create-Account "trader@velo.finance" "Trader123!" "Test Trader"

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
