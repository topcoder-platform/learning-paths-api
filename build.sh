#!/bin/bash
set -eo pipefail
APP_NAME=$1

docker-compose -f docker/docker-compose.yml build "$APP_NAME"
