# BotleValor — Backend Guide

This document explains how the BotleValor backend works: which Google Cloud resources it uses, how sign-in and verification work, where data and images live, how points are awarded safely, and how to run, extend and deploy it.

> **Status (16 Oct 2026):** **Deployed to Cloud Run:** <https://botlevalor-494757558938.us-central1.run.app>. Tested end to end against real Google Cloud services.
>
> **Sign-in:** Google only, for now. Email + password is **disabled** until a verified email domain is set up (§3.4).

---

## 1. Overview

The browser never talks to the database or to Gemini directly. Every request goes through the Next.js server, which checks who you are, applies the business rules, and then reads or writes Google Cloud.

```text
 Phone / browser (Next.js UI)
   │  Firebase Auth SDK  ──► Firebase Authentication (email+password, Google)
   │  ID token in "Authorization: Bearer …"
   ▼
 Next.js API routes  (src/app/api/*  →  src/server/*, server-only)
   ├─► Cloud Firestore       users, submissions, points ledger, bins, rewards
   ├─► Cloud Storage         private evidence photos · public bin/reward images
   ├─► Gemini 3.5 Flash-Lite (Agent Platform, location "global")  photo assessment
   └─► Resend                emails the 6-digit verification codes
```

The main design choices are:

- **The server decides every outcome.** The client never sets a verification status or a points amount. It only sends a photo, the selected bin, the bottle count it reports, and its GPS location.
- **Firestore is locked to browsers.** Security rules deny all direct client access. Only the server, through the Firebase Admin SDK, reads or writes data.
- **No credential files anywhere.** Locally the SDKs use your gcloud *Application Default Credentials*. On Cloud Run they will use an attached service account. No service-account JSON keys exist.

---

## 2. Google Cloud project and resources

| Item | Value |
| --- | --- |
| Account | `ecolafaek@gmail.com` |
| Project (display name / ID) | `botlevalor` / `botlevalor` (number `494757558938`) |
| Billing | Billing account `010A43-8D4D4B-037704`, Firebase **Blaze** (pay-as-you-go) plan. Credits confirmed by the owner. |
| Region | **us-central1** for Firestore and both buckets (Cloud Run will match). Gemini uses the `global` endpoint. |

| Resource | Name | Notes |
| --- | --- | --- |
| Firestore | `(default)`, Native mode, `us-central1` | **The location is permanent.** Rules deny all client access. |
| Cloud Storage | `gs://botlevalor-public` | Public-read images for bins and rewards. |
| Cloud Storage | `gs://botlevalor-uploads` | **Private** evidence photos. Public access prevention is *enforced*, and photos are **auto-deleted after 180 days**. |
| Firebase Auth | Email/Password + Google | Authorized domains: `localhost`, `botlevalor.firebaseapp.com`, `botlevalor.web.app`. |
| Firebase web app | `BotleValor Web` (`1:494757558938:web:eda9dc22e96d45e39efd23`) | Its config values are public identifiers, not secrets. |
| Agent Platform API | `aiplatform.googleapis.com` | Was already enabled. The model is `gemini-3.5-flash-lite`, on-demand (no provisioned throughput). |

| Cloud Run | Service `botlevalor`, `us-central1` | Public website and API. Details in §10b. |
| Service account | `botlevalor-run@botlevalor.iam.gserviceaccount.com` | Runtime identity with least privilege (§10b). |
| Secret Manager | `resend-api-key`, `email-code-pepper` | Read only by the runtime service account. |
| Artifact Registry | `cloud-run-source-deploy` (us-central1) | Container images, created automatically by the source deploy. |

No budget exists yet. You said you would create one in the Console. **A budget alert only notifies you; it does not cap spending.**

---

## 3. Sign-in and account verification

### 3.1 Email + password

1. `/signup` creates the account in **Firebase Authentication**, which hashes and stores the password. BotleValor never sees or stores it.
2. The server (`POST /api/auth/send-code`) creates `users/{uid}` and emails a **6-digit code** through Resend.
3. `/verify` sends the code to `POST /api/auth/verify-code`. If it's correct, the server sets `users/{uid}.emailVerified = true` and mirrors the flag onto the Firebase Auth record.
4. Until that's done, the app sends the user to `/verify`, and every protected API returns **403** (`email-not-verified`).

