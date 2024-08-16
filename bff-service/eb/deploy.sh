#!/bin/sh -e

ENV_NAME="${1:-lazy-goose-bff-api-develop}"

eb deploy "$ENV_NAME"
