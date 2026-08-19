# FitWise

A privacy-first fitness platform: deterministic fitness calculations, rule-based (non-AI) recommendations,
weight progress tracking, and a verified-coach marketplace where **users control exactly what a coach can see,
field by field, enforced on the backend.**

---

## ⚠️ Read this first: how this build was verified

This project was built in a sandboxed environment **with no outbound network access** — `pip` and `npm` both
returned `403` against their registries, and neither Django nor any frontend build tooling (Vite, Tailwind,
React Router, Axios, etc.) was pre-installed. That means the full stack could not actually be `pip install`'d,
`npm install`'d, or run end-to-end inside that environment. Rather than skip verification or claim untested code
was tested, here's exactly what was and wasn't done:

**Actually executed, with real output:**
- The entire calculation engine (`backend/fitness/services/calculations.py`) and recommendation engine
  (`backend/fitness/services/recommendations.py`) are plain, dependency-free Python — they were run with
  `python3 -m unittest` for real. All 48 tests pass, including an exact match against this project's reference
  profile (Male, 25, 175cm, 70kg, moderate activity, goal=lose → BMI 22.9, BMR 1673.75, TDEE 2594, target 2094).
- Every one of the 68 backend `.py` files was byte-compiled (`py_compile`) to catch syntax errors.
- Every one of the 50 frontend `.jsx`/`.js` files was parsed with `esbuild` (found locally) — first per-file,
  then bundled from `main.jsx` with all npm packages marked external, which resolves and validates every local
  import/export across the whole app in one pass. Zero errors.
- Every frontend `services/*.js` API call path was cross-checked by hand against every backend `urls.py` — all
  24 match exactly.
- Every `reverse("name")` call in the Django tests was cross-checked against every `urls.py` `name=` — all match.

