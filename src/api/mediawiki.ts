import { logger } from '../utils/logger.js';

export interface PageMetadataResult {
  pageid: number;
  ns: number;
  title: string;
  missing?: boolean;
  length?: number;
  lastrevid?: number;
  touched?: string;
  revisions?: Array<{
    revid: number;
    parentid: number;
    user: string;
    timestamp: string;
    comment?: string;
  }>;
}

export interface ParseResult {
  title: string;
  pageid: number;
  revid: number;
  text?: { '*' : string };
  wikitext?: { '*' : string };
  sections?: Array<{
    toclevel: number;
    level: string;
    line: string;
    number: string;
    index: string;
    fromtitle: string;
    byteoffset: number | null;
    anchor: string;
  }>;
  categories?: Array<{
    sortkey: string;
    '*': string;
    hidden?: boolean;
  }>;
  templates?: Array<{
    ns: number;
    exists?: boolean;
    '*': string;
  }>;
  images?: string[];
}

export interface ImageInfoItem {
  timestamp?: string;
  user?: string;
  size: number;
  width: number;
  height: number;
  url: string;
  descriptionurl: string;
  descriptionshorturl?: string;
  sha1: string;
  mime: string;
}

export class MediaWikiClient {
  private baseUrl: string;
  private userAgent: string;
  private lastRequestTime = 0;
  private minIntervalMs = 300; // Rate limit: at least 300ms between calls

  constructor(
    baseUrl = 'https://clashofclans.fandom.com/api.php',
    userAgent = 'VazoClash-Extractor/1.0 (Reverse Engineering Prototype; https://clashofclans.fandom.com/)'
  ) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  public async fetchApi<T>(params: Record<string, string | number>): Promise<T> {
    await this.throttle();

    const url = new URL(this.baseUrl);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    if (!url.searchParams.has('format')) {
      url.searchParams.set('format', 'json');
    }

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        logger.debug('MediaWikiAPI', `GET ${url.toString()}`);
        const res = await fetch(url.toString(), {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          throw new Error(`MediaWiki API HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json() as T;
        return data;
      } catch (err: any) {
        retries--;
        logger.warn('MediaWikiAPI', `Request failed: ${err.message}. Retries left: ${retries}`);
        if (retries === 0) {
          logger.error('MediaWikiAPI', `Final failure fetching: ${url.toString()}`, err);
          throw err;
        }
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }

    throw new Error(`Exhausted retries fetching ${url.toString()}`);
  }

  public async getPageInfo(title: string): Promise<PageMetadataResult | null> {
    const data = await this.fetchApi<{
      query?: {
        pages?: Record<string, PageMetadataResult>;
      };
    }>({
      action: 'query',
      prop: 'info|revisions',
      titles: title,
      rvprop: 'ids|timestamp|user|comment',
      inprop: 'url'
    });

    if (!data.query?.pages) return null;
    const pageKey = Object.keys(data.query.pages)[0];
    const page = data.query.pages[pageKey];
    if (page.missing) {
      logger.warn('MediaWikiAPI', `Page ${title} is reported missing.`);
      return null;
    }
    return page;
  }

  public async parsePage(
    title: string,
    props: string[] = ['wikitext', 'sections', 'images', 'templates', 'categories'],
    section?: number | string
  ): Promise<ParseResult | null> {
    const params: Record<string, string | number> = {
      action: 'parse',
      page: title,
      prop: props.join('|'),
      redirects: 1
    };
    if (section !== undefined) {
      params.section = section;
    }

    const data = await this.fetchApi<{
      parse?: ParseResult;
      error?: any;
    }>(params);

    if (data.error) {
      logger.error('MediaWikiAPI', `Error parsing page ${title}`, data.error);
      return null;
    }

    return data.parse ?? null;
  }

  public async getParsedHtml(title: string): Promise<{ text: string; revid: number } | null> {
    const data = await this.fetchApi<{
      parse?: {
        text?: { '*': string };
        revid: number;
      };
      error?: any;
    }>({
      action: 'parse',
      page: title,
      prop: 'text',
      redirects: 1
    });

    if (data.error || !data.parse?.text?.['*']) {
      return null;
    }

    return {
      text: data.parse.text['*'],
      revid: data.parse.revid
    };
  }

  public async getImageInfoBatch(filenames: string[]): Promise<Map<string, ImageInfoItem>> {
    const results = new Map<string, ImageInfoItem>();
    if (filenames.length === 0) return results;

    // MediaWiki allows up to 50 titles per request
    const batchSize = 40;
    for (let i = 0; i < filenames.length; i += batchSize) {
      const batch = filenames.slice(i, i + batchSize);
      const normalizedTitles = batch.map(f => f.startsWith('File:') ? f : `File:${f}`);

      const data = await this.fetchApi<{
        query?: {
          pages?: Record<string, {
            title: string;
            imageinfo?: ImageInfoItem[];
            missing?: boolean;
          }>;
        };
      }>({
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'url|size|mime|sha1|dimensions',
        titles: normalizedTitles.join('|')
      });

      if (data.query?.pages) {
        for (const page of Object.values(data.query.pages)) {
          if (!page.missing && page.imageinfo && page.imageinfo.length > 0) {
            const rawTitle = page.title.replace(/^File:/i, '');
            results.set(rawTitle, page.imageinfo[0]);
            results.set(page.title, page.imageinfo[0]);
          }
        }
      }
    }

    return results;
  }
}

export const mediaWikiClient = new MediaWikiClient();