The code system (`src/server/email-codes.ts`) works like this:

| Rule | Value |
| --- | --- |
| Storage | Only a salted **SHA-256 hash** is stored, in `emailCodes/{uid}`, never the code itself. An optional `EMAIL_CODE_PEPPER` adds an extra secret. |
| Expiry | 10 minutes |
| Wrong attempts | 5, then the user must request a new code |
| Resend limits | 1 per minute, and 5 per hour |
| Comparison | Constant-time (`timingSafeEqual`) |
| Logging | Codes are **never** logged |
| Email not configured | If Resend isn't set up, sending fails with a clear message. There is deliberately no fallback that prints codes to the logs. |

> **Resend limitation (action needed for real users):** with the free test sender `onboarding@resend.dev`, Resend only delivers to the email that owns the Resend account (`ajitonelson7@gmail.com`). To email anyone else, verify your domain at <https://resend.com/domains> and set `EMAIL_FROM` to an address on that domain.

### 3.2 Google (currently the only sign-in method)

- "Continue with Google" / "Sign up with Google" use a popup, and fall back to a full-page redirect if the browser blocks popups.
- Google has already verified the email. The server confirms this from the signed ID token (`email_verified` with sign-in provider `google.com`), so **Google users skip the 6-digit code**.

### 3.3 Passwords

- **Forgot password:** Firebase emails a reset link itself. The page never reveals whether an account exists.
- **Change password** (Settings): the user re-enters their current password, then Firebase updates it.

### 3.4 Email + password is switched off (until a domain is verified)

Email codes can only reach real users once a Resend sending domain is verified, so email + password sign-in is **disabled** in two places:

1. **Firebase Authentication:** the Email/Password provider is **off**. Firebase itself rejects email sign-ups (`OPERATION_NOT_ALLOWED`), even outside the app.
2. **The app:** `NEXT_PUBLIC_EMAIL_PASSWORD_AUTH=false` (in `.env.production`, `.env.local` and the Cloud Run environment) does three things:
   - It hides the email and password forms. Log in and Sign up show only Google.
   - It hides "Change password" in Settings.
   - It makes `POST /api/auth/send-code` return **403**.

The code for email sign-in, the 6-digit codes and Resend is all still in place. **To turn it back on:**

1. Verify your domain at <https://resend.com/domains>, and set `EMAIL_FROM` to an address on it, for example `BotleValor <no-reply@yourdomain>`.
2. In Firebase Console → Authentication → Sign-in method, enable **Email/Password**.
3. Set `NEXT_PUBLIC_EMAIL_PASSWORD_AUTH=true` in `.env.production` and `.env.local`, then redeploy with the same flag and the new `EMAIL_FROM` (§10b). `NEXT_PUBLIC_*` values are built into the page, so a redeploy is required.

### 3.5 How the server authorizes requests

`requireUser()` in `src/server/http.ts` does the following on every protected route:

1. It reads `Authorization: Bearer <Firebase ID token>`.
2. It verifies the token with the Firebase Admin SDK. A missing or invalid token gets **401**.
3. Unless the route allows unverified users, it requires `emailVerified` in Firestore, or a trusted Google token. Otherwise it returns **403**.

The browser's route guard (`AppShell`) is for navigation only. **Security is enforced on the server.**

---

## 4. Data model (Cloud Firestore)

| Collection | Contents | Written by |
| --- | --- | --- |
| `bins/{binId}` | `name, area, description, latitude, longitude, imageUrl, supportedMaterials[], isActive, source, createdAt, updatedAt` | Seed script / future admin tool |
| `rewards/{rewardId}` | `title, subtitle, description, category, pointsRequired, status, imageUrl, popular, redemptionEnabled:false, sortOrder, createdAt, updatedAt` | Seed script / future admin tool |
| `users/{uid}` | `name, email, language, bio, city, emailVerified, emailVerifiedAt, points, bottlesRecycled, leaderboardOptOut, createdAt, updatedAt, lastSubmissionAt, submissionDay, submissionDayCount` | Server only |
| `users/{uid}/submissions/{submissionId}` | `binId, binName, binArea, material, bottleCount, bottleCountEstimated, status, points, checks[], explanation, photoPath, photoSha256, deviceLocation\|null, distanceToBinMeters, ai{ok, model, reason, confidence, error}, createdAt` | Server only |
| `users/{uid}/pointTransactions/{submissionId}` | `type:"earn", delta, reason, submissionId, createdAt` | Server only |
| `photoHashes/{sha256}` | `uid, submissionId, createdAt`. Used to reject reused photos. | Server only |
| `emailCodes/{uid}` | `hash, salt, expiresAt, attempts, lastSentAt, windowStart, sendCount` | Server only |

