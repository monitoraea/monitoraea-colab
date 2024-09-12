#!/bin/bash
export ENV_PATH="./packages/backend/.env.production"

CONTAINER_NAME=monitoraea-colab
IMAGE_NAME=$CONTAINER_NAME-image:1.0.0
PORT=4006
VIRTUAL_HOST=teste.monitoraea.org.br
VIRTUAL_PORT=$PORT
LETSENCRYPT_HOST=$VIRTUAL_HOST
LETSENCRYPT_EMAIL="ricardo@digitao.com.br"

docker rm -f $CONTAINER_NAME
docker image rm $IMAGE_NAME

docker build \
    --tag $IMAGE_NAME \
    --compress \
    --force-rm \
    --no-cache \
    .

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
