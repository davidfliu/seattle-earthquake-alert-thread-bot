import { hasEarthquakeBeenPosted, recordEarthquakeAsPosted } from '../src/stateService';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Mock the DynamoDBDocumentClient
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn(),
    }),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
}));

const mockedDdbDocClientSend = DynamoDBDocumentClient.from({} as any).send as jest.Mock;
const mockedGetCommand = GetCommand as unknown as jest.Mock;
const mockedPutCommand = PutCommand as unknown as jest.Mock;

describe('stateService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedDdbDocClientSend.mockReset();
    mockedGetCommand.mockReset();
    mockedPutCommand.mockReset();
  });

  test('hasEarthquakeBeenPosted returns true if item exists', async () => {
    const earthquakeId = 'test-quake-1';
    mockedDdbDocClientSend.mockResolvedValue({ Item: { id: earthquakeId } });

    const result = await hasEarthquakeBeenPosted(earthquakeId);

    expect(result).toBe(true);
    expect(mockedGetCommand).toHaveBeenCalledWith({
      TableName: 'EarthquakeThreadsBotState',
      Key: { id: earthquakeId },
    });
    expect(mockedDdbDocClientSend).toHaveBeenCalledTimes(1);
  });

  test('hasEarthquakeBeenPosted returns false if item does not exist', async () => {
    const earthquakeId = 'test-quake-2';
    mockedDdbDocClientSend.mockResolvedValue({ Item: undefined });

    const result = await hasEarthquakeBeenPosted(earthquakeId);

    expect(result).toBe(false);
    expect(mockedGetCommand).toHaveBeenCalledWith({
      TableName: 'EarthquakeThreadsBotState',
      Key: { id: earthquakeId },
    });
    expect(mockedDdbDocClientSend).toHaveBeenCalledTimes(1);
  });

  test('hasEarthquakeBeenPosted handles errors', async () => {
    const earthquakeId = 'test-quake-3';
    const mockError = new Error('DDB error');
    mockedDdbDocClientSend.mockRejectedValue(mockError);

    await expect(hasEarthquakeBeenPosted(earthquakeId)).rejects.toThrow('DDB error');
    expect(mockedGetCommand).toHaveBeenCalledWith({
      TableName: 'EarthquakeThreadsBotState',
      Key: { id: earthquakeId },
    });
    expect(mockedDdbDocClientSend).toHaveBeenCalledTimes(1);
  });

  test('recordEarthquakeAsPosted calls PutCommand with correct parameters', async () => {
    const earthquakeId = 'test-quake-4';
    mockedDdbDocClientSend.mockResolvedValue({}); // Successful put

    // Mock Date.now() to have a predictable TTL
    const mockNow = 1678886400000; // Example timestamp in ms
    const expectedTtl = Math.floor(mockNow / 1000) + (7 * 24 * 60 * 60);
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);

    await recordEarthquakeAsPosted(earthquakeId);

    expect(mockedPutCommand).toHaveBeenCalledWith({
      TableName: 'EarthquakeThreadsBotState',
      Item: {
        id: earthquakeId,
        ttl: expectedTtl,
      },
    });
    expect(mockedDdbDocClientSend).toHaveBeenCalledTimes(1);

    // Restore Date.now() mock
    (Date.now as jest.Mock).mockRestore();
  });

  test('recordEarthquakeAsPosted handles errors', async () => {
    const earthquakeId = 'test-quake-5';
    const mockError = new Error('DDB put error');
    mockedDdbDocClientSend.mockRejectedValue(mockError);

    await expect(recordEarthquakeAsPosted(earthquakeId)).rejects.toThrow('DDB put error');
    expect(mockedPutCommand).toHaveBeenCalledWith({
      TableName: 'EarthquakeThreadsBotState',
      Item: expect.objectContaining({ id: earthquakeId }), // Check for id, ttl will vary
    });
    expect(mockedDdbDocClientSend).toHaveBeenCalledTimes(1);
  });
});
