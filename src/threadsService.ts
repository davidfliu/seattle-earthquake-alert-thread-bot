import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import axios from 'axios';

const SECRETS_MANAGER_SECRET_NAME = 'EarthquakeThreadsBotThreadsTokens'; // We will define this in CDK
const THREADS_API_BASE_URL = 'https://graph.threads.net/'; // Base URL for Threads API
const THREADS_API_VERSION = 'v1.0'; // Current API version

const secretsManagerClient = new SecretsManagerClient({});

interface ThreadsTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
  lastRefreshed: number; // timestamp (ms) when access token was last refreshed
}

async function getThreadsTokens(): Promise<ThreadsTokens> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: SECRETS_MANAGER_SECRET_NAME,
    });
    const response = await secretsManagerClient.send(command);

    if (!response.SecretString) {
      throw new Error('Secret string is empty.');
    }

    const tokens: ThreadsTokens = JSON.parse(response.SecretString);
    return tokens;
  } catch (error) {
    console.error('Error retrieving Threads tokens from Secrets Manager:', error);
    throw error;
  }
}

async function saveThreadsTokens(tokens: ThreadsTokens): Promise<void> {
  try {
    const command = new PutSecretValueCommand({
      SecretId: SECRETS_MANAGER_SECRET_NAME,
      SecretString: JSON.stringify(tokens),
    });
    await secretsManagerClient.send(command);
  } catch (error) {
    console.error('Error saving Threads tokens to Secrets Manager:', error);
    throw error;
  }
}

async function refreshThreadsAccessToken(refreshToken: string): Promise<ThreadsTokens> {
  // TODO: Implement the actual OAuth 2.0 refresh token logic here
  // This will involve making a POST request to the Threads OAuth token endpoint
  // with the refresh_token, client_id, and client_secret.
  // The response will contain a new access_token and potentially a new refresh_token.
  console.log('Refreshing Threads access token...');
  // Placeholder for refresh logic
  const newTokenData = {
    access_token: 'new_access_token', // Replace with actual token from API response
    refresh_token: 'new_refresh_token', // Replace with actual token from API response
    expires_in: 3600, // Replace with actual expiry from API response
  };

  const now = Date.now();
  const newTokens: ThreadsTokens = {
    accessToken: newTokenData.access_token,
    refreshToken: newTokenData.refresh_token,
    expiresIn: newTokenData.expires_in,
    lastRefreshed: now,
  };

  await saveThreadsTokens(newTokens);
  return newTokens;
}

async function getValidAccessToken(): Promise<string> {
  let tokens = await getThreadsTokens();
  const now = Date.now();
  const expiryTime = tokens.lastRefreshed + tokens.expiresIn * 1000; // expires_in is in seconds

  // Check if access token is expired or close to expiring (e.g., within 5 minutes)
  if (now >= expiryTime - 5 * 60 * 1000) {
    console.log('Access token expired or near expiry. Refreshing...');
    tokens = await refreshThreadsAccessToken(tokens.refreshToken);
  }

  return tokens.accessToken;
}

export async function postThread(message: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    const userId = 'YOUR_USER_ID'; // TODO: Get the Threads user ID associated with your app

    const response = await axios.post(
      `${THREADS_API_BASE_URL}${THREADS_API_VERSION}/${userId}/threads`,
      {
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Thread posted successfully:', response.data);
  } catch (error) {
    console.error('Error posting thread:', error);
    // TODO: Handle specific errors, e.g., invalid token, rate limits
    throw error; // Re-throw to be handled by the Lambda function
  }
}

// TODO: Add a utility function for the one-time manual OAuth authorization flow
// This function would generate the authorization URL for the user to visit.
// After the user authorizes, they will be redirected to the redirect_uri with a 'code' parameter.
// This 'code' needs to be exchanged for the initial access_token and refresh_token.
// This part is typically done manually or via a separate script/utility, not within the Lambda handler.
