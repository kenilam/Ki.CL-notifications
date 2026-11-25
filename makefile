# The dev server's port, from .env; whatever already holds it is stopped first.
DEV_PORT := $(or $(shell grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2),3400)

build:
	@echo ⌛ building...
	yarn run build
	@echo done

install:
	@echo ⌛ installing...
	yarn
	@echo done

lint:
	@echo ⌛ linting...
	yarn run lint
	@echo done

run:
	@scripts/free-port.sh $(DEV_PORT)
	@echo ⌛ running development...
	yarn run development

run.production:
	@scripts/free-port.sh $(DEV_PORT)
	@echo ⌛ running production...
	yarn run production

run.server:
	@echo ⌛ running the server...
	yarn run server

start:
	@echo ⌛ starting...
	@test -f .env || cp .env.template .env
	yarn install
	@$(MAKE) run

typecheck:
	@echo ⌛ type checking...
	yarn run typecheck
	@echo done

types:
	@echo ⌛ fetching remote types...
	yarn run types
	@echo done

# A record for a local gateway's registry: `make registry.local DIR=../Ki.CL-api/.registry-local`.
registry.local:
	@mkdir -p $(DIR)/services
	@yarn run registry record http://localhost:3401/api > $(DIR)/services/notifications.json
	@echo "wrote $(DIR)/services/notifications.json"
