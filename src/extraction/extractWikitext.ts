import { MediaWikiClient, mediaWikiClient, ParseResult } from '../api/mediawiki.js';
import { logger } from '../utils/logger.js';

export interface ExtractedWikitextData {
  pageTitle: string;
  wikitext: string;
  sections: Array<{
    line: string;
    level: string;
    number: string;
    index: string;
  }>;
  templates: string[];
  categories: string[];
}

export class WikitextExtractor {
  private client: MediaWikiClient;

  constructor(client: MediaWikiClient = mediaWikiClient) {
    this.client = client;
  }

  public async extract(pageTitle: string): Promise<ExtractedWikitextData> {
    logger.info('WikitextExtractor', `Extracting wikitext for "${pageTitle}"`);
    const parse = await this.client.parsePage(pageTitle, [
      'wikitext',
      'sections',
      'templates',
      'categories'
    ]);

    if (!parse || !parse.wikitext?.['*']) {
      throw new Error(`Failed to extract wikitext for page "${pageTitle}".`);
    }

    const wikitext = parse.wikitext['*'];
    const sections = (parse.sections || []).map(s => ({
      line: s.line,
      level: s.level,
      number: s.number,
      index: s.index
    }));
    const templates = (parse.templates || []).map(t => t['*']);
    const categories = (parse.categories || []).map(c => c['*']);

    logger.info(
      'WikitextExtractor',
      `Extracted wikitext (${wikitext.length} chars, ${sections.length} sections, ${templates.length} templates) for "${pageTitle}"`
    );

    return {
      pageTitle,
      wikitext,
      sections,
      templates,
      categories
    };
  }
}

export const wikitextExtractor = new WikitextExtractor();
