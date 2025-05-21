import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const DYNAMODB_TABLE_NAME = 'EarthquakeThreadsBotState'; // We will define this in CDK
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days TTL for state entries

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function hasEarthquakeBeenPosted(earthquakeId: string): Promise<boolean> {
  try {
    const command = new GetCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        id: earthquakeId,
      },
    });

    const response = await ddbDocClient.send(command);
    return !!response.Item; // Returns true if Item exists, false otherwise
  } catch (error) {
    console.error(`Error checking state for earthquake ${earthquakeId}:`, error);
    // Depending on desired behavior, we might return false here to attempt posting
    // even if state check fails, or re-throw. Let's re-throw for now.
    throw error;
  }
}

export async function recordEarthquakeAsPosted(earthquakeId: string): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const ttl = now + TTL_SECONDS; // TTL in seconds

    const command = new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        id: earthquakeId,
        ttl: ttl, // Time-to-Live attribute
      },
    });

    await ddbDocClient.send(command);
    console.log(`Recorded earthquake ${earthquakeId} as posted.`);
  } catch (error) {
    console.error(`Error recording state for earthquake ${earthquakeId}:`, error);
    throw error;
  }
}
