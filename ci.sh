#!/usr/bin/env bash

npm install
npm test

if [[ -n "${SEND_REPORT:-}" ]]; then
  java -jar ~/.specmatic/specmatic-enterprise.jar send-report \
    --repo-id="$(gh api 'repos/{owner}/{repo}' --jq .id)" \
    --repo-name="$(gh repo view --json name -q .name)" \
    --repo-url="$(gh repo view --json url --jq .url)" \
    --branch-name main
fi
