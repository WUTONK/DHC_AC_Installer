#!/bin/bash

rm -fr tmp

mkdir -p tmp

# API 模型文件存储在 models
rm -fr models

openapi-generator-cli generate \
    -i DHC_AC_Installer.openapi.json.openapi.json \
    -g go-gin-server \
    -o ./tmp \
    --additional-properties=packageName=models \
    --global-property models,modelDocs=false \
    --skip-validate-spec

mv tmp/go models