.PHONY: dev install db-up db-down db-migrate db-seed build prod-up prod-down

# ── Développement sans Docker ──────────────────────────────────────────────
dev:
	make db-up
	@echo "Waiting for PostgreSQL..."
	@sleep 2
	cd backend && npm run db:migrate && cd ..
	@trap 'kill 0' SIGINT; \
		(cd backend && npm run dev) & \
		(cd frontend && npm run dev) & \
		wait

# ── Démarrage uniquement la DB (dev local) ────────────────────────────────
db-up:
	docker compose -f docker-compose.dev.yml up -d

db-down:
	docker compose -f docker-compose.dev.yml down

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
