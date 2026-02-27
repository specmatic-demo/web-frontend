#!/usr/bin/env bash

npm install
java -jar ~/.specmatic/specmatic-enterprise.jar mock &
pid=$!
npm test
exit_code=$?
kill $pid

exit $exit_code
