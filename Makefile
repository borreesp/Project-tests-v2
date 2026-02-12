.PHONY: install dev lint test build test-backend-integration test-backend-unit test-backend

install:
	pnpm install

dev:
	pnpm turbo run dev

lint:
	pnpm turbo run lint

test:
	pnpm turbo run test

build:
	pnpm turbo run build

test-backend-unit:
	cd backend && poetry run pytest -m unit

test-backend-integration:
	docker compose -f docker-compose.test.yml up -d db_test
	cd backend && TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/app_test poetry run pytest -m integration
	docker compose -f docker-compose.test.yml down -v

test-backend:
	cd backend && poetry run pytest
