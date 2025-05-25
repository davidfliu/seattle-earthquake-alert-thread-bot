import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import axios from 'axios';

const SECRETS_MANAGER_SECRET_NAME = '/earthquake-threads-bot/threads-api-tokens';
const THREADS_API_BASE_URL = 'https://graph.threads.net/'; // Base URL for Threads API
const THREADS_API_VERSION = 'v1.0'; // Current API version

const secretsManagerClient = new SecretsManagerClient({});

interface ThreadsTokens {
  accessToken: string;
  userId: string;
  lastRefreshed: number; // timestamp (ms) when access token was last refreshed
  clientSecret: string; // Add clientSecret to the interface
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

    // Secrets Manager stores the secret as a string, parse it as JSON
    const secretValue = JSON.parse(response.SecretString);

    // Assuming the secret is stored as {"accessToken": "...", "userId": "...", "lastRefreshed": ..., "clientSecret": "..."}
    const tokens: ThreadsTokens = {
      accessToken: secretValue.accessToken,
      userId: secretValue.userId,
      lastRefreshed: secretValue.lastRefreshed,
      clientSecret: secretValue.clientSecret, // Include clientSecret
    };

    return tokens;
  } catch (error) {
    console.error('Error retrieving Threads tokens from Secrets Manager:', error);
    throw error;
  }
}

async function saveThreadsTokens(tokens: Omit<ThreadsTokens, 'clientSecret'>): Promise<void> {
  try {
    // When saving, only store the essential tokens and metadata, not the client secret
    const command = new PutSecretValueCommand({
      SecretId: SECRETS_MANAGER_SECRET_NAME,
      SecretString: JSON.stringify(tokens), // Store as JSON string
    });
    await secretsManagerClient.send(command);
  } catch (error) {
    console.error('Error saving Threads tokens to Secrets Manager:', error);
    throw error;
  }
}

async function refreshThreadsAccessToken(currentAccessToken: string, clientSecret: string): Promise<Omit<ThreadsTokens, 'clientSecret'>> {
  console.log('Refreshing Threads access token...');
  const refreshEndpoint = `${THREADS_API_BASE_URL}refresh_access_token`;

  try {
    const response = await axios.get(refreshEndpoint, {
      params: {
        grant_type: 'th_refresh_token',
        access_token: currentAccessToken,
        client_secret: clientSecret, // Use clientSecret from Secrets Manager
      },
    });

    const newTokenData = response.data;
    const tokens = await getThreadsTokens(); // Get existing userId, refreshToken, clientSecret

    const now = Date.now();
    const newTokens: Omit<ThreadsTokens, 'clientSecret'> = {
      accessToken: newTokenData.access_token,
      userId: tokens.userId, // Keep the existing userId
      lastRefreshed: now,
    };

    await saveThreadsTokens(newTokens);
    console.log('Threads access token refreshed successfully.');
    return newTokens;
  } catch (error) {
    console.error('Error refreshing Threads access token:', error);
    throw error;
  }
}

async function getValidAccessToken(): Promise<Omit<ThreadsTokens, 'clientSecret'>> {
  let tokens = await getThreadsTokens();
  const now = Date.now();
  const fortyFiveDaysInMillis = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds

  // Check if access token needs to be refreshed (last refreshed more than 45 days ago)
  if (now - tokens.lastRefreshed >= fortyFiveDaysInMillis) {
    console.log('Access token needs refreshing (last refreshed over 45 days ago).');
    const refreshedTokens = await refreshThreadsAccessToken(tokens.accessToken, tokens.clientSecret); // Pass clientSecret
    // Return the refreshed tokens, but exclude clientSecret as it's not part of the saved state
    return {
        accessToken: refreshedTokens.accessToken,
        userId: refreshedTokens.userId,
        lastRefreshed: refreshedTokens.lastRefreshed,
    };
  }

  // Return the original tokens, but exclude clientSecret
   return {
        accessToken: tokens.accessToken,
        userId: tokens.userId,
        lastRefreshed: tokens.lastRefreshed,
    };
}

export async function postThread(message: string): Promise<void> {
  try {
    const tokens = await getValidAccessToken();
    const accessToken = tokens.accessToken;
    const userId = tokens.userId;

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
// This 'code' needs to be exchanged for the initial access_token and user_id.
// Then, the short-lived access_token needs to be exchanged for a long-lived access_token.
// This part is typically done manually or via a separate script/utility, not within the Lambda handler.
// The initial long-lived access token and the user_id should be stored in Secrets Manager.
