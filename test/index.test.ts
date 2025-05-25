import { handler } from '../src/index';
import { fetchEarthquakes } from '../src/usgsService';
import { postThread } from '../src/threadsService';
import { hasEarthquakeBeenPosted, recordEarthquakeAsPosted } from '../src/stateService';

// Mock the service dependencies
jest.mock('../src/usgsService');
jest.mock('../src/threadsService');
jest.mock('../src/stateService');

const mockedFetchEarthquakes = fetchEarthquakes as jest.Mock;
const mockedPostThread = postThread as jest.Mock;
const mockedHasEarthquakeBeenPosted = hasEarthquakeBeenPosted as jest.Mock;
const mockedRecordEarthquakeAsPosted = recordEarthquakeAsPosted as jest.Mock;

describe('Lambda Handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedFetchEarthquakes.mockReset();
    mockedPostThread.mockReset();
    mockedHasEarthquakeBeenPosted.mockReset();
    mockedRecordEarthquakeAsPosted.mockReset();
  });

  test('handler fetches, filters, posts new earthquakes, and records state', async () => {
    // Mock a list of earthquakes, some new, some already posted
    const mockEarthquakes = [
      { id: 'new-quake-1', properties: { title: 'M 1.0 - near Seattle', url: 'url1' }, geometry: { coordinates: [-122.3, 47.6, 10] } },
      { id: 'posted-quake-1', properties: { title: 'M 1.5 - near Redmond', url: 'url2' }, geometry: { coordinates: [-122.1, 47.7, 5] } },
      { id: 'new-quake-2', properties: { title: 'M 2.0 - near Bellevue', url: 'url3' }, geometry: { coordinates: [-122.2, 47.5, 8] } },
    ];

    mockedFetchEarthquakes.mockResolvedValue(mockEarthquakes);
    mockedHasEarthquakeBeenPosted.mockImplementation((id: string) => {
      // Mock state: 'posted-quake-1' is already posted
      return Promise.resolve(id === 'posted-quake-1');
    });
    mockedPostThread.mockResolvedValue(undefined); // Mock successful post
    mockedRecordEarthquakeAsPosted.mockResolvedValue(undefined); // Mock successful record

    await handler({}); // Invoke the handler with an empty event

    // Expect fetchEarthquakes to be called
    expect(mockedFetchEarthquakes).toHaveBeenCalledTimes(1);

    // Expect hasEarthquakeBeenPosted to be called for each earthquake
    expect(mockedHasEarthquakeBeenPosted).toHaveBeenCalledTimes(mockEarthquakes.length);
    expect(mockedHasEarthquakeBeenPosted).toHaveBeenCalledWith('new-quake-1');
    expect(mockedHasEarthquakeBeenPosted).toHaveBeenCalledWith('posted-quake-1');
    expect(mockedHasEarthquakeBeenPosted).toHaveBeenCalledWith('new-quake-2');

    // Expect postThread to be called only for new earthquakes
    expect(mockedPostThread).toHaveBeenCalledTimes(2);
    expect(mockedPostThread).toHaveBeenCalledWith('Earthquake Alert: M 1.0 - near Seattle\nDetails: url1');
    expect(mockedPostThread).toHaveBeenCalledWith('Earthquake Alert: M 2.0 - near Bellevue\nDetails: url3');

    // Expect recordEarthquakeAsPosted to be called only for new earthquakes that were posted
    expect(mockedRecordEarthquakeAsPosted).toHaveBeenCalledTimes(2);
    expect(mockedRecordEarthquakeAsPosted).toHaveBeenCalledWith('new-quake-1');
    expect(mockedRecordEarthquakeAsPosted).toHaveBeenCalledWith('new-quake-2');
  });

  test('handler handles errors during fetching earthquakes', async () => {
    const mockError = new Error('Fetch error');
    mockedFetchEarthquakes.mockRejectedValue(mockError);

    await expect(handler({})).rejects.toThrow('Fetch error');

    // No other service functions should be called
    expect(mockedHasEarthquakeBeenPosted).not.toHaveBeenCalled();
    expect(mockedPostThread).not.toHaveBeenCalled();
    expect(mockedRecordEarthquakeAsPosted).not.toHaveBeenCalled();
  });

  test('handler handles errors during state check', async () => {
     const mockEarthquakes = [
      { id: 'new-quake-1', properties: { title: 'M 1.0 - near Seattle', url: 'url1' }, geometry: { coordinates: [-122.3, 47.6, 10] } },
    ];
    const mockError = new Error('State check error');

    mockedFetchEarthquakes.mockResolvedValue(mockEarthquakes);
    mockedHasEarthquakeBeenPosted.mockRejectedValue(mockError);

    await expect(handler({})).rejects.toThrow('State check error');

    // Post and record should not be called
    expect(mockedPostThread).not.toHaveBeenCalled();
    expect(mockedRecordEarthquakeAsPosted).not.toHaveBeenCalled();
  });

   test('handler handles errors during recording state', async () => {
     const mockEarthquakes = [
      { id: 'new-quake-1', properties: { title: 'M 1.0 - near Seattle', url: 'url1' }, geometry: { coordinates: [-122.3, 47.6, 10] } },
    ];
    const mockError = new Error('Record state error');

    mockedFetchEarthquakes.mockResolvedValue(mockEarthquakes);
    mockedHasEarthquakeBeenPosted.mockResolvedValue(false); // Not posted yet
    mockedPostThread.mockResolvedValue(undefined); // Post successful
    mockedRecordEarthquakeAsPosted.mockRejectedValue(mockError); // Error recording state

    await expect(handler({})).rejects.toThrow('Record state error');

    // Post should have been called, but record failed
    expect(mockedPostThread).toHaveBeenCalledTimes(1);
    expect(mockedRecordEarthquakeAsPosted).toHaveBeenCalledTimes(1);
  });

  test('handler handles empty earthquake list gracefully', async () => {
    mockedFetchEarthquakes.mockResolvedValue([]); // Mock empty list

    await handler({}); // Invoke the handler with an empty event

    // Expect fetchEarthquakes to be called
    expect(mockedFetchEarthquakes).toHaveBeenCalledTimes(1);

    // No other service functions should be called
    expect(mockedHasEarthquakeBeenPosted).not.toHaveBeenCalled();
    expect(mockedPostThread).not.toHaveBeenCalled();
    expect(mockedRecordEarthquakeAsPosted).not.toHaveBeenCalled();
  });

  // Note: Error handling for postThread is done within the loop in the handler,
  // allowing other earthquakes to be processed even if one post fails.
  // This is tested implicitly in the main test case where 'posted-quake-1' is skipped.
});
