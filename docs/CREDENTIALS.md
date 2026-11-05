# Credentials and `.env`

All secrets live in **one file**: `Hunhar-backend/.env`. All five services read it when they start. The frontend has **no secrets**:
- It gets the Google client id from the backend (`GET /api/v1/auth/google/config`).
- It gets the Razorpay key id with each payment order.

[`Hunhar-backend/.env.example`](../Hunhar-backend/.env.example) lists every key. After you change `.env`, restart the backend:

```bash
cd Hunhar-backend && powershell -ExecutionPolicy Bypass -File run.ps1 -Action restart
```

Each service then prints in its log which integrations are on, without showing the secret values:

| Log line | Meaning |
|---|---|
| `Email (SMTP): configured via smtp.gmail.com as pr***@gmail.com` | OTP emails will be sent |
| `Email (SMTP): NOT configured` | OTP codes are only printed in the identity log |
| `Google sign-in: enabled` / `DISABLED` | Whether the Google button works |
| `Payments: Razorpay gateway enabled (TEST mode)` | Real Razorpay checkout |
| `Payments: ... using SIMULATED payments` | No Razorpay keys set yet |
| `JWT_SECRET is not set` / `INTERNAL_API_KEY is not set` | Still on development secrets |

Logs are in `Hunhar-backend/logs/<service>.log`.

---

## 1. Continue with Google: `GOOGLE_CLIENT_ID`

You only need the **Client ID**. The client secret is not used.

1. Open https://console.cloud.google.com and sign in with the Google account that should own the app.
2. Click the project picker (top bar) → **New Project** → name it `Hunhar` → **Create**, then select it.
3. Go to **APIs & Services → OAuth consent screen**. On newer consoles it's **Google Auth Platform → Branding**.
   - App name: `Hunhar`. User support email: your email.
   - Audience: **External**.
   - Developer contact email: your email → **Save**.
   - While the app is in **Testing**, only the emails added under **Audience → Test users** can sign in. Add yours.
   - When you go live, click **Publish app**. Hunhar only asks for name, email and photo (`openid email profile`), so Google doesn't need to review the app.
4. Go to **APIs & Services → Credentials** (or **Google Auth Platform → Clients**) → **Create credentials → OAuth client ID**:
   - Application type: **Web application**. Name: `Hunhar Web`.
   - **Authorized JavaScript origins**: add every address the site is opened from, with no trailing slash:
     - `http://localhost:5173`
     - `http://localhost`
     - `https://hunhar.in`
     - `https://app.hunhar.in`
   - **Authorized redirect URIs**: leave empty. Hunhar uses Google's popup, which needs no redirect.
   - Click **Create**.
5. Copy the **Client ID**. It looks like `1234567890-abc...xyz.apps.googleusercontent.com`.
6. Put it in `Hunhar-backend/.env`:
   ```
   GOOGLE_CLIENT_ID=1234567890-abc...xyz.apps.googleusercontent.com
   ```
7. Restart the backend and open the login page. **Continue with Google** opens Google's account chooser.

How sign-in behaves:
- **Existing email:** the user is signed in, and the Google account is linked to it.
- **New email:**
  - On the **signup page**, the account is created with the role selected in the Freelancer / Client switch.
  - On the **login page**, a small window first asks "Freelancer or Client" (plus a company name for clients).
- Google accounts don't have a Hunhar password. A user can set one any time with **Forgot?** on the login page.

| Problem | Fix |
|---|---|
| Popup says `origin_mismatch` / "redirect_uri_mismatch" | The site's address (exact scheme, host and port) is missing from Authorized JavaScript origins. Changes take up to 5 minutes |
| "Access blocked: app has not completed verification" | The app is in Testing and that email is not a test user. Add it, or publish the app |
| "Google sign-in is not set up yet" | `GOOGLE_CLIENT_ID` is empty, or the backend wasn't restarted |
| Popup doesn't open | The browser blocked pop-ups for the site. Allow them |

## 2. Email OTP (signup and password reset): `MAIL_*`

