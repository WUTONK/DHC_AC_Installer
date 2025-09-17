#!/bin/bash

rm -fr tmp

mkdir -p tmp

rm -fr src/api

openapi-generator-cli generate \
    -i DHC_AC_Installer.openapi.json \
    -g typescript-fetch \
    -o ./tmp \
    --additional-properties=supportsES6=true,npmName=@wuton/api-client,typescriptThreePlus=true

mv tmp/src src/api
