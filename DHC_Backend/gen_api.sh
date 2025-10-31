#!/bin/bash

rm -fr tmp

mkdir -p tmp

# API 模型文件存储在 apiModels
rm -fr apiModels

openapi-generator-cli generate \
    -i DHC_AC_Installer.openapi.json \
    -g go-gin-server \
    -o ./tmp \
    --additional-properties=packageName=apiModels \
    --global-property models,modelDocs=false \
    --skip-validate-spec

mv tmp/go apiModels