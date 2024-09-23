#!/bin/sh
echo "############### Deleting latest containers ###############"
docker compose -f docker-compose.dev.yaml down

echo "############### Docker Build ###############"
docker compose -f docker-compose.dev.yaml build

echo "############### Docker Run ###############"
docker compose -f docker-compose.dev.yaml up -d 