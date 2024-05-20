#!/bin/bash
export ENV_PATH="./packages/backend/.env.production"

CONTAINER_NAME=monitoraea-pppzcm
IMAGE_NAME=$CONTAINER_NAME-image:2.0.0
PORT=4006
VIRTUAL_HOST=pppzcm.monitoraea.org.br
VIRTUAL_PORT=$PORT
LETSENCRYPT_HOST=$VIRTUAL_HOST
LETSENCRYPT_EMAIL="ricardo@engajados.com.br"

docker rm -f $CONTAINER_NAME

docker run \
    --detach \
    --restart always \
    --name $CONTAINER_NAME \
    --publish $PORT \
    --env-file $ENV_PATH \
    --env VIRTUAL_HOST=$VIRTUAL_HOST \
    --env VIRTUAL_PORT=$VIRTUAL_PORT \
    --env LETSENCRYPT_HOST=$LETSENCRYPT_HOST \
    --env LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL \
    $IMAGE_NAME
