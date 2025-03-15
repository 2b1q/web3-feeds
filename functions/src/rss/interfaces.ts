export enum NewsProvider {
    COINDESK = 'coindesk',
    COINTELEGRAPH = 'cointelegraph',
    DECRYPT = 'decrypt'
}

export type RssGuid =
    | {
        '#text': string;
        '@_isPermaLink': boolean;
    }
    | string;

export interface RssEnclosure {
    '@_url'?: string;
    '@_length'?: number;
    '@_type'?: string;
}

export type RssMediaDescription = { '#text': string; '@_type': string } | string;

export interface RssMedia {
    '@_url'?: string;
    '@_medium'?: string;
}

export type RssMediaContent =
    | {
        '@_length'?: number;
        '@_type'?: string;
        '@_url'?: string;
    }
    | RssMedia
    | ({
        'media:thumbnail'?: {
            '@_url'?: string;
        };
    } & RssMedia)
    | string;

export interface RssCategory {
    '#text': string;
    '@_domain': string;
}

export interface BaseRssItem {
    title: string;
    link: string;
    pubDate: string;
    guid: RssGuid;
    description: string;
    enclosure?: RssEnclosure;
    'media:content'?: RssMediaContent;
    'media:thumbnail'?: {
        '@_url'?: string;
    };
    category: RssCategory | string | string[] | RssCategory[];
    'dc:creator'?: string;
}

export type RssItem = Pick<BaseRssItem, 'title' | 'pubDate' | 'link' | 'description'> & {
    id: string;
    author: string;
    thumbnail: string;
}
export interface RssResponse<T = BaseRssItem> {
    rss: {
        channel: {
            link: string;
            title: string;
            description: string;
            language: string;
            item: T[];
        };
    };
}

export interface RssSourse {
    title: string;
    logoURI: string;
    rssURI: string;
}


export interface RssChannelResponse {
    link: string;
    title: string;
    description: string;
    language: string;
    items: RssItem[];
}

// infra entities/interfaces
export enum httpCode {
    BAD_AUTH = 401,
    BAD_PAYLOAD = 400,
    NOT_FOUND = 404,
    ABORTED = 409,
    INTERNAL = 500,
}

export const errors = {
    BAD_AUTH: 'Auth error',
    BAD_PAYLOAD: 'Invalid payload',
    INTERNAL: 'Internal Server Error',
    NOT_FOUND: 'Not Found',
    UNAUTHORIZED: 'Unauthorized',
    ABORTED: 'Operation aborted',
    RSS_EMPTY_DATA: 'No Data Returned from RSS',
    RSS_FETCH_FAILED: 'Failed to Fetch RSS'
};