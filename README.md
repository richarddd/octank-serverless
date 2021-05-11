# octank-serverless

## Getting started

1. Setup credentials
2. Install nodejs & yarn
3. Install cdk globally
4. Run `yarn` in `backend`, `frontend` & `infrastructure` folders
5. Deploy: `cd infrastructure && yarn deploy`

## Deploy frontend

    yarn deploy:fe

## Run locally

Deploy infrastructure

    cd infrastructure && yarn deploy

Install mysql server

    brew install mysql@5.7

    mysql.server start

create main database

    mysql -uroot -e "CREATE DATABASE main;"

Start frontend in one terminal

    cd frontend && yarn start

Start backend in another terminal

    cd backend && yarn start

Profit
