import axios from 'axios';

const USGS_API_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';

interface UsgsFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [longitude, latitude, depth]
  };
  id: string;
}

interface UsgsApiResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: UsgsFeature[];
  bbox: [number, number, number, number, number, number]; // [minLon, minLat, minDepth, maxLon, maxLat, maxDepth]
}

// Approximate bounding box for greater Seattle area (South Lake Union, Kirkland, Redmond, Bellevue)
const SEATTLE_BOUNDING_BOX = {
  minlatitude: 47.5,
  maxlatitude: 47.8,
  minlongitude: -122.4,
  maxlongitude: -122.0,
};

export async function fetchEarthquakes(): Promise<UsgsFeature[]> {
  try {
    const response = await axios.get<UsgsApiResponse>(USGS_API_URL);
    const earthquakes = response.data.features;

    // Filter earthquakes by bounding box
    const filteredEarthquakes = earthquakes.filter((quake: UsgsFeature) => {
      const [longitude, latitude] = quake.geometry.coordinates;
      return (
        latitude >= SEATTLE_BOUNDING_BOX.minlatitude &&
        latitude <= SEATTLE_BOUNDING_BOX.maxlatitude &&
        longitude >= SEATTLE_BOUNDING_BOX.minlongitude &&
        longitude <= SEATTLE_BOUNDING_BOX.maxlongitude
      );
    });

    return filteredEarthquakes;
  } catch (error) {
    console.error('Error fetching or filtering earthquake data:', error);
    throw error; // Re-throw to be handled by the Lambda function
  }
}
