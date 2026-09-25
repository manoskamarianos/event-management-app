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

# The spec requires a built-in administrator. Create it, or reset its password, on every start.
if [ -n "$ADMIN_PASSWORD" ]; then
    python manage.py shell -c "
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ.get('ADMIN_USERNAME', 'admin')
admin, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': os.environ.get('ADMIN_EMAIL', 'admin@example.com'),
        'first_name': 'Admin', 'last_name': 'Admin',
        'telephone': '0', 'address': '-', 'taxNumber': '0', 'postcode': 0,
    },
)
admin.role = 'admin'
admin.approved = True
admin.is_staff = True
admin.is_superuser = True
admin.set_password(os.environ['ADMIN_PASSWORD'])
admin.save()
print(('Created' if created else 'Updated') + ' admin user: ' + username)
"
fi

exec "$@"
