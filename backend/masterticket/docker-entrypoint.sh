#!/bin/sh
# Prepares the SQLite database, then runs the given command (the dev server by default).
#
# settings.py always reads ./db.sqlite3, so the real file lives on a volume ($DATA_DIR) and
# ./db.sqlite3 is a symlink to it. That keeps the data across restarts and leaves the
# database committed in the repo untouched.
set -e

DATA_DIR="${DATA_DIR:-/data}"
SEED_DB="${SEED_DB:-db.sqlite3}"   # copied to the volume on first start only

mkdir -p "$DATA_DIR"

if [ ! -f "$DATA_DIR/db.sqlite3" ]; then
    echo "First start: seeding database from $SEED_DB"
    cp "$SEED_DB" "$DATA_DIR/db.sqlite3"
fi
ln -sf "$DATA_DIR/db.sqlite3" ./db.sqlite3

python manage.py migrate --noinput


exec "$@"