A few notes on this layout:

- **The points ledger is the source of truth.** `users.points` is a cached total, updated in the same transaction as the ledger entry.
- **Ledger documents use the submission ID as their document ID.** That makes it physically impossible for one submission to credit points twice.
- **Submissions are stored per user, as a subcollection.** History queries need no composite indexes, and ownership is built into the path.
- **Current data:**
  - 1 real bin: `palacio-do-governo`, "Palacio do Governo — Recycling Bin", at (-8.553293, 125.578221).
  - 17 rewards, from 500 to 3,500 points, all with redemption disabled.
  - **All mock and sample data has been removed from the app.**

Security rules (`firestore.rules`, deployed):

```text
match /{document=**} { allow read, write: if false; }
```

Verified live: an anonymous read of `rewards` and a forged write to `pointTransactions` both return **HTTP 403**.

---

## 5. Images (Cloud Storage)

| Bucket | Path | Access |
| --- | --- | --- |
| `botlevalor-public` | `bins/palacio-do-governo.jpeg`, `rewards/*.png` (17 items cut from `ilustration/rewards-item.png`) | Public read. Served to the app through `https://storage.googleapis.com/botlevalor-public/...` |
| `botlevalor-uploads` | `submissions/{uid}/{submissionId}/original.jpg` | **Private.** Only the server can read it. Owners see their own photo through `GET /api/submissions/{id}/photo`, which checks ownership. |

- **Retention:** evidence photos are deleted automatically **180 days** after upload, by a lifecycle rule on `submissions/`.
- **Upload checks:** the server only accepts real JPEG bytes (it checks the file signature), up to 6 MB.
- **No base64 in Firestore:** image bytes are never stored in Firestore.
- **Camera only:** the capture flow takes photos with the camera. There is no gallery or file-upload option.
- **Untouched originals:** the original files in `ilustration/` have not been changed.

---

## 6. API reference

