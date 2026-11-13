# CI smoke fail-closed proof

PR: https://github.com/awsumbtech/shardfall/pull/57
Base: origin/main `dfa6b79bb890b825dc73ab8bd0f398b3321d55be` (merge of #56, live v0.4.35).

Brian, 9:23 AM ET Nov 13, relayed by Chief of Staff: "Yes, add the smoke test to Shardfall's CI".

## What CI runs

After the existing OO audit and tamper steps (unchanged), `.github/workflows/ci.yml` installs smoke dependencies and runs `node tools/smoke.mjs`:

- `npm ci` installs `pngjs@7.0.0` from `package.json`
- `npm install --no-save --no-package-lock playwright-core@1.59.1` (the version used locally; the harness loads it from `node_modules` or `/tmp/pw`)
- The harness launches the runner's preinstalled Chrome at `/usr/bin/google-chrome` (or `$CHROME`). No extra Chromium download.
- A non-zero exit from `node tools/smoke.mjs` fails the job. The step has no `continue-on-error`.

## Fail-closed run

A temporary commit made `tools/smoke.mjs` throw `Error("ci-smoke fail-closed probe")` on start. That commit was reverted before the PR was final, so the final tree does not contain the throw.

| Item | Value |
|---|---|
| Probe commit | `fe5a10f249d8a6ef0d9cad61c2de15209e8b7991` |
| CI run | https://github.com/awsumbtech/shardfall/actions/runs/43442591978 |
| Job | oo-audit (id 131943725399) |
| Started | 9:25:35 AM ET Nov 13 (America/New_York) |
| Finished | 9:25:50 AM ET Nov 13 (America/New_York) |
| Conclusion | **failure** (job red) |

Step results on that run:

- OO audit against main: success
- OO audit with main's script: success
- OO audit tamper test: success
- Install smoke dependencies: success
- **Smoke test: failure**, exit code 1

The Smoke test log (see `fail-closed-smoke-log.txt`) contains:

```
Error: ci-smoke fail-closed probe
...
Node.js v22.23.4
##[error]Process completed with exit code 1.
```

That is the proof: a failing smoke test turns the CI job red, and it does so only after the existing audit steps have already run.

Raw metadata: `fail-closed-run.json`.
