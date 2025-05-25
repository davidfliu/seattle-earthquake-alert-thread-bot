import { postThread } from '../src/threadsService';
import axios from 'axios';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Mock axios and SecretsManagerClient
jest.mock('axios');
jest.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  GetSecretValueCommand: jest.fn(),
  PutSecretValueCommand: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSecretsManagerClientSend = new SecretsManagerClient({} as any).send as jest.Mock;
const mockedGetSecretValueCommand = GetSecretValueCommand as unknown as jest.Mock;
const mockedPutSecretValueCommand = PutSecretValueCommand as unknown as jest.Mock;

describe('threadsService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.post.mockReset();
    mockedSecretsManagerClientSend.mockReset();
    mockedGetSecretValueCommand.mockReset();
    mockedPutSecretValueCommand.mockReset();

    // Mock the initial token retrieval to return a valid token by default
    const mockTokens = {
      accessToken: 'initial_access_token',
      refreshToken: 'initial_refresh_token',
      expiresIn: 3600, // 1 hour
      lastRefreshed: Date.now(),
    };
    mockedSecretsManagerClientSend.mockResolvedValue({
      SecretString: JSON.stringify(mockTokens),
    });
    mockedGetSecretValueCommand.mockImplementation((params: any) => ({
        SecretId: params.SecretId
    }));
  });

  test('postThread successfully posts a message', async () => {
    const message = 'Test earthquake alert!';
    const mockUserId = 'YOUR_USER_ID'; // Matches the placeholder in threadsService

    // Mock a successful Threads API post response
    mockedAxios.post.mockResolvedValue({ data: { id: 'thread_id_123' } });

    await postThread(message);

    // Expect Secrets Manager to be called to get the token
    expect(mockedGetSecretValueCommand).toHaveBeenCalledWith({
        SecretId: 'EarthquakeThreadsBotThreadsTokens'
    });
    expect(mockedSecretsManagerClientSend).toHaveBeenCalledTimes(1); // For getting the initial token

    // Expect axios.post to be called with the correct parameters
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://graph.threads.net/v1.0/${mockUserId}/threads`,
      { text: message },
      {
        headers: {
          Authorization: 'Bearer initial_access_token',
          'Content-Type': 'application/json',
        },
      }
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  test('postThread does not refresh token if not expired', async () => {
    const message = 'Test earthquake alert!';
    const mockUserId = 'YOUR_USER_ID';

    // Mock initial token retrieval to return a valid, not-expired token
    const validTokens = {
      accessToken: 'valid_access_token',
      refreshToken: 'valid_refresh_token',
      expiresIn: 3600, // 1 hour
      lastRefreshed: Date.now() - 1000, // Last refreshed just a second ago
    };
     mockedSecretsManagerClientSend.mockResolvedValueOnce({ // First call: return valid token
      SecretString: JSON.stringify(validTokens),
    });

    // Mock a successful Threads API post response
    mockedAxios.post.mockResolvedValue({ data: { id: 'thread_id_789' } });

    await postThread(message);

    // Expect Secrets Manager to be called only once (to get the token)
    expect(mockedGetSecretValueCommand).toHaveBeenCalledWith({
        SecretId: 'EarthquakeThreadsBotThreadsTokens'
    });
    expect(mockedSecretsManagerClientSend).toHaveBeenCalledTimes(1);
    expect(mockedPutSecretValueCommand).not.toHaveBeenCalled(); // Should not attempt to save a new token

    // Expect axios.post to be called with the valid access token
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://graph.threads.net/v1.0/${mockUserId}/threads`,
      { text: message },
      {
        headers: {
          Authorization: 'Bearer valid_access_token', // Should use the valid token
          'Content-Type': 'application/json',
        },
      }
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  test('postThread refreshes token if expired', async () => {
    const message = 'Test earthquake alert!';
    const mockUserId = 'YOUR_USER_ID';

    // Mock initial token retrieval to return an expired token
    const expiredTokens = {
      accessToken: 'expired_access_token',
      refreshToken: 'expired_refresh_token',
      expiresIn: 3600, // 1 hour
      lastRefreshed: Date.now() - 4000 * 1000, // Last refreshed over an hour ago
    };
     mockedSecretsManagerClientSend.mockResolvedValueOnce({ // First call: return expired token
      SecretString: JSON.stringify(expiredTokens),
    });

    // Mock the refresh token logic (in threadsService, this would call the OAuth endpoint)
    // For this test, we just mock the saveThreadsTokens call that happens after refresh
    const newTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 3600,
        lastRefreshed: Date.now(),
    };
    mockedSecretsManagerClientSend.mockResolvedValueOnce({}); // Second call: save new token

    // Mock a successful Threads API post response
    mockedAxios.post.mockResolvedValue({ data: { id: 'thread_id_456' } });

    await postThread(message);

    // Expect Secrets Manager to be called twice: get expired, save new
    expect(mockedGetSecretValueCommand).toHaveBeenCalledWith({
        SecretId: 'EarthquakeThreadsBotThreadsTokens'
    });
     expect(mockedPutSecretValueCommand).toHaveBeenCalledWith({
        SecretId: 'EarthquakeThreadsBotThreadsTokens',
        SecretString: expect.any(String) // Check that a string is saved
    });
    expect(mockedSecretsManagerClientSend).toHaveBeenCalledTimes(2);

    // Expect axios.post to be called with the NEW access token
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://graph.threads.net/v1.0/${mockUserId}/threads`,
      { text: message },
      {
        headers: {
          Authorization: 'Bearer new_access_token', // Should use the new token
          'Content-Type': 'application/json',
        },
      }
    );
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  test('postThread handles errors during token retrieval', async () => {
    const message = 'Test message';
    const mockError = new Error('Secrets Manager error');
    mockedSecretsManagerClientSend.mockRejectedValue(mockError); // Error when getting token

    await expect(postThread(message)).rejects.toThrow('Secrets Manager error');
    expect(mockedAxios.post).not.toHaveBeenCalled(); // Should not attempt to post
  });

   test('postThread handles errors during token refresh', async () => {
    const message = 'Test message';

    // Mock initial token retrieval to return an expired token
    const expiredTokens = {
      accessToken: 'expired_access_token',
      refreshToken: 'expired_refresh_token',
      expiresIn: 3600, // 1 hour
      lastRefreshed: Date.now() - 4000 * 1000, // Last refreshed over an hour ago
    };
     mockedSecretsManagerClientSend.mockResolvedValueOnce({ // First call: return expired token
      SecretString: JSON.stringify(expiredTokens),
    });

    // Mock an error during the refresh process (which includes saving the new token)
    const mockError = new Error('Refresh token error');
    mockedSecretsManagerClientSend.mockRejectedValueOnce(mockError); // Second call: error saving new token

    await expect(postThread(message)).rejects.toThrow('Refresh token error');
    expect(mockedAxios.post).not.toHaveBeenCalled(); // Should not attempt to post
  });


  test('postThread handles errors during posting', async () => {
    const message = 'Test message';
    const mockError = new Error('Threads API error');
    mockedAxios.post.mockRejectedValue(mockError); // Error during posting

    await expect(postThread(message)).rejects.toThrow('Threads API error');
    // Secrets Manager should still have been called to get the token
     expect(mockedGetSecretValueCommand).toHaveBeenCalledWith({
        SecretId: 'EarthquakeThreadsBotThreadsTokens'
    });
    expect(mockedSecretsManagerClientSend).toHaveBeenCalledTimes(1);
  });
});
