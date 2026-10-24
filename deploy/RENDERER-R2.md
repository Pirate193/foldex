# Updating the Cloud Run renderer's R2 credentials

The renderer is healthy but returns HTTP 500 on `/generate-video` because the R2
keys expired. Rendering itself is fine; the upload fails.

## 1. Create a new R2 token

Cloudflare dashboard → **R2** → **Manage R2 API Tokens** → **Create API token**.

- Name: `foldex-renderer`
- Permissions: **Object Read & Write**
- Specify bucket: the foldex video bucket
- TTL: leave default (or set a long expiry)

Copy the **Access Key ID** and **Secret Access Key**. The secret is shown once.

You also need, from R2 → bucket → Settings:

- `R2_ACCOUNT_ID` — Cloudflare account ID (R2 overview page)
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` — the bucket's public `r2.dev` or custom domain URL, no trailing slash

## 2. Update the Cloud Run service

Google Cloud console → **Cloud Run** → `foldex-renderer` → **Edit & deploy new
revision** → **Variables & secrets**.

Update:

| Variable | Value |
|---|---|
| `R2_ACCOUNT_ID` | unchanged (verify) |
| `R2_ACCESS_KEY_ID` | new access key |
| `R2_SECRET_ACCESS_KEY` | new secret key |
| `R2_BUCKET_NAME` | unchanged (verify) |
| `R2_PUBLIC_URL` | unchanged (verify, no trailing slash) |

Keep the existing `GOOGLE_CREDENTIALS_JSON` / TTS variables if voiceover is used.

Recommended runtime settings for the demo:

- Memory: 4 GiB
- CPU: 2
- Request timeout: 1800 seconds
- Container concurrency: 1
- Minimum instances: **1 during the demo** (avoids a cold start on stage), then
  back to 0 afterwards
- Maximum instances: 2 (prevents a runaway bill if the URL is abused)

Deploy the revision and wait for it to become healthy.

## 3. Verify

`GET /health` → `{"status":"ok"}` is not enough; it does not touch R2.

Run a real render from the repo root:

```bash
curl -X POST https://foldex-renderer-777822234917.us-central1.run.app/generate-video \
  -H "Content-Type: application/json" \
  -d '{"code":"from manim import *\nclass Demo(Scene):\n    def construct(self):\n        self.play(Create(Circle()))\n","transcript":"","scene_name":"SmokeTest","quality":"low_quality"}'
```

A 200 response contains `video_url` and `thumbnail_url` on your public R2 domain.
Open the URL in a browser. If you get a 500, the response includes the boto3
error (usually `InvalidAccessKeyId` or `SignatureDoesNotMatch`).

## 4. Lock down spend

The renderer is a public URL with no auth, and each request costs CPU. For the
hackathon this is acceptable. After the demo:

- Set minimum instances back to 0.
- Optionally require a shared secret header from the worker (`WORKER_TOKEN`) and
  reject requests without it. Not required for the demo.
