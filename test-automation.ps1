# Test Daily Automation PowerShell Script
Write-Host "🧪 Testing Daily Notification Automation..." -ForegroundColor Cyan

# You need to replace this with your actual service role key from:
# Supabase Dashboard -> Settings -> API -> service_role key
$serviceRoleKey = "REPLACE_WITH_YOUR_SERVICE_ROLE_KEY"

if ($serviceRoleKey -eq "REPLACE_WITH_YOUR_SERVICE_ROLE_KEY") {
    Write-Host "❌ Error: Please replace the service role key in this script" -ForegroundColor Red
    Write-Host "   Get it from: https://supabase.com/dashboard/project/hrznuhcwdjnpasfnqqwp/settings/api" -ForegroundColor Yellow
    exit 1
}

$url = "https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/daily-notifications"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $serviceRoleKey"
}
$body = '{"automated": true}' | ConvertTo-Json

try {
    Write-Host "📤 Sending test automation request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    
    Write-Host "✅ Automation test successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "❌ Automation test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "1. ✅ Cron jobs are active and scheduled"
Write-Host "2. 🚀 Deploy updated Edge Function if not done yet"
Write-Host "3. 📱 Test notifications in your app"
Write-Host "4. 📈 Monitor with SQL queries from monitor-automation.sql"
















