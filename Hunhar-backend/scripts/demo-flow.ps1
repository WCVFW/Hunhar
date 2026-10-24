<#
.SYNOPSIS
  End-to-end walkthrough of THEUNOiA through the API gateway (works on Windows PowerShell 5.1 and pwsh 7).
  Registration -> email verification (MailHog) -> Aadhaar KYC (mock DigiLocker) -> admin approval
  -> project post -> full-text search -> bid (credits) -> award -> escrow funding (mock gateway)
  -> deliver -> approve -> commission + payout to wallet -> complete -> review -> chat -> forum
  -> invoices -> dashboards -> admin analytics.
  Requires the stack started with:  .\run.ps1 start   (PAYMENT_PROVIDER=mock, KYC_PROVIDER=mock)
#>
param(
    [string]$Gateway = 'http://localhost:8080',
    [string]$MailHog = 'http://localhost:8025',
    [string]$AdminEmail = 'admin@theunoia.com',
    [string]$AdminPassword = 'Admin@12345'
)

$ErrorActionPreference = 'Stop'
$script:step = 0

function Step([string]$msg) { $script:step++; Write-Host ("`n[{0,2}] {1}" -f $script:step, $msg) -ForegroundColor Cyan }
function Ok([string]$msg) { Write-Host "     $msg" -ForegroundColor Green }

function Api([string]$Method, [string]$Path, $Body = $null, [string]$Token = $null) {
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = "$Gateway$Path"; Headers = $headers; TimeoutSec = 30 }
    if ($null -ne $Body) {
        $params['ContentType'] = 'application/json'
        $params['Body'] = [System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 10 -Compress))
    }
    try {
        return Invoke-RestMethod @params
    } catch {
        $detail = $_.ErrorDetails.Message
        throw "$Method $Path failed: $($_.Exception.Message) $detail"
    }
}

function WaitFor([string]$what, [scriptblock]$condition, [int]$seconds = 60) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        try { $r = & $condition; if ($r) { return $r } } catch { }
        Start-Sleep -Milliseconds 1500
    }
    throw "Timed out waiting for: $what"
}

function Get-VerificationToken([string]$email) {
    return WaitFor "verification email for $email" {
        $msgs = Invoke-RestMethod "$MailHog/api/v2/search?kind=to&query=$email" -TimeoutSec 10
        foreach ($m in $msgs.items) {
            $body = $m.Content.Body
            $cte = "$($m.Content.Headers.'Content-Transfer-Encoding')"
            if ($cte -match 'base64') {
                $body = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($body -replace '\s', '')))
            } else {
                # quoted-printable: undo soft line breaks and =3D before extracting the token
                $body = ($body -replace "=\r?\n", '') -replace '=3D', '='
            }
            if ($body -match 'verify-email\?token=([A-Za-z0-9_\-]+)') { return $Matches[1] }
        }
        return $null
    } 90
}

function Login([string]$email, [string]$password) {
    return Api POST '/api/v1/auth/login' @{ email = $email; password = $password }
}

# ------------------------------------------------------------------------------------------
$suffix = Get-Random -Minimum 100000 -Maximum 999999
$clientEmail = "client$suffix@demo.theunoia.com"
$freelancerEmail = "freelancer$suffix@demo.theunoia.com"
$password = 'Secret123'

Step 'Gateway health'
$health = Invoke-RestMethod "$Gateway/actuator/health"
Ok "gateway: $($health.status)"

Step 'Public website content (CMS) and categories'
$homePage = Api GET '/api/v1/content/pages/home'
Ok "home page SEO title: $($homePage.seo.metaTitle)"
$categories = Api GET '/api/v1/categories'
Ok "$($categories.Count) project categories"

Step 'Register a client and a freelancer'
Api POST '/api/v1/auth/register/client' @{ companyName = "Acme $suffix Pvt Ltd"; contactPerson = 'Ravi Kumar'; email = $clientEmail; mobile = "9$('{0:D9}' -f (Get-Random -Maximum 999999999))"; password = $password } | Out-Null
Api POST '/api/v1/auth/register/freelancer' @{ fullName = 'Asha Rao'; email = $freelancerEmail; mobile = "8$('{0:D9}' -f (Get-Random -Maximum 999999999))"; password = $password; skills = @('Java', 'Spring Boot', 'PostgreSQL'); portfolioLinks = @('https://github.com/asha') } | Out-Null
Ok "$clientEmail / $freelancerEmail"

