import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

export class EarthquakeThreadsBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Secrets Manager Secret for Threads API Tokens
    const threadsTokensSecret = new secretsmanager.Secret(this, 'ThreadsTokensSecret', {
      secretName: 'EarthquakeThreadsBotThreadsTokens', // Matches the name used in threadsService.ts
      description: 'Stores Threads API access and refresh tokens for the Earthquake Threads Bot.',
      // We will manually put the initial secret value after deployment
    });

    // DynamoDB Table for storing posted earthquake IDs (for deduplication)
    const earthquakeStateTable = new dynamodb.Table(this, 'EarthquakeStateTable', {
      tableName: 'EarthquakeThreadsBotState', // Matches the name used in stateService.ts
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use on-demand for cost efficiency
      timeToLiveAttribute: 'ttl', // Enable TTL for automatic cleanup
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Adjust as needed for production vs development
    });

    // Lambda Function for the bot logic
    const botLambda = new lambda.Function(this, 'BotLambda', {
      runtime: lambda.Runtime.NODEJS_18_X, // Or a later supported version
      handler: 'index.handler', // Assuming your main handler file is index.ts
      code: lambda.Code.fromAsset(path.join(__dirname, '../dist')), // Code is in the 'dist' directory after TypeScript compilation
      timeout: cdk.Duration.minutes(5), // Adjust timeout as needed
      memorySize: 128, // Start with low memory for cost efficiency
      environment: {
        SECRETS_MANAGER_SECRET_NAME: threadsTokensSecret.secretName,
        DYNAMODB_TABLE_NAME: earthquakeStateTable.tableName,
        // Add other environment variables here if needed (e.g., bounding box coords)
      },
    });

    // Grant Lambda permissions to read/write the Secrets Manager secret
    threadsTokensSecret.grantRead(botLambda);
    // Grant Lambda permissions to read/write the DynamoDB table
    earthquakeStateTable.grantReadWriteData(botLambda);

    // EventBridge Rule to trigger the Lambda function every 30 minutes
    new events.Rule(this, 'ScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
      targets: [new targets.LambdaFunction(botLambda)],
    });
  }
}
