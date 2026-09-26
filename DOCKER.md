# Running EventHub with Docker

Everything (Next.js frontend + Django backend) starts with one command. The only thing you
need installed is **Docker** with Compose (Docker Desktop on Windows/macOS, or Docker Engine
on Linux). No Python, Node or database setup.

## Start

```bash
docker compose up --build
```

The first run takes a few minutes (it downloads images and builds). Wait until you see the
frontend say `Ready`, then open:

| | |
|---|---|
| **Site** | http://localhost:3000 |
| **API** | http://localhost:8000/api |

Stop with `Ctrl+C`. Start again later with `docker compose up` (no `--build` needed unless the
code changed).

## Logging in

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `adminpassword123` |

The administrator is created by the backend itself (`backend/masterticket/users/migrations/0003_admin.py`),
so its password can only be changed there, not from Docker.

The database comes pre-filled with demo data (about 5,000 users, 1,000 events and 24,750
bookings), but the passwords of those demo users are not known. To try the other roles,
follow the flow from the assignment:

1. Click **Sign up** and register, choosing *Organiser* or *Participant*.
2. Log in as `admin` and approve the new user under **Users**.
3. Log in as the new user.

## Configuration (optional)

Set these as environment variables, or in a `.env` file next to `docker-compose.yml`:

| Variable | Default | Meaning |
|---|---|---|
| `SEED_DB` | `db.sqlite3` | Database used on the **first** start: `db.sqlite3` (about 5,000 users, 1,000 events), `dbs/db.sqlite3` (about 100 users, 30 events) or `dbs/empty.sqlite3` (only the admin). The admin login above works with all of them |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api` | Where the **browser** finds the API. Only change this if you serve the app from another host, and rebuild with `--build` |

## Data and resetting

Data is kept in a Docker volume, so it survives restarts. The database file inside the repo is
never modified. The seed database is only copied into the volume on the very first start, so
after updating the code (for example a new seed database) or to choose another `SEED_DB`, wipe
the volume and start again:

```bash
docker compose down -v
docker compose up --build
```

## Troubleshooting

- **`port is already allocated`**: something else is using port 3000 or 8000. Stop it, or
  change the left-hand port numbers in `docker-compose.yml` (for the backend this also needs
  `NEXT_PUBLIC_API_BASE_URL` and the backend's `CORS_ALLOWED_ORIGINS` to match).
- **Admin login fails** (`admin12345` was the password in older versions of this file): the
  password is `adminpassword123`. If it still fails, the volume holds an old database, so run
  `docker compose down -v` and start again.
- **Exporting events (Users page) takes about a minute** with the default data: the export
  makes one request per event to include its bookings, and shows its progress while it runs.
  With `SEED_DB=dbs/db.sqlite3` (30 events) it should take only a few seconds.
- **Logs**: `docker compose logs backend` or `docker compose logs frontend`.

## Notes

This setup is for local demos. The backend runs Django's development server in `DEBUG` mode
with a fixed admin password, so both ports are published on `127.0.0.1` only (not reachable
from other machines) and it is not TLS-encrypted.
