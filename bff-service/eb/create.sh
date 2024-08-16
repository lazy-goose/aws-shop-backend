#!/bin/sh -e

ENV_NAME="${1:-lazy-goose-bff-api-develop}"

envvars() {
    cat "`dirname -- $0`/../.env" |
        sed '/^[[:space:]]*$/d' | sed '/^[[:space:]]*#/d' |
        grep -e 'REDIRECT_*' |
        tr '\n' ',' | sed 's/,$//'
}

eb create --cname "$ENV_NAME" --single --envvars "`envvars`" "$ENV_NAME"
