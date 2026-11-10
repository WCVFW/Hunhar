# Hunhar website (React + TypeScript + Vite)

## Run it on your PC

```bash
cd Hunhar-frontend
npm install
npm run dev
```

Open http://localhost:5173. Pick which backend the local website talks to:

| Command | Backend + database | API address | Settings file |
|---|---|---|---|
| `npm run dev` | **Live server** (default) | `https://www.hunhar.in` | `.env.development` |
| `npm run dev:ip` | Live server, through its IP | `http://3.109.241.160` | `.env.live-ip` |
| `npm run dev:local-backend` | Backend running on this PC | `http://localhost:8080` | `.env.localapi` |

With `dev` and `dev:ip` you see and change **real live data**. Log in with a test account, not a customer's.

These files hold only public addresses (no secrets) and are committed to the repo. A private override goes in
`.env.development.local` (ignored by Git).

## How the website reaches the API

- Every API call goes through an encrypted tunnel (`/api/x`, see `src/services/secureTransport.ts`), on top of HTTPS.
- The live gateway accepts calls from `localhost` on any port, so the local website works against the live server
  without extra setup.
- Google sign-in from `localhost` needs `http://localhost:5173` in the Google Cloud OAuth client's
  *Authorized JavaScript origins*.

## Calling the live API from Postman or curl

The public addresses only accept encrypted calls. For plain JSON, open an SSH tunnel and use `localhost:8080`:

```bash
ssh -i "C:\Users\praka\Downloads\hunhar-key.pem" -N -L 8080:127.0.0.1:8080 hunhar@3.109.241.160
```

```bash
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"you@example.com\",\"password\":\"...\"}"
```

Send the returned `token` as `Authorization: Bearer <token>` on later calls.

## Build

```bash
npm run build      # type-check + production build into dist/ (uses .env.production: same-address API)
```

Deploys happen automatically: a push to `main` that changes `Hunhar-frontend/` makes Jenkins build and publish the
website only (see `deploy/ec2/JENKINS.md`).