Step 'Verify both e-mail addresses (token read from MailHog)'
foreach ($e in @($clientEmail, $freelancerEmail)) {
    $t = Get-VerificationToken $e
    Api POST '/api/v1/auth/verify-email' @{ token = $t } | Out-Null
    Ok "verified $e"
}

Step 'Aadhaar verification via DigiLocker (mock provider)'
$client = Login $clientEmail $password
$freelancer = Login $freelancerEmail $password
foreach ($u in @($client, $freelancer)) {
    Api POST '/api/v1/auth/kyc/aadhaar/initiate' $null $u.accessToken | Out-Null
    $kyc = Api GET '/api/v1/auth/kyc/aadhaar/status' $null $u.accessToken
    Ok "$($u.user.email): KYC $($kyc.status), Aadhaar XXXX-XXXX-$($kyc.aadhaarLast4)"
}

Step 'Admin approves both accounts'
$admin = Login $AdminEmail $AdminPassword
$pending = Api GET '/api/v1/admin/users?status=PENDING_APPROVAL&size=100' $null $admin.accessToken
Ok "$($pending.totalItems) account(s) awaiting approval"
foreach ($u in @($client, $freelancer)) {
    $r = Api POST "/api/v1/admin/users/$($u.user.id)/approve" $null $admin.accessToken
    Ok "$($r.email) -> $($r.status)"
}
# re-login so the access tokens carry status ACTIVE
$client = Login $clientEmail $password
$freelancer = Login $freelancerEmail $password
$C = $client.accessToken; $F = $freelancer.accessToken; $A = $admin.accessToken

Step 'Freelancer starter credits (granted asynchronously from user.registered)'
$credits = WaitFor 'starter credits' { $c = Api GET '/api/v1/credits/me' $null $F; if ($c.balance -gt 0) { $c } } 60
Ok "credit balance: $($credits.balance)"

Step 'Client posts a project'
$project = Api POST '/api/v1/projects' @{
    title       = "Build a Spring Boot payments API $suffix"
    description = 'We need an experienced backend engineer to build a secure payments API with Razorpay integration and PostgreSQL.'
    categoryId  = $categories[0].id; budgetType = 'FIXED'; budgetMin = 20000; budgetMax = 40000
    skills      = @('Java', 'Spring Boot'); paymentMode = 'PLATFORM'; publish = $true
} $C
Ok "project $($project.id) status=$($project.status) creditCost=$($project.creditCost)"

Step 'Freelancer discovers it through full-text search'
$found = WaitFor 'search result' { $s = Api GET "/api/v1/projects?q=payments%20razorpay&sort=relevance" $null $F; if ($s.totalItems -gt 0) { $s } } 20
Ok "$($found.totalItems) result(s); top: $($found.items[0].title)"

Step 'Freelancer bids (consumes credits)'
$bid = Api POST "/api/v1/projects/$($project.id)/bids" @{ amount = 30000; deliveryDays = 20; proposal = 'I have delivered several Razorpay integrations on Spring Boot with full test coverage and CI/CD.' } $F
$after = Api GET '/api/v1/credits/me' $null $F
Ok "bid $($bid.id) placed; credits now $($after.balance)"

Step 'Client compares bids and awards the project'
$cmp = Api GET "/api/v1/projects/$($project.id)/bids?sort=amount" $null $C
Ok "$($cmp.totalBids) bid(s), lowest INR $($cmp.lowestAmount)"
Api POST "/api/v1/bids/$($bid.id)/award" $null $C | Out-Null
$ws = Api GET "/api/v1/projects/$($project.id)/workspace" $null $C
$milestone = $ws.milestones[0]
Ok "project IN_PROGRESS; milestone '$($milestone.title)' INR $($milestone.amount)"

Step 'Client funds the milestone into escrow (mock payment gateway)'
$order = Api POST '/api/v1/payments/orders' @{ milestoneId = $milestone.id } $C
Api POST "/api/v1/payments/mock/$($order.orderId)/capture" $null $C | Out-Null
WaitFor 'milestone FUNDED' { $w = Api GET "/api/v1/projects/$($project.id)/workspace" $null $F; if ($w.milestones[0].status -eq 'FUNDED') { $w } } 60 | Out-Null
Ok 'escrow HELD, milestone FUNDED'

