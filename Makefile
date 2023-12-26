PROJECT = hexancore-typeorm

up:
	docker compose -p $(PROJECT) --env-file ./docker/.env up -d --wait --wait-timeout 5

down:
	docker compose -p $(PROJECT) down -t 2
