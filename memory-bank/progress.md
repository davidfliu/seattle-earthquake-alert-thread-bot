# Progress: SeattleEarthquakeAlerts Threads Bot

## What works

*   Project directory `earthquake-threads-bot` and `memory-bank` subdirectory created.
*   Core Memory Bank files created and updated to reflect project progress and decisions.
*   TypeScript project initialized and basic CDK project structure set up.
*   Initial code for USGS data fetching, Threads API interaction, and DynamoDB state management added.
*   Initial unit tests added.
*   Basic GitHub Actions workflow file set up and configured for AWS authentication and CDK deployment using an IAM user and GitHub Secrets.
*   **Corrected the working directory path in the GitHub Actions workflow file (`.github/workflows/main.yml`) to fix "No such file or directory" error.**
*   **Added a TypeScript build step to the GitHub Actions workflow file (`.github/workflows/main.yml`) to fix "Cannot find asset" error during `cdk synth`.**
*   **Added a "build" script to `package.json` to enable the TypeScript build step in the GitHub Actions workflow.**
*   **Configured `tsconfig.json` to output compiled JavaScript files to the `dist` directory.**
*   Manual OAuth 2.0 authorization flow for Threads API completed.
*   Long-lived access token and user ID obtained and stored in AWS Secrets Manager.
*   Threads API token retrieval and refresh logic implemented in `threadsService.ts`.
*   **Removed hardcoded Threads App Secret from `threadsService.ts` and updated it to retrieve the secret from Secrets Manager.**
*   **Corrected understanding: There is no Threads API refresh token; token refresh uses the long-lived access token and client secret.**

## What's left to build

*   Add comprehensive unit and integration tests.
*   Ensure the GitHub Actions CI/CD pipeline is fully functional for deployment.
*   Deploy the CDK stack via GitHub Actions.

## Current status

Project setup, initial documentation, Threads API OAuth setup, token management code, core bot logic, state management, CDK stack definition, and basic GitHub Actions CI/CD pipeline are complete. Ready to add comprehensive tests and finalize deployment.

## Known issues

*   None at this stage.

## Evolution of project decisions

*   Initial decision to use AWS serverless components (Lambda, EventBridge, etc.) confirmed based on cost analysis and user preference.
*   Decision to use DynamoDB for state management confirmed.
*   Decision to use TypeScript and CDK confirmed.
*   Decided to use an IAM user with access keys for GitHub Actions authentication based on user preference (instead of the more secure IAM roles with OIDC).
*   Identified the correct Threads API OAuth flow steps, including exchanging authorization code for short-lived token, then for long-lived token, and refreshing the long-lived token.
*   Determined that the long-lived access token should be refreshed every 45 days.
