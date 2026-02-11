.PHONY: install dev lint test build

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
