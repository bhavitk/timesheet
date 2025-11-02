#!/usr/bin/env bash
set -euo pipefail

IMAGE_NAME="timesheet:latest"
CONTAINER_NAME="timesheet-app"

echo "Building Docker image: $IMAGE_NAME"
# Pass build-arg so frontend gets correct NEXT_PUBLIC_GRAPHQL_URL; default is /graphql
docker build --build-arg NEXT_PUBLIC_GRAPHQL_URL=/graphql -t "$IMAGE_NAME" .

echo "Stopping and removing any existing container named $CONTAINER_NAME"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Use backend/.env if present
ENV_FILE="./backend/.env"
ENV_OPT=""
if [ -f "$ENV_FILE" ]; then
  echo "Found env file: $ENV_FILE"
  ENV_OPT="--env-file $ENV_FILE"
else
  echo "No $ENV_FILE found; you can pass envs with --env-file or docker run -e ..."
fi

echo "Running container $CONTAINER_NAME (exposing only port 3000)"
docker run -d \
  --name "$CONTAINER_NAME" \
  --add-host=host.docker.internal:host-gateway \
  -p 3000:3000 \
  $ENV_OPT \
  "$IMAGE_NAME"

echo "Container started. To follow logs: docker logs -f $CONTAINER_NAME"
