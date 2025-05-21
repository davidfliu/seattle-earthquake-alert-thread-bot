# Tech Context: SeattleEarthquakeAlerts Threads Bot

## Technologies used

*   **Language:** TypeScript
*   **Runtime:** Node.js
*   **Cloud Provider:** AWS
*   **AWS Services:**
    *   AWS Lambda
    *   Amazon EventBridge (Scheduler)
    *   AWS Secrets Manager
    *   Amazon DynamoDB
    *   Amazon CloudWatch Logs
*   **Infrastructure as Code:** AWS CDK (TypeScript)
*   **HTTP Client:** axios
*   **Testing Framework:** Jest (for unit tests)

## Development setup

*   Node.js and npm/yarn installed.
*   TypeScript compiler (`tsc`).
*   AWS CLI configured with appropriate credentials and default region.
*   AWS CDK installed (`npm install -g aws-cdk`).
*   Git for version control.

## Technical constraints

*   Threads API capabilities and rate limits.
*   USGS Earthquake API rate limits and data availability.
*   AWS Lambda execution limits (memory, time).
*   AWS free tier limits (though expected usage is well within these).

## Dependencies

*   `typescript`
*   `aws-cdk-lib`
*   `constructs`
*   `axios`
*   `@aws-sdk/client-secrets-manager`
*   `@aws-sdk/client-dynamodb`
*   `@aws-sdk/lib-dynamodb`
*   `@types/node`
*   `jest`
*   `ts-jest`
*   `@types/jest`
*   `ts-node`
*   `nodemon` (for local development)

## Tool usage patterns

*   `npm` or `yarn` for dependency management.
*   `tsc` for TypeScript compilation.
*   `cdk deploy` for deploying infrastructure.
*   `jest` for running tests.
*   AWS CLI for initial OAuth token exchange (potentially).
