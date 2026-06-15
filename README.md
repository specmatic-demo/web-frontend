# web-frontend

This repository is a consumer-only repo.

It consumes the `web-bff` GraphQL contract from the `migrated_to_federated_repo` branch of:

- `https://github.com/specmatic-demo/web-bff`

The consumed spec path is:

- `specs/schema.graphql`

## Start the dependency mock

Run this from the `web-frontend` repository root:

```bash
docker run --rm -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  -w /usr/src/app \
  --network=host \
  specmatic/enterprise \
  mock
```

This starts the `web-bff` GraphQL mock on `localhost:4400`.

## Run frontend tests

If you have not already installed dependencies locally, first run:

```bash
npm install
```

Then run this from the `web-frontend` repository root:

```bash
npm test
```

The test setup starts Specmatic mock automatically as part of the Vitest lifecycle as well, but the explicit mock command above is useful when validating the dependency setup directly.

## Send the service test report to Insights

After the test run completes, run this from the `web-frontend` repository root:

```bash
docker run -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  -w /usr/src/app \
  --network=host \
  specmatic/specmatic \
  send-report \
  --branch-name=main \
  --repo-name="$(gh repo view --json name -q .name)" \
  --repo-id="$(gh api 'repos/{owner}/{repo}' --jq .id)" \
  --repo-url="$(gh repo view --json url --jq .url)"
```