Step 'Freelancer chats with the client in the project room'
$conv = WaitFor 'project conversation' { $l = Api GET '/api/v1/conversations' $null $F; $p = $l | Where-Object { $_.projectId -eq $project.id }; if ($p) { $p } } 60
Api POST "/api/v1/conversations/$($conv.id)/messages" @{ body = 'Hi! Escrow received, starting work today.' } $F | Out-Null
Ok "message sent in conversation $($conv.id)"

Step 'Freelancer delivers, client approves (escrow release)'
Api POST "/api/v1/milestones/$($milestone.id)/submit" @{ note = 'All endpoints, tests and documentation delivered.' } $F | Out-Null
Api POST "/api/v1/milestones/$($milestone.id)/approve" @{ note = 'Great work!' } $C | Out-Null
$wallet = WaitFor 'escrow release to wallet' { $w = Api GET '/api/v1/payments/wallet' $null $F; if ($w.availableBalance -gt 0) { $w } } 60
Ok "freelancer wallet: INR $($wallet.availableBalance) (30000 - 10% commission - 18% GST on commission)"

Step 'Client completes the project and both leave reviews'
WaitFor 'milestone PAID' { $w = Api GET "/api/v1/projects/$($project.id)/workspace" $null $C; if ($w.milestones[0].status -eq 'PAID') { $w } } 60 | Out-Null
Api POST "/api/v1/projects/$($project.id)/complete" $null $C | Out-Null
Api POST "/api/v1/projects/$($project.id)/reviews" @{ rating = 5; comment = 'Excellent communication and quality.' } $C | Out-Null
Api POST "/api/v1/projects/$($project.id)/reviews" @{ rating = 5; comment = 'Clear requirements, quick payments.' } $F | Out-Null
Ok 'project COMPLETED, reviews posted'

Step 'Freelancer withdraws to UPI, admin approves the payout'
$acct = Api POST '/api/v1/payments/payout-accounts' @{ type = 'UPI'; accountHolderName = 'Asha Rao'; upiId = 'asha@okaxis' } $F
$wd = Api POST '/api/v1/payments/withdrawals' @{ payoutAccountId = $acct.id; amount = 5000 } $F
$wd = Api POST "/api/v1/admin/payments/withdrawals/$($wd.id)/approve" $null $A
Ok "withdrawal $($wd.status)"

Step 'Invoices (receipt, commission tax invoice, payout statement)'
$inv = Api GET '/api/v1/payments/invoices' $null $F
foreach ($i in $inv.items) { Ok "$($i.invoiceNumber)  $($i.type)  INR $($i.total)" }

Step 'Community forum: ask a question'
$fcats = Api GET '/api/v1/community/categories'
$thread = Api POST '/api/v1/community/threads' @{ categoryId = $fcats[1].id; type = 'QUESTION'; title = "How do you price fixed projects? $suffix"; body = 'Looking for advice on estimating and pricing fixed-price freelance work.'; tags = @('pricing') } $F
Ok "thread $($thread.id)"

Step 'Dashboards'
$fd = Api GET '/api/v1/dashboard/freelancer' $null $F
Ok ("freelancer: completed={0} wallet=INR {1} credits={2} rankScore={3}" -f $fd.projects.completedProjects, $fd.earnings.availableBalance, $fd.credits.balance, $fd.ranking.score)
$notes = Api GET '/api/v1/notifications/unread-count' $null $F
Ok "freelancer unread notifications: $($notes.unread)"
$board = Api GET '/api/v1/users/leaderboard?limit=3'
Ok "leaderboard #1: $($board[0].fullName) (score $($board[0].score))"

Step 'Admin analytics dashboard'
$an = Api GET '/api/v1/admin/analytics/dashboard' $null $A
Ok ("users={0} activeToday={1} projects={2} completed={3} revenue=INR {4} commission=INR {5}" -f `
        $an.users.totalUsers, $an.users.activeUsersToday, $an.projects.totalProjects, $an.projects.completedProjects, `
        $an.revenue.platformRevenue, $an.revenue.commissionEarnings)

Write-Host "`nDemo completed successfully - every module was exercised through the API gateway." -ForegroundColor Green
Write-Host "Emails sent during the demo: $MailHog"
