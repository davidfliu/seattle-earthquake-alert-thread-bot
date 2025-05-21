# Project Brief: SeattleEarthquakeAlerts Threads Bot

## Core Requirements

*   Query the USGS Earthquake Hazards Program API for real-time earthquake data.
*   Filter earthquakes for the greater Seattle area (South Lake Union, Kirkland, Redmond, Bellevue).
*   Post filtered earthquake alerts to a dedicated Threads account (SeattleEarthquakeAlerts).
*   Run the check and post process every 30 minutes.
*   Minimize hosting costs by leveraging cloud provider free tiers.
*   Implement using TypeScript.
*   Deploy on AWS using CDK.
*   Implement a CI/CD pipeline with integration tests.
*   Utilize OAuth 2.0 for Threads API authentication with automated token refresh.
*   Use DynamoDB for state management (deduplication).
*   Include CloudWatch logging for monitoring and debugging.

## Goals

*   Provide timely and relevant earthquake alerts for the Seattle area on Threads.
*   Build a cost-effective and maintainable serverless application.
*   Establish a robust deployment process with automated testing.
