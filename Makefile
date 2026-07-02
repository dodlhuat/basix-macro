\
# BasixMacro — unified command entrypoint for the Nuxt frontend (repo root, npm)
# and the Laravel backend (backend/, Sail + Composer). Run `make help` to list
# targets; each recipe `cd`s into the right directory on its own, so it doesn't
# matter where your shell currently is.

BACKEND := backend

.DEFAULT_GOAL := help
.PHONY: help install up down dev build test test-backend test-all \
        lint lint-fix typecheck analyse pint pint-check migrate fresh logs check

help: ## Show this list of targets
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## ── Setup ────────────────────────────────────────────────────────────────

install: ## Install frontend + backend dependencies and start Sail
	npm install
	cd $(BACKEND) && composer install
	$(MAKE) up

## ── Backend (Sail) ──────────────────────────────────────────────────────

up: ## Start the backend containers (mariadb, mailpit, laravel.test)
	cd $(BACKEND) && ./vendor/bin/sail up -d

down: ## Stop the backend containers
	cd $(BACKEND) && ./vendor/bin/sail down

logs: ## Tail backend container logs
	cd $(BACKEND) && ./vendor/bin/sail logs -f

migrate: ## Run pending backend migrations
	cd $(BACKEND) && ./vendor/bin/sail artisan migrate

fresh: ## DESTRUCTIVE: drop and re-migrate the local backend database
	cd $(BACKEND) && ./vendor/bin/sail artisan migrate:fresh

## ── Frontend (npm) ───────────────────────────────────────────────────────

dev: ## Start the Nuxt dev server
	npm run dev

build: ## Production build of the frontend
	npm run build

## ── Quality checks ───────────────────────────────────────────────────────

test: ## Run frontend tests (Vitest)
	npm run test

test-backend: ## Run backend tests (PHPUnit via Sail)
	cd $(BACKEND) && ./vendor/bin/sail artisan test

test-all: test test-backend ## Run both frontend and backend test suites

lint: ## Lint the frontend (ESLint)
	npm run lint

lint-fix: ## Lint the frontend and auto-fix what it can
	npm run lint:fix

typecheck: ## Type-check the frontend (nuxi typecheck)
	npx nuxi typecheck

analyse: ## Static-analyse the backend (Larastan/PHPStan, writes backend/phpstan-report.txt)
	cd $(BACKEND) && composer analyse

pint: ## Format the backend (Laravel Pint, fixes in place)
	cd $(BACKEND) && ./vendor/bin/pint

pint-check: ## Check backend formatting without changing files (CI-style)
	cd $(BACKEND) && ./vendor/bin/pint --test

check: lint typecheck test pint-check analyse test-backend ## Run every check (pre-commit gate)
