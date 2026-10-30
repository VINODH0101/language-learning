/**
 * Media Resources Manager
 * Orchestrates Wikimedia Commons and Openverse media queries with attribution enforcement.
 */

import { WikimediaCommonsProvider, MediaSearchInput } from './wikimediaCommonsProvider';
import { OpenverseProvider, OpenverseSearchInput } from './openverseProvider';
import { NormalizedMediaItem } from '../../normalization/responseNormalizers';

export class MediaManager {
  private static instance: MediaManager;
  private wikimedia = new WikimediaCommonsProvider();
  private openverse = new OpenverseProvider();

  private constructor() {}

  public static getInstance(): MediaManager {
    if (!MediaManager.instance) {
      MediaManager.instance = new MediaManager();
    }
    return MediaManager.instance;
  }

  public async searchMedia(input: MediaSearchInput): Promise<NormalizedMediaItem[]> {
    try {
      const results = await this.wikimedia.execute(input);
      if (results.length > 0) return results;
    } catch (err) {
      console.warn('[MediaManager] Wikimedia Commons query failed, falling back to Openverse...', err);
    }

    try {
      return await this.openverse.execute(input);
    } catch (err) {
      console.warn('[MediaManager] Openverse query also failed:', err);
      return [];
    }
  }
}
