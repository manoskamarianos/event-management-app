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
| Admin | `admin` | `admin12345` |

The database comes pre-filled with demo data (about 100 users, 30 events, bookings), but the
passwords of those demo users are not known. To try the other roles, follow the flow from the
assignment:

1. Click **Sign up** and register, choosing *Organiser* or *Participant*.
2. Log in as `admin` and approve the new user under **Users**.
3. Log in as the new user.

## Configuration (optional)

Set these as environment variables, or in a `.env` file next to `docker-compose.yml`:

| Variable | Default | Meaning |
|---|---|---|
| `ADMIN_USERNAME` | `admin` | Built-in administrator's username |
| `ADMIN_PASSWORD` | `admin12345` | Its password. It is reset to this value on every start |
| `SEED_DB` | `db.sqlite3` | Database used on the **first** start. `dbs/big_db.sqlite3` is larger; `dbs/empty.sqlite3` starts with only the admin |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api` | Where the **browser** finds the API. Only change this if you serve the app from another host, and rebuild with `--build` |

## Data and resetting

Data is kept in a Docker volume, so it survives restarts. The database file inside the repo is
never modified. To wipe everything and start from the seed database again:

```bash
docker compose down -v
docker compose up --build
```

## Troubleshooting

- **`port is already allocated`**: something else is using port 3000 or 8000. Stop it, or
  change the left-hand port numbers in `docker-compose.yml` (for the backend this also needs
  `NEXT_PUBLIC_API_BASE_URL` and the backend's `CORS_ALLOWED_ORIGINS` to match).
- **Logs**: `docker compose logs backend` or `docker compose logs frontend`.

## Notes

This setup is for local demos. The backend runs Django's development server in `DEBUG` mode
with a fixed admin password, so both ports are published on `127.0.0.1` only (not reachable
from other machines) and it is not TLS-encrypted.
