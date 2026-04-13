# PowerShell script to update DATABASE_URL in .env file
# Usage: .\update-env.ps1 -Username "postgres" -Password "yourpassword" -Database "alumni_db"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "alumni_db",
    
    [Parameter(Mandatory=$false)]
    [string]$Host = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$Port = "5432"
)

$envFile = ".env"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Create the connection string
$connectionString = "postgresql://${Username}:${Password}@${Host}:${Port}/${Database}"

# Read the current .env file
$content = Get-Content $envFile

# Replace the DATABASE_URL line
$updatedContent = $content | ForEach-Object {
    if ($_ -match '^DATABASE_URL=') {
        "DATABASE_URL=`"$connectionString`""
    } else {
        $_
    }
}

# Write back to .env file
$updatedContent | Set-Content $envFile -Encoding UTF8

Write-Host "✅ Updated DATABASE_URL in .env file" -ForegroundColor Green
Write-Host "Connection string: postgresql://${Username}:***@${Host}:${Port}/${Database}" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you can run migrations:" -ForegroundColor Yellow
Write-Host "  npx prisma migrate dev --name init" -ForegroundColor White