All responses are JSON. Errors look like `{ "error": { "code", "message" } }`. "Verified" means signed in **and** email verified.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/bins` | Public | Bin catalogue from Firestore (cached 60 s). |
| `GET /api/rewards` | Public | Reward catalogue, sorted (cached 60 s). |
| `GET /api/leaderboard` | Public | Top 10 recyclers by points (cached 60 s). Returns **only** rank, first name + last initial, initials, points and bottles. Excludes unverified users and users who opted out; names derived from an email address show as "Recycler". |
| `GET /api/me` | Signed in | Profile, plus the latest 200 submissions and ledger entries. Creates `users/{uid}` on first call. |
| `PATCH /api/me` | Verified | Edit `name` (2–80 chars), `bio` (≤140), `language` (`en` only today), and `showOnLeaderboard` (stored as `leaderboardOptOut`). Other fields are rejected. |
| `POST /api/me/clear-location` | Verified | Removes stored device locations from your submissions. |
| `POST /api/auth/send-code` | Signed in | Emails a 6-digit code (rate-limited). |
| `POST /api/auth/verify-code` | Signed in | Checks the code and marks the email verified. |
| `POST /api/submissions` | Verified | Multipart: `photo` (JPEG) + `meta` JSON. Runs the full verification pipeline (§7). |
| `GET /api/submissions/{id}/photo` | Verified, owner | Streams the user's own private evidence photo. |

The `meta` JSON for `POST /api/submissions` is validated with zod:

```json
{
  "requestId": "uuid — idempotency key, also the submission ID",
  "binId": "palacio-do-governo",
  "bottleCount": 2,
  "location": { "latitude": -8.553293, "longitude": 125.578221, "accuracy": 8 },
  "storeLocation": true
}
```

---

## 7. Recycling verification pipeline

The pipeline lives in `src/server/submissions.ts`. Its decision rules are in `src/lib/verification-policy.ts`, which is a pure, unit-tested function.

1. **Authenticate:** the user must be verified.
2. **Idempotency:** if `requestId` already exists, the stored result is returned. The AI is not run again, and points are not awarded again.
3. **Validate the request:**
   - The photo must be a JPEG of 6 MB or less.
   - The bottle count must be between 1 and 10.
   - The bin must exist and be active.
4. **Rate limits:** at least 30 s between reports, and at most 30 reports per day.
5. **Duplicate check:** the photo's SHA-256 is checked against `photoHashes`.
6. **Store the photo privately** in `botlevalor-uploads`.
7. **Ask Gemini** (`src/server/gemini.ts`):
   - It sends one image and a neutral prompt, and asks for JSON matching a schema, with temperature 0 and a 30 s timeout.
   - The answer is validated again with zod.
   - Malformed or failed responses become `null`. **The server never silently switches to another model.**
8. **Apply the policy** below.
9. **One Firestore transaction** does all of the following:
   - re-checks the idempotency key, the rate limits and the photo hash
   - creates the submission
   - claims the photo hash
   - for a verified result, creates the ledger entry and increments `points` and `bottlesRecycled`

### 7.1 Gemini response schema

| Field | Type |
| --- | --- |
| `bottle_detected` | boolean |
| `bottle_count_estimate` | integer |
| `material` | `plastic` / `glass` / `metal` / `other` / `unknown` |
| `hand_visible` | boolean |
| `recycling_bin_visible` | boolean |
| `image_quality` | `good` / `poor` |
| `confidence` | number, 0–1 |
| `reason` | short text |
| `needs_manual_review` | boolean |

### 7.2 Decision policy

| Outcome | When | Points |
| --- | --- | --- |
| **Not verified** | Duplicate photo · more than **250 m** from the bin · no plastic bottle detected | 0 |
| **Needs review** | AI unavailable or invalid · 100–250 m from the bin · GPS accuracy worse than 100 m · no hand · no bin visible · poor image · confidence < 0.7 · model asks for review | 0 |
| **Verified** | Everything passes, within **100 m** of the bin | `min(3, min(declared, AI estimate))` |

**The points rule** lives in `src/lib/points.ts` and is the single source of truth: 1 point per bottle, with a minimum of 1 and a maximum of 3 per report. The server uses the **smaller** of the user's count and the AI's count, so a model over-counting (it once counted 10 bottles in a cage) can't inflate points.

"Needs review" and "Not verified" **never** award points. A photo is treated as *evidence*, not proof. The UI says "Evidence appears consistent", never "deposit proven".

---

## 8. Points and rewards

- **Earning:** only through the ledger and only on the server. The client cannot create ledger entries or change `points`.
- **Redemption is disabled:** `redemptionEnabled` is forced to `false` by the server, no points are ever deducted, and the "Redeem" button is disabled.
- **Reward catalogue:** 17 items from 500 to 3,500 points, all "Coming soon". No business is named or implied as a partner.
- **Contributor levels:** Beginner 0, Green Contributor 20, Eco Champion 100 and Recycle Leader 250 points (`src/lib/config.ts`).

---

## 9. Configuration and secrets

`.env.local` is git-ignored. `.env.example` lists every variable with placeholders only.

| Variable | Secret? | Purpose |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT`, `GEMINI_MODEL`, `GEMINI_LOCATION`, `GCS_PUBLIC_BUCKET`, `GCS_UPLOADS_BUCKET` | No | Server configuration |
| `NEXT_PUBLIC_FIREBASE_*` | No (public by design) | Firebase web SDK config |
| `RESEND_API_KEY` | **Yes** | Sending verification emails. Use Secret Manager in production. |
| `EMAIL_FROM` | No | Sender address (must be on a Resend-verified domain for real users) |
| `EMAIL_CODE_PEPPER` | Yes (optional) | Extra secret for code hashes |

Measures in place:

