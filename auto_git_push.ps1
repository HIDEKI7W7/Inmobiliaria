# ponytail: simple PowerShell script to add, commit and push changes hourly
Set-Location -Path "c:\Users\PC\Desktop\Inmobiliaria"
git add .
# Commit only if there are changes
$status = git status --porcelain
if ($status) {
    git commit -m "auto: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
}
