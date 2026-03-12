# Ramie Memo - GitHub Deployment Script
# Run this after creating your repository on GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername
)

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan

# Add remote
git remote add origin "https://github.com/$GitHubUsername/RamieMemo.git"

# Rename branch to main
git branch -M main

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n=== Push Complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://github.com/$GitHubUsername/RamieMemo/settings/pages" -ForegroundColor White
Write-Host "2. Under 'Source', select 'GitHub Actions'" -ForegroundColor White
Write-Host "3. Wait for deployment (check Actions tab)" -ForegroundColor White
Write-Host "4. Site will be live at: https://$GitHubUsername.github.io/RamieMemo/" -ForegroundColor Green
Write-Host "`nOpening repository..." -ForegroundColor Cyan

Start-Process "https://github.com/$GitHubUsername/RamieMemo"
