.PHONY: dev start install db-up db-down db-reset db-migrate db-seed build prod-up prod-down

SHELL := /bin/bash

# ── Développement (hot-reload) ────────────────────────────────────────────
dev:
	$(MAKE) db-up
	@echo "Waiting for PostgreSQL..."
	@sleep 3
	cd backend && npx prisma migrate deploy
	@trap 'kill 0' INT; \
		(cd backend && npm run dev) & \
		(cd frontend && npm run dev) & \
		wait

# ── Production locale (rebuild complet puis démarrage des 2) ─────────────
start:
	$(MAKE) db-up
	@echo "Waiting for PostgreSQL..."
	@sleep 3
	@echo "==> Migration DB..."
	cd backend && npx prisma migrate dev --name auto
	@echo "==> Génération client Prisma..."
	cd backend && npx prisma generate
	@echo "==> Build backend..."
	cd backend && npm run build
	@echo "==> Build frontend..."
	cd frontend && npm run build
	@echo "==> Démarrage..."
	@trap 'kill 0' INT; \
		(cd backend && npm run start) & \
		(cd frontend && npm run start) & \
		wait

# ── Démarrage uniquement la DB (dev local) ────────────────────────────────
db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

db-reset:
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.dev.yml up -d

# ── Base de données ───────────────────────────────────────────────────────
db-migrate:
	cd backend && npm run db:migrate

db-seed:
	cd backend && npm run db:seed

db-studio:
	cd backend && npm run db:studio

# ── Installation des dépendances ──────────────────────────────────────────
install:
	cd frontend && npm install
	cd backend && npm install

# ── Production Docker ─────────────────────────────────────────────────────
build:
	docker compose build

prod-up:
	docker compose up -d

prod-down:
	docker compose down

logs:
	docker compose logs -f
