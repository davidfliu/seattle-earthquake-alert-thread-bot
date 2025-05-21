# Active Context: SeattleEarthquakeAlerts Threads Bot

## Current work focus

Initializing the project structure and core documentation (Memory Bank).

## Recent changes

Created the project directory `earthquake-threads-bot` and the `memory-bank` subdirectory.
Created `projectbrief.md` and `productContext.md`.

## Next steps

1.  Create the remaining core Memory Bank files (`activeContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`).
2.  Initialize the TypeScript project within `earthquake-threads-bot`.
3.  Set up the basic CDK project structure.
4.  Implement the USGS data fetching and filtering logic.
5.  Implement the Threads API interaction logic (including OAuth token handling).
6.  Implement the DynamoDB state management.
7.  Define the AWS resources using CDK.
8.  Set up the CI/CD pipeline configuration.
9.  Implement unit and integration tests.

## Active decisions and considerations

*   Using AWS Lambda, EventBridge, Secrets Manager, and DynamoDB for a cost-effective serverless architecture.
*   Implementing OAuth 2.0 Authorization Code Grant with automated refresh for Threads API.
*   Using a DynamoDB table for earthquake deduplication.
*   Defining a bounding box for the greater Seattle area for filtering.
*   Implementing robust CloudWatch logging.

## Important patterns and preferences

*   TypeScript for bot logic and CDK.
*   AWS CDK for infrastructure as code.
*   Focus on serverless components for cost efficiency.

## Learnings and project insights

*   The Threads API requires OAuth 2.0 Authorization Code Grant.
*   AWS free tiers are sufficient for this project's expected usage.
