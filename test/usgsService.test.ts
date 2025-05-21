import { fetchEarthquakes } from '../src/usgsService';
import axios from 'axios';

// Mock axios to prevent actual API calls during testing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('usgsService', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockedAxios.get.mockReset();
  });

  test('fetchEarthquakes filters earthquakes within the Seattle bounding box', async () => {
    // Mock USGS API response with earthquakes inside and outside the bounding box
    const mockApiResponse = {
      data: {
        features: [
          // Inside Seattle bounding box
          {
            id: 'us7000c6cy',
            properties: { title: 'M 1.0 - 7km NW of Seattle, WA', mag: 1.0, url: '...' },
            geometry: { coordinates: [-122.33, 47.61, 10] },
          },
          {
            id: 'us7000c6cz',
            properties: { title: 'M 0.5 - 3km E of Redmond, WA', mag: 0.5, url: '...' },
            geometry: { coordinates: [-122.12, 47.67, 5] },
          },
          // Outside Seattle bounding box (too far north)
          {
            id: 'us7000c6da',
            properties: { title: 'M 2.0 - 50km N of Seattle, WA', mag: 2.0, url: '...' },
            geometry: { coordinates: [-122.33, 48.5, 15] },
          },
          // Outside Seattle bounding box (too far east)
          {
            id: 'us7000c6db',
            properties: { title: 'M 1.5 - 10km E of Snoqualmie, WA', mag: 1.5, url: '...' },
            geometry: { coordinates: [-121.5, 47.5, 8] },
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(mockApiResponse);

    const filteredEarthquakes = await fetchEarthquakes();

    // Expect only the earthquakes within the bounding box
    expect(filteredEarthquakes.length).toBe(2);
    expect(filteredEarthquakes.map(e => e.id)).toEqual(['us7000c6cy', 'us7000c6cz']);
  });

  test('fetchEarthquakes handles API errors', async () => {
    const mockError = new Error('Failed to fetch data');
    mockedAxios.get.mockRejectedValue(mockError);

    await expect(fetchEarthquakes()).rejects.toThrow('Failed to fetch data');
  });
});
