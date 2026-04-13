# PowerShell script to update .env file with Resend credentials
# Usage: .\update-resend.ps1 -ApiKey "re_your-api-key" -FromEmail "onboarding@resend.dev"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$FromEmail = "onboarding@resend.dev"
)

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Updating .env file with Resend credentials..." -ForegroundColor Cyan

# Read the current .env file
$content = Get-Content $envFile

# Update email configuration
$updatedContent = $content | ForEach-Object {
    if ($_ -match '^EMAIL_SERVER_HOST=') {
        'EMAIL_SERVER_HOST="smtp.resend.com"'
    } elseif ($_ -match '^EMAIL_SERVER_PORT=') {
        'EMAIL_SERVER_PORT=587'
    } elseif ($_ -match '^EMAIL_SERVER_USER=') {
        'EMAIL_SERVER_USER="resend"'
    } elseif ($_ -match '^EMAIL_SERVER_PASSWORD=') {
        "EMAIL_SERVER_PASSWORD=`"$ApiKey`""
    } elseif ($_ -match '^EMAIL_FROM=') {
        "EMAIL_FROM=`"Alumni System <$FromEmail>`""
    } else {
        $_
    }
}

# Write back to .env file
$updatedContent | Set-Content $envFile -Encoding UTF8

Write-Host "✅ Updated .env file with Resend credentials!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Host: smtp.resend.com"
Write-Host "  Port: 587"
Write-Host "  User: resend"
Write-Host "  Password: $($ApiKey.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "  From: $FromEmail"
Write-Host ""
Write-Host "Now test with: node test-email.js" -ForegroundColor Cyan
Write-Host ""
Write-Host '📧 Resend sends REAL emails to REAL inboxes!' -ForegroundColor Green
Write-Host '   Perfect for testing with real email addresses!' -ForegroundColor Green