Gmail example:
1. Google Account → **Security** → turn on **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords, create an app password named `Hunhar`, and copy the 16 characters.
3. Put them in `.env`:
   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=youraddress@gmail.com
   MAIL_PASSWORD=abcdefghijklmnop
   MAIL_FROM_NAME=Hunhar
   ```

Other providers work the same way with their SMTP host, port 587 and credentials, for example Zoho (`smtp.zoho.in`), Amazon SES or Brevo.

### Resend (current setup)

```
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<your Resend API key, re_...>
MAIL_FROM=howdy@theunoia.com
MAIL_FROM_NAME=Hunhar
```

The `MAIL_FROM` domain (`theunoia.com`) must show as **Verified** under Resend → Domains. Otherwise Resend rejects every email.

## 3. Payments: `RAZORPAY_*`

1. Sign in at https://dashboard.razorpay.com and switch to **Test Mode** (top bar).
2. Go to **Account & Settings → API Keys → Generate Test Key**. Copy the **Key Id** (`rzp_test_...`) and the **Key Secret**. The secret is shown only once.
3. Webhook (recommended; needs a public URL):
   - Go to **Account & Settings → Webhooks → Add New Webhook**.
   - URL: `https://<your-api-domain>/api/v1/webhooks/razorpay`
   - Secret: any long random text. Put the same text in `RAZORPAY_WEBHOOK_SECRET`.
   - Events: `payment.captured`, `payment.failed`, `order.paid`.
   - For local testing you can skip the webhook. The app confirms each payment right after checkout anyway.
4. Put them in `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=the-text-you-typed-in-the-dashboard
   PAYMENTS_ALLOW_MOCK=true
   ```
5. Test with Razorpay's test cards (e.g. `4111 1111 1111 1111`, any future date, any CVV) or the test UPI id `success@razorpay`.

**Going live:** generate **Live** keys (`rzp_live_...`) after Razorpay activates your account, and set `PAYMENTS_ALLOW_MOCK=false`. With that setting, the billing service refuses to start if the keys are missing, so it can never silently fall back to fake payments.

## 4. File storage: Amazon S3

```
STORAGE_TYPE=s3
S3_BUCKET=hunhar-uploads
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

1. In AWS IAM, create a user (e.g. `hunhar-app`) with this policy, then create an **access key** for it (**Security credentials → Create access key → Application running outside AWS**):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::hunhar-uploads" },
       { "Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::hunhar-uploads/*" }
     ]
   }
   ```
2. Keep the bucket **private** (Block all public access = on). Files are served through the API, so the bucket never needs to be public.
3. On an EC2/ECS server with an IAM role that has this policy, leave the two key lines empty.
4. Set `STORAGE_TYPE=s3` and restart. The project-service log shows `File storage: Amazon S3 bucket hunhar-uploads (ap-south-1)`.

How it behaves:
- New uploads are stored under `uploads/<date>/<id>.<ext>` with server-side encryption.
- Files uploaded earlier stay on local disk and keep working.

## 5. SMS: `FAST2SMS_*`

Signup verifies the **mobile number by SMS code** (Fast2SMS OTP route) as well as the email.

How it works:
- The number must be a 10-digit Indian mobile that isn't already registered.
- Rules:
  - Each code is valid for 10 minutes.
  - After sending, there is a 30-second wait before a new code can be requested.
  - A user gets 5 wrong tries per code.
  - At most `MOBILE_OTP_DAILY_LIMIT` (default 5) SMS go to one number per day, to protect your balance.
- An account can't be created until both the email and the mobile are verified, and one mobile number can belong to only one account.
- With no `FAST2SMS_API_KEY`, the code is printed in the identity-service log, which is useful for local testing.
- Set `MOBILE_OTP_REQUIRED=false` to turn the SMS step off.

If an SMS fails, the user sees "Could not send the SMS…". The identity log line `Fast2SMS rejected SMS` shows Fast2SMS's reason, for example the OTP route not being enabled on your Fast2SMS account, or a low balance.

## 6. Security keys

| Key | What it is | Notes |
|---|---|---|
| `JWT_SECRET` | Signs login tokens | Already generated in your `.env`. 32+ random characters, the same everywhere. Changing it logs everyone out |
| `INTERNAL_API_KEY` | Lets the services call each other | Already generated. Must be the same for every service |
| `API_ENC_KEY_PAIR` | Gateway's encryption key | Leave empty: the gateway creates `Hunhar-backend/.api-enc-key` itself. Copy that file's contents here only if you run several gateway servers |
| `API_ENCRYPTION_REQUIRED` | Forces the encrypted API channel | Keep `true`. Set `false` only to test the API with Postman/curl |

To generate a random value:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 7. Admin account: `ADMIN_*`

The identity service creates this admin on its first start, if that email doesn't exist yet. To change the admin password later, use **Forgot?** on the login page with the admin email.

## Never commit secrets

`.env`, `.env.*` (except `.env.example`) and `.api-enc-key` are listed in `.gitignore`. For Jenkins, upload `.env` as the **Secret file** credential `hunhar-backend-env` (see [JENKINS.md](JENKINS.md)).
