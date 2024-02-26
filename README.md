# PDF Processing App

This application processes PDF files by sending them to an Excelifier API and then fetching and saving the results as JSON files.

## Configuration

Create a `.env` file in the root directory (or duplicate `.env.example`) with the following variables:

```plaintext
DIR_IN=./data_in
DIR_OUT=./data_out
BEARER_TOKEN=your_bearer_token_from_excelifier
NOTIFY_EMAIL=optional_email_address@example.com
PROCESS_INTERVAL=10000
```

## Running with node/yarn

Install packages:

```
yarn
```

Then start in dev mode:
```
yarn dev
```

Or build and start:
```
yarn build
yarn start
```


# Building docker image

```sh
docker build -t excelifier-batch-processer .
```

## Running docker container

```sh
docker run --name excelifier-batch-processer \
  -v ${PWD}/data_in:/app/data_in \
  -v ${PWD}/data_out:/app/data_out \
  -e DIR_IN=/app/data_in \
  -e DIR_OUT=/app/data_out \
  -e BEARER_TOKEN=your_bearer_token_from_excelifier \
  -e PROCESS_INTERVAL=10000 \
  excelifier-batch-processer
```


# Building and running with `docker-compose`

First, modify `docker-compose.yml` to include your Excelifier token and then

```
docker-compose up -d
```