import { fetchEarthquakes } from './usgsService';
import { postThread } from './threadsService';
import { hasEarthquakeBeenPosted, recordEarthquakeAsPosted } from './stateService';

export async function handler(event: any): Promise<void> {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    console.log('Fetching recent earthquakes...');
    const earthquakes = await fetchEarthquakes();
    console.log(`Found ${earthquakes.length} relevant earthquakes.`);

    for (const earthquake of earthquakes) {
      const earthquakeId = earthquake.id;
      const earthquakeTitle = earthquake.properties.title;
      const earthquakeUrl = earthquake.properties.url;

      console.log(`Processing earthquake: ${earthquakeId} - ${earthquakeTitle}`);

      const alreadyPosted = await hasEarthquakeBeenPosted(earthquakeId);

      if (alreadyPosted) {
        console.log(`Earthquake ${earthquakeId} already posted. Skipping.`);
      } else {
        console.log(`Earthquake ${earthquakeId} not yet posted. Posting to Threads...`);
        const message = `Earthquake Alert: ${earthquakeTitle}\nDetails: ${earthquakeUrl}`;

        try {
          await postThread(message);
          await recordEarthquakeAsPosted(earthquakeId);
          console.log(`Successfully posted and recorded earthquake ${earthquakeId}.`);
        } catch (postError) {
          console.error(`Failed to post earthquake ${earthquakeId} to Threads:`, postError);
          // Continue processing other earthquakes even if one fails to post
        }
      }
    }

    console.log('Earthquake check and posting process completed.');

  } catch (error) {
    console.error('An error occurred during the earthquake processing:', error);
    throw error; // Re-throw to indicate failure to EventBridge
  }
}
