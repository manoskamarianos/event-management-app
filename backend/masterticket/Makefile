PYTHON ?= python3
VENV ?= .venv
MANAGE ?= $(VENV)/bin/python manage.py

DB_OPTION ?= e
DB ?= dbs/empty.sqlite3

ifeq ($(DB_OPTION), big)
	DB= dbs/big_db.sqlite3
else ifeq ($(DB_OPTION), db)
	DB= dbs/db.sqlite3
else ifeq ($(DB_OPTION), e)
	DB= dbs/empty.sqlite3
endif

venv: 
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -r requirements.txt

setup: venv 
	
db: setup 
	cp $(DB) ./db.sqlite3
	$(MANAGE) makemigrations
	$(MANAGE) migrate
train: db
	$(MANAGE) Full_Matrix_Factorization
run: train
	$(MANAGE) runserver 
just_run:
	$(MANAGE) runserver 