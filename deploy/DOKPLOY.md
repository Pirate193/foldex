# Deploying foldex on Dokploy

This is the short path for the hackathon VPS. Dokploy already owns ports 80/443
through Traefik, so **do not use `deploy/docker-compose.yml` or Caddy here**.
Dokploy provides Postgres, Redis, TLS, and the reverse proxy.

Target shape:

```
Desktop app ──HTTPS──> api.foldex.space (Dokploy app: foldex-api)
                             │
                             ├── Postgres (Dokploy database, internal)
                             ├── Redis    (Dokploy database, internal)
                             │
                             └── BullMQ worker (Dokploy app: foldex-worker)
                                      │
                                      └── Cloud Run /generate-video ──> R2
```

## 0. Before you start

Get the server IP from your VPS provider or from Dokploy (Server → General).
The Dokploy panel is normally at `http://SERVER_IP:3000`.

Create these two DNS records in Cloudflare:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `api` | `SERVER_IP` | DNS only (grey) for first deploy |
| A | `@` | `SERVER_IP` | DNS only (grey) — only if serving the site |

Point DNS **before** adding the domain in Dokploy, otherwise Traefik cannot
issue the Let's Encrypt certificate on the first try. After the certificate is
issued you can turn the orange cloud back on.

## 1. Postgres

Dokploy → Project → **Create Service → Database → PostgreSQL**.

- Name: `foldex-postgres`
- Database name: `foldex`
- User: `postgres`
- Password: letters and numbers only (it is interpolated into a URL)
- Deploy it.

Open the database → copy the **Internal Connection URL**. It looks like:

```
postgresql://postgres:PASSWORD@foldex-postgres-xxxx:5432/foldex
```

## 2. Redis

Dokploy → same project → **Create Service → Database → Redis**.

- Name: `foldex-redis`
- Deploy it.
- Copy the **Internal Connection URL**, for example `redis://default:PASSWORD@foldex-redis-xxxx:6379`.

BullMQ requires `noeviction`. Dokploy's Redis template normally sets it; verify
in Advanced/Command that the server runs with `--maxmemory-policy noeviction`.
For a hackathon demo the queue is tiny, so this is a low risk.

## 3. API application

Dokploy → same project → **Create Service → Application**.

**General**

- Name: `foldex-api`
- Provider: GitHub → repository `Pirate193/foldex` (or `kerry883/foldex`)
- Branch: `main`
- Build Type: **Dockerfile**
- Dockerfile Path: `apps/backend/Dockerfile`
- Docker Context Path: `.` (repository root — required, the Dockerfile copies
  the root `bun.lock` and workspace package files)
- Port: `3000`

**Environment**

Paste this into the Environment tab (replace the three placeholders):

```dotenv
DATABASE_URL=postgresql://postgres:PASSWORD@foldex-postgres-xxxx:5432/foldex
REDIS_URL=redis://default:PASSWORD@foldex-redis-xxxx:6379
RESEND_API_KEY=re_your_real_key
BETTER_AUTH_SECRET=GENERATE_A_RANDOM_32_BYTE_BASE64
BETTER_AUTH_URL=https://api.foldex.space
FRONTEND_URL=https://foldex.space
MANIM_FLASK_URL=https://foldex-renderer-777822234917.us-central1.run.app
PORT=3000
```

Notes:

- Generate `BETTER_AUTH_SECRET` on the VPS: `openssl rand -base64 32`.
- Leave `COOKIE_DOMAIN` unset. The desktop app runs on `tauri://localhost`, so
  Better Auth's `SameSite=None; Secure` cookie is correct once the API is HTTPS.
- Do not add `NODE_ENV=production` blindly; the app does not check it.

**Domain**

Domains tab → Add Domain:

- Host: `api.foldex.space`
- Service/Port: `3000`
- HTTPS: on, certificate provider Let's Encrypt

Deploy. Watch the logs for:

```
[api] migrations complete
```

Then check `https://api.foldex.space/` in a browser. It should say
`foldex backend is running !`.

## 4. Worker application

Dokploy → same project → **Create Service → Application**.

- Name: `foldex-worker`
- Same repository and branch
- Build Type: **Dockerfile**
- Dockerfile Path: `apps/backend/Dockerfile.worker`
- Docker Context Path: `.` (repository root)
- Port: `3000` (not exposed, Dokploy still asks)
- No domain, no ports.
- No command override — the worker Dockerfile already sets
  `CMD ["bun", "run", "worker"]`.

Environment: exactly the same as the API.

Deploy it **after** the API is healthy so migrations do not race. Logs should end
with:

```
[worker] foldex video worker is running
[worker] bullmq ready, waiting for jobs
```

## 5. Fix the renderer's R2 credentials

The renderer returns 500 until this is done. See `deploy/RENDERER-R2.md`.

## 6. Smoke test

1. `GET https://api.foldex.space/` → `foldex backend is running !`
2. In the desktop app, request an OTP. The email should arrive from Resend.
3. Verify the code, then generate a short video. Status should move
   `queued → generating → ready`, and the video URL should be an R2 URL.

## 7. Optional: landing page on Dokploy

Vercel is currently paused for `foldex.space`. To serve the site from the VPS:

- Create another Application `foldex-web`
- Same repo, Dockerfile Path `apps/web/Dockerfile`, Context Path `.`
- Port `3000`
- Domain `foldex.space` (and `www.foldex.space`) → port 3000
- Deploy.

Only do this after the API works. The web image is a second Bun build and is not
needed for the demo.

## Troubleshooting

**Bad Gateway / 502.** Port mismatch or the app listens on `127.0.0.1`. The API
already binds `0.0.0.0`. Confirm the Dokploy domain port is `3000`.

**Domain 404.** Compose/template domains need a redeploy after adding the domain.
Applications usually apply immediately, but redeploy if unsure.

**Certificate not issued.** DNS must point at the server before the domain is
added. Remove and re-add the domain, or restart Traefik from Dokploy.

**`api.foldex.space` shows Cloudflare error 1000.** The old record is a proxied
CNAME to a dead Render service. Delete it and add the A record from step 0.

**Videos stay `queued`.** The worker is a separate application. Check its logs;
it must share the same `REDIS_URL` and `DATABASE_URL` as the API.

**OTP email fails.** `RESEND_API_KEY` must be valid and `noreply@foldex.space`
must be a verified sender/domain in Resend. The API logs the Resend error.
