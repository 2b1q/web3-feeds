import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { BaseRssItem, errors, httpCode, RssChannelResponse, RssItem, RssResponse, RssSourse } from './interfaces';
import { HttpsError } from 'firebase-functions/https';
import { defineString } from 'firebase-functions/params';
import { callOpts, RSS_FEEDS } from './config';

const API_KEY = defineString('API_KEY').value();

function validateAuth(req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        functions.logger.error('Unauthorized access attempt');
        throw new HttpsError(httpCode.BAD_AUTH, errors.BAD_AUTH);
    }
}

async function fetchRssFeed(rssSource: RssSourse): Promise<RssResponse | void> {
    try {
        const response = await axios.get(rssSource.rssURI, { headers: { 'Content-Type': 'text/xml' } });
        if (!response.data) return;

        const parser = new XMLParser({ allowBooleanAttributes: true, parseAttributeValue: true, ignoreAttributes: false });

        return parser.parse(response.data);
    } catch (error) {
        functions.logger.error(`Error fetching RSS feed from ${rssSource.title}:`, error);
    }
}

function transformRssResponse(rssResponse: RssResponse): RssChannelResponse | null {
    if (!rssResponse || !rssResponse.rss || !rssResponse.rss.channel) return null;
    const { channel } = rssResponse.rss;

    return {
        title: channel.title,
        link: channel.link,
        description: channel.description,
        language: channel.language,
        items: channel.item?.map(transformRssItem) || [],
    };
}

function transformRssItem(item: BaseRssItem): RssItem {
    const mediaContent = item['media:content'];
    const mediaUrl = (
        typeof mediaContent === 'object' && '@_url' in mediaContent
            ? mediaContent['@_url']
            : ''
    ) || item['media:thumbnail']?.['@_url'] || '';

    return {
        id: typeof item.guid === 'object' ? item.guid['#text'] : item.guid,
        pubDate: item.pubDate,
        author: item['dc:creator'] || '',
        thumbnail: mediaUrl,
        description: item.description || item.title,
        link: item.link,
        title: item.title,
    };
}

exports.getAllFeeds = functions.https.onRequest(callOpts, async (req: Request, res: Response) => {
    validateAuth(req);

    try {
        const rssResponses = await Promise.all(RSS_FEEDS.map(fetchRssFeed));
        const validRssResponses = rssResponses.filter((response): response is RssResponse => response !== undefined);
        const transformedFeeds = validRssResponses.map(transformRssResponse).filter(Boolean);
        res.json(transformedFeeds);
    } catch (error) {
        functions.logger.error('Error fetching all RSS feeds:', error);

        throw new HttpsError(httpCode.INTERNAL, errors.INTERNAL);
    }
});