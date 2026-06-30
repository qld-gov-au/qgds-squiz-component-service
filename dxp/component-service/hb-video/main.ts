import { secureFetch } from "@utils/secureFetch";
import { compile } from "@qgds/handlebars";

interface VideoInput {
  videoType: "YouTube" | "Vimeo" | "Other";
  videoUrl: string;
}  

export default {
  async main(input: VideoInput, info: any) {

    interface YouTubeResponse {
      items: Array<{
        contentDetails: {
          duration: string;
        };
      }>;
    }

    // 1. Extract context URL
    const contextUrl = info.ctx?.url || '';
    
    // 2. Test if Squiz appended '_nocache=1' or '_recache=1' to the rendering URL
    const hasNoCache = /\/_(no|re)cache/i.test(contextUrl);

    // 3. Pass the conditional caching options directly via HTTP Headers
    const videoData = await secureFetch<YouTubeResponse>({
      method: 'GET',
      url: 'https://www.googleapis.com/youtube/v3/videos',
      params: {
        part: 'contentDetails',
        fields: 'items(contentDetails(duration))',
        key: info.env.YOUTUBE_API_KEY,
        id: input.videoUrl
      },
      options: {
        // REMOVED: cache: hasNoCache ? 'no-store' : 'force-cache'
        headers: {
          'Cache-Control': hasNoCache 
            ? 'no-cache, no-store, must-revalidate' 
            : 's-maxage=86400, max-age=86400'
        }
      }
    });

     // Read the type-safe duration string
    const duration = videoData.items?.[0]?.contentDetails?.duration || '';

    const hbData = {
      source                  : `youtube`,
      videoId                 : input.videoUrl || `VeNfHj6MhgA`,
      aspectRatio             : `16x9`,
      duration                : duration,
      description             : `API fetched duration for video ID: ${input.videoUrl}`,
    };
    return `video duration: ${duration}`;
   // return await compile('video', hbData);
  }
};
