# Active Context: SeattleEarthquakeAlerts Threads Bot

## Current work focus

Adding comprehensive unit and integration tests and finalizing the CI/CD pipeline for deployment.

## Recent changes

Completed the manual OAuth 2.0 authorization flow for the Threads API.
Obtained and stored the long-lived access token and user ID in AWS Secrets Manager.
Updated `threadsService.ts` to retrieve tokens and the client secret from Secrets Manager and implement token refresh logic.
Removed hardcoded Threads App Secret from `threadsService.ts`.
Set up the GitHub Actions CI/CD pipeline with AWS using an IAM user and GitHub Secrets.
**Corrected the working directory path in the GitHub Actions workflow file (`.github/workflows/main.yml`) to fix "No such file or directory" error.**
**Added a TypeScript build step to the GitHub Actions workflow file (`.github/workflows/main.yml`) to fix "Cannot find asset" error during `cdk synth`.**
**Added a "build" script to `package.json` to enable the TypeScript build step in the GitHub Actions workflow.**
**Configured `tsconfig.json` to output compiled JavaScript files to the `dist` directory.**
Implemented the core bot logic in `usgsService.ts`, `stateService.ts`, and `index.ts`.
Defined the necessary AWS resources in the CDK stack (`lib/earthquake-threads-bot-stack.ts`).
Added initial unit and integration tests for the core services and handler.

## Next steps

1.  Add comprehensive unit and integration tests for all components.
2.  Ensure the GitHub Actions CI/CD pipeline is fully functional for deployment.
3.  Deploy the CDK stack via GitHub Actions.

## Active decisions and considerations

*   Using AWS Lambda, EventBridge, Secrets Manager, and DynamoDB for a cost-effective serverless architecture.
*   Implementing OAuth 2.0 Authorization Code Grant with automated refresh for Threads API.
*   Using a DynamoDB table for earthquake deduplication.
*   Defining a bounding box for the greater Seattle area for filtering.
*   Implementing robust CloudWatch logging.
*   Using `https://localhost/` as the Redirect URI for the OAuth flow during initial setup.
*   Correct Threads Authorization URL: `https://www.threads.net/oauth/authorize?client_id=YOUR_APP_ID&redirect_uri=https://localhost/&scope=threads_basic,threads_content_publish,threads_manage_replies,threads_read_replies&response_type=code`
*   Correct `curl` command format for short-lived token exchange: `curl -X POST https://graph.threads.net/oauth/access_token -F client_id=YOUR_APP_ID -F client_secret=YOUR_CLIENT_SECRET -F grant_type=authorization_code -F redirect_uri=https://localhost/ -F "code=YOUR_AUTHORIZATION_CODE"`
*   Correct `curl` command format for long-lived token exchange: `curl -i -X GET "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=YOUR_CLIENT_SECRET&access_token=YOUR_SHORT_LIVED_ACCESS_TOKEN"`
*   Correct `curl` command format for refreshing long-lived token: `curl -i -X GET "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=YOUR_LONG_LIVED_ACCESS_TOKEN"`

## Important patterns and preferences

*   TypeScript for bot logic and CDK.
*   AWS CDK for infrastructure as code.
*   Focus on serverless components for cost efficiency.

## Learnings and project insights

*   The Threads API requires OAuth 2.0 Authorization Code Grant.
*   AWS free tiers are sufficient for this project's expected usage.
*   It's crucial to use the Threads-specific App ID and App Secret, not the general app credentials.
*   The Redirect URI must be correctly configured and whitelisted in the Facebook Developer dashboard.
*   Security challenges may be presented during the OAuth flow.
*   The correct scopes for the Threads API are essential for successful authorization.
*   Exchanging the short-lived access token for a long-lived one requires a GET request with the `th_exchange_token` grant type.
*   Long-lived access tokens can be refreshed using a GET request with the `th_refresh_token` grant type.
*   The long-lived access token should be refreshed every 45 days to avoid expiry.