- `.gitignore` excludes `.env*` (except `.env.example`), `*.pem`, `*-key.json`, `service-account*.json` and `application_default_credentials.json`.
- **Checked:** the browser bundle (`.next/static`) contains no API keys, private keys or server bucket names.
- Every server module imports `server-only`, so it can't be bundled into client code by accident.
- Server logs contain sanitized messages only: no request bodies, tokens, codes or images.

---

## 10. Running locally

```bash
gcloud config set project botlevalor
gcloud auth application-default login     # sign in as ecolafaek@gmail.com in the browser
npm install
cp .env.example .env.local                # then fill in values; never commit it
npm run dev                               # http://localhost:3000
```

- **Testing the camera flow:** use a phone on HTTPS, or Chrome DevTools device emulation on `localhost`. The camera needs a secure context.
- **Changing the catalogue:** edit `scripts/seed-data/bins.json` or `rewards.json`, and put any new images in `scripts/seed-data/images/` (referenced by `imagePath`). Then run `npm run seed`. The seed uploads the images to `GCS_PUBLIC_BUCKET` and upserts documents by ID, and it is safe to re-run.
- **Adding a real bin:** double-check that latitude (negative for Dili) comes before longitude.

---

## 10b. Cloud Run deployment

| Setting | Value |
| --- | --- |
| URL | <https://botlevalor-494757558938.us-central1.run.app> |
| Region | `us-central1` (same as Firestore and Storage) |
| Size | 1 vCPU, 1 GiB, gen2, CPU only during requests (`--cpu-throttling`) |
| Scaling | `min-instances=0` (scales to zero, so it costs nothing when idle) and `max-instances=3` (cost guard) |
| Requests | concurrency 40, timeout 60 s (one verification takes ~11 s) |
| Access | Public website (`--allow-unauthenticated`). APIs enforce their own authentication. |
| Identity | `botlevalor-run@…`, with **no** keys downloaded |
| Secrets | `RESEND_API_KEY`, `EMAIL_CODE_PEPPER` from Secret Manager at runtime |

**Runtime service account permissions (least privilege):**

| Role | Scope | Why |
| --- | --- | --- |
| `roles/datastore.user` | Project | Read and write Firestore |
| `roles/aiplatform.user` | Project | Call Gemini |
| `roles/storage.objectAdmin` | **Only** `gs://botlevalor-uploads` | Store and read evidence photos |
| `roles/secretmanager.secretAccessor` | **Only** the two secrets | Read the Resend key and pepper |

It has no Firebase Auth admin role. Mirroring "email verified" onto the Auth record is best-effort, and Firestore remains the source of truth.

**Build:**
- The `Dockerfile` builds Next.js in `standalone` mode on `node:22-slim` and runs as the non-root `node` user.
- `.gcloudignore` keeps `.env.local`, `node_modules`, `ilustration/` and the docs out of the upload.
- `.env.production` holds only the **public** Firebase web config, which the build needs.

The deployed domain was added to the Firebase **authorized domains**, so Google sign-in works there.

**Redeploy** after code changes. For a generic version with variables that anyone can use for their own project, see the README section "Deploy your own copy to Google Cloud Run".

```bash
gcloud run deploy botlevalor --source . --project=botlevalor --region=us-central1 \
  --service-account=botlevalor-run@botlevalor.iam.gserviceaccount.com --allow-unauthenticated \
  --port=8080 --cpu=1 --memory=1Gi --concurrency=40 --timeout=60 \
  --min-instances=0 --max-instances=3 --cpu-throttling --execution-environment=gen2 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=botlevalor,GEMINI_MODEL=gemini-3.5-flash-lite,GEMINI_LOCATION=global,GCS_PUBLIC_BUCKET=botlevalor-public,GCS_UPLOADS_BUCKET=botlevalor-uploads,EMAIL_FROM=BotleValor <onboarding@resend.dev>,NEXT_PUBLIC_EMAIL_PASSWORD_AUTH=false" \
  --set-secrets="RESEND_API_KEY=resend-api-key:latest,EMAIL_CODE_PEPPER=email-code-pepper:latest"
```

**Deployed checks (16 Oct 2026):**
- All 11 pages return 200.
- `/api/bins` and `/api/rewards` serve live Firestore data through the service account.
- Protected APIs return **401** without a token or with a forged one.
- `send-code` returns **403** while email sign-in is off.
- Reward images load from Cloud Storage through the image optimizer.
- The `X-Powered-By` header is removed.
- There are **no** server errors in Cloud Logging and **no** browser console errors.