**Not executed (requires installing Django/Node packages, which this sandbox couldn't do):**
- No live Django server was run. No `python manage.py migrate` / `test` / `runserver` actually executed.
- No `npm install` / `npm run build` / `npm run dev` actually executed.
- The 116 Django `APITestCase` tests (auth, calculations API, permission enforcement, coach workflow,
  messaging) are written and ready, but have not themselves been run by an interpreter — only reviewed by hand
  and cross-checked as above.

**What this means for you:** the code is complete and was reviewed carefully, but the very first thing you
should do after installing dependencies is run the test suites below — they're real, meaningful tests, not
placeholders, and they'll catch anything that slipped through manual review.

---

## What FitWise does

- **Fitness profile → real numbers.** BMI, BMR (Mifflin-St Jeor), TDEE, and a safety-bounded daily calorie
  target, computed once on the backend and never recalculated on the frontend.
- **Deterministic recommendations, no AI.** A explicit, ordered rule engine (`fitness/services/recommendations.py`)
  turns your profile into nutrition/activity/hydration/safety guidance. Same input → same output, always.
- **Progress tracking.** Log weight over time, see a trend, delete mistakes.
- **Verified coach directory.** Users apply to become coaches; only admin-approved, active coaches are listed.
- **Connections.** A user requests a coach; the coach accepts or declines; either side can disconnect.
- **Granular, private-by-default permissions.** Ten categories (basic profile, height, weight, weight history,
  BMI, activity level, goal, calorie target, BMR/TDEE, progress trend) — every one defaults to **off**, and the
  backend — not just the UI — enforces exactly what a coach's API responses contain.
- **Messaging.** Simple polling-based chat, available only while a connection is active.

FitWise deliberately contains **no AI/LLM calls anywhere** — every calculation and recommendation is
deterministic and traceable to a formula or rule in the source.

---

## Technology stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, React Router 6, Tailwind CSS, Axios, Recharts |
| Backend | Django 5, Django REST Framework, Simple JWT |
| Database | SQLite (dev) — structured so PostgreSQL is a config change, not a rewrite |
| Auth | JWT (access + rotating/blacklisted refresh tokens) |

---

## Project structure

```
fitwise/
├── backend/
│   ├── fitwise/            # settings, root urls, wsgi/asgi
│   ├── core/                # shared pagination, exception handler, base model/permissions
│   ├── accounts/            # custom User model (email login), register/login/logout/me
│   ├── fitness/             # FitnessProfile, WeightEntry, calculation + recommendation engines
│   ├── coaching/            # CoachApplication, CoachProfile, CoachConnection, CoachDataPermission
│   ├── chat/                # Conversation, Message  (named "chat" to avoid clashing with
│   │                         #  django.contrib.messages)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/      # ui/ primitives, layout/ shells, FitnessProfileForm
    │   ├── pages/            # public/, onboarding/, app/, coach/
    │   ├── services/         # one file per API resource, all HTTP lives here
    │   ├── context/          # AuthContext, ThemeContext
    │   ├── hooks/             # usePolling, useDebouncedValue
    │   └── utils/             # formatters, shared constants
    ├── package.json
    └── .env.example
```

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 20+
- (Optional, for later) PostgreSQL 14+

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # defaults work as-is for local dev

python manage.py makemigrations  # generates migrations from the models (none are pre-committed —
                                  # see "Known limitations" below)
python manage.py migrate
python manage.py createsuperuser # for /admin/ access — this is how you approve coaches
python manage.py runserver
```

The API is now at `http://localhost:8000/api/`, and Django admin at `http://localhost:8000/admin/`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # defaults to http://localhost:8000/api
npm run dev
```

The app is now at `http://localhost:5173`.

---

## Running the tests

```bash
cd backend
source .venv/bin/activate
python manage.py test                      # all 116 tests
python manage.py test coaching             # just the coaching app (permission enforcement etc.)
python manage.py test fitness.tests.test_calculations   # the pure calculation engine tests
```

```bash
cd frontend
npm run build                              # production build — also the strongest available sanity check
npm run lint                               # ESLint
```

---

## Environment configuration

See `backend/.env.example` and `frontend/.env.example`. Nothing sensitive is committed — `.env` is git-ignored
in both projects. Key backend variables:

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Required, must be changed before any non-local deployment |
| `DJANGO_DEBUG` | `True` for local dev |
| `DB_ENGINE` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Switch to PostgreSQL by setting `DB_ENGINE=django.db.backends.postgresql` and filling in the rest — no other code changes needed |
| `CORS_ALLOWED_ORIGINS` | Must include your frontend's origin |

## Admin setup & approving coaches

1. `python manage.py createsuperuser`, log in at `/admin/`.
2. A user applies to coach from the app (**Settings → Apply to become a coach**), creating a `CoachApplication`
   with status `pending`.
3. In `/admin/coaching/coachapplication/`, select the application(s) and run the **"Approve selected
   applications"** action. This creates/activates their `CoachProfile`, flips `User.is_coach = True`, and makes
   them visible in the public directory — all in one transaction (`coaching/services.py`).
4. **"Reject selected applications"** does the reverse; set the `rejection_reason` field on a row first if you
   want the applicant to see why.

There is no separate custom admin panel — this project deliberately reuses Django's built-in admin per the
project brief.

## Demo data

No demo/seed data is included (the brief asks for no hard-coded, fake, or placeholder data in the running
app). Create your own accounts via **Register**, and use the Django admin flow above to approve a coach.

---

## Architecture notes

- **Calculation engine is the single source of truth.** The frontend never computes BMI/BMR/TDEE itself — it
  only displays what `GET /api/health/calculations/` returns. See `backend/fitness/services/calculations.py`
  for the full formula documentation and safety-limit rationale.
- **Recommendation engine is a flat, ordered rule list**, not a decision tree or ML model — see
  `backend/fitness/services/recommendations.py`. Adding a rule is adding one `Rule(...)` entry; nothing else
  changes.
- **Permission enforcement lives entirely in the backend.** `coaching/views.py:ClientDataView` builds its
  response by checking each `CoachDataPermission` boolean and only including that key if granted — an
  unauthorized field is never present in the payload, not just hidden by the frontend. See
  `coaching/tests/test_connections.py` for the enforcement test suite (granting one field doesn't leak
  adjacent ones, revoking is immediate, disconnected coaches lose all access, etc.).
- **Messaging is polling-based** (a `usePolling` hook, 4s while a conversation is open / 8s for the inbox), per
  the project brief's explicit preference for V1 over WebSockets.
- **A coach is still a normal User.** There's no separate role enum — `is_coach` is a boolean set only via the
  admin-approval workflow, and every normal-user feature keeps working for coaches.

## Known limitations & scope decisions

- **Migrations are not pre-generated.** Since Django couldn't be run in the build environment, migration files
  (which Django normally auto-generates and are easy to get subtly wrong by hand) are intentionally left for
  you to generate with `makemigrations` as the first setup step, rather than risk shipping incorrect ones.
- **Disconnecting a coach connection is final for that connection record.** Reconnecting creates a new
  `CoachConnection` (and therefore a fresh, empty conversation) rather than resuming history — a deliberate
  simplification documented in `coaching/services.py`.
- **No file storage backend configured** beyond local disk (`MEDIA_ROOT`) for coach profile photos — fine for
  development, but plug in S3/GCS (or similar) before any real deployment.
- **No rate limiting beyond auth endpoints** (`ScopedRateThrottle` on register/login). Add broader throttling
  before production use.
- **Gender "other" in BMR** uses a documented average of the Mifflin-St Jeor male/female offsets, since the
  formula itself only has male/female terms — see the comment in `calculations.py`.

## Future roadmap

- Body measurements, workout logging, and meal/water tracking (the data model is intentionally structured so
  these can be added as new apps without touching `fitness`, `coaching`, or `chat`).
- Push/email notifications for new messages and connection requests.
- PostgreSQL + S3 production deployment configuration.
- Multi-coach comparison / coach reviews.