## 11. What was tested

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run typecheck`, `npm run build` | Pass |
| `npm test` (Vitest) | **13 tests pass**: points cap and every verification-policy path |
| Gemini text and image smoke tests | Pass: real `gemini-3.5-flash-lite` responses with valid JSON |
| Firestore rules | Anonymous read and forged ledger write → **403** |
| Protected APIs without or with a forged token | All **401** |
| Email/password sign-up | Account created, code generated and sent to Resend (delivery limited by the test sender, see §3.1) |
| Google sign-in | Working; the account was auto-verified |
| Real submission by the owner | Photo stored privately, Gemini assessed it, device ~4 km away → **Not verified, 0 points, no ledger entry** (correct) |
| Unverified account submits | **403** |
| Same `requestId` sent twice | Same result, **no second AI call, no second award** |
| New report within 30 s | **429** |
| Same photo, new request | Rejected as a **duplicate** |
| Test account cleanup | Test user, documents and photos deleted |

The test above did not produce a **verified** result live, because none of the available photos shows a hand depositing a bottle at the bin. That path is covered by the unit tests. Do one real check at the Palacio do Governo bin before launch.

---

## 12. Costs to watch

| Service | What drives cost |
| --- | --- |
| Gemini | **≈ 1,710 tokens per verification** (1,600 input incl. 1,064 for the photo, ~110 output, no thinking) **≈ $0.00076**, about $0.76 per 1,000. See the cost table in README.md. Actual usage is stored on each submission (`ai.usage`). |
| Firestore | Reads and writes per page load and submission; small at this scale. |
| Cloud Storage | Storage plus downloads. Photos expire after 180 days. |
| Cloud Run | Charged per request and CPU time. Scales to zero when idle, with at most 3 instances. |
| Artifact Registry / Cloud Build | Container image storage and build minutes for each deploy. Delete old images occasionally. |
| Resend | Free tier is about 3,000 emails per month. |

Check **Billing → Reports** regularly. Credit eligibility varies by product.

---

## 13. Known limitations and next steps

1. ~~Deploy to Cloud Run~~ **Done** (§10b). A custom domain (e.g. `botlevalor.tl`) can be mapped later. Add it to the Firebase authorized domains when you do.
2. **Verify a Resend domain**, then re-enable email + password sign-in (§3.4).
3. **Manual review tool:** "Needs review" submissions currently wait with no reviewer screen. A protected admin or review workflow is needed to approve them, and approval should award points through the same ledger transaction.
4. **GPS can be spoofed:** the phone reports its own location. The duplicate-photo check, the AI's bin check and the rate limits reduce abuse, but stronger checks may be needed later.
5. **Missing account features:** in-app account deletion and email change aren't implemented yet. The UI says so honestly.
6. **Reward redemption** remains disabled until a secure redemption workflow and real partners are approved.
7. **Other languages:** only English is available; Tetun, Português and Bahasa Indonesia are listed as "coming soon".

---

## 14. File map

```text
src/server/                 server-only backend
  env.ts                    configuration (no credentials)
  firebase-admin.ts         Admin SDK (ADC / Cloud Run identity)
  http.ts                   requireUser(), error handling
  users.ts                  users/{uid} profile, cached totals
  catalog.ts                bins + rewards
  email.ts, email-codes.ts  Resend + 6-digit codes
  gemini.ts                 Gemini client + response schema
  storage.ts                private photo storage
  submissions.ts            verification pipeline + ledger transaction
src/lib/verification-policy.ts   decision rules (pure, tested)
src/lib/points.ts                points rule (1–3 per report)
src/lib/firebase/                web Auth client + auth actions
src/lib/api/client.ts            authenticated fetch helper
src/lib/data/catalog.ts          bins/rewards client cache
src/lib/store/app-store.ts       signed-in user state
src/app/api/**                   route handlers (§6)
firestore.rules                  deny-all client rules (deployed)
scripts/seed-firestore.mjs       catalogue seeding (+ seed-data/*.json)
```
