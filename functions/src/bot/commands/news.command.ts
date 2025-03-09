import { Context, NarrowedContext } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';

import {
    ERROR_MESSAGES,
    DEFAULT_NEWS_COUNT,
    MAX_NEWS_COUNT,
} from '../bot.interface';

import { getFormattedNews, safelyParseRssChannel } from '../utils/indes';
import { RSS_FEEDS } from '../../rss/config';
import { fetchRssFeed, transformRssResponse } from '../../rss';
import { RssItem } from '../../rss/interfaces';

export async function newsCommand(
    ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message.TextMessage>>
) {
    const input = ctx.message.text.split(' ').slice(1);
    const requestedProvider = input[0]?.toLowerCase();
    let newsCount = parseInt(input[1], 10) || DEFAULT_NEWS_COUNT;

    if (newsCount > MAX_NEWS_COUNT) {
        console.warn(`⚠️ Warning: User requested ${newsCount} news, exceeding the limit of ${MAX_NEWS_COUNT}.`);
        return ctx.reply(ERROR_MESSAGES.TOO_MANY_NEWS);
    }

    try {
        // Fetch RSS data in parallel
        const rssResponses = await Promise.allSettled(RSS_FEEDS.map(fetchRssFeed));

        // Filter out failed
        const successfulResponses = rssResponses
            .filter(
                (result): result is PromiseFulfilledResult<any> =>
                    result.status === 'fulfilled' && result.value !== undefined,
            )
            .map((result) => result.value);

        // Transform RSS responses
        const transformedFeeds = successfulResponses
            .map(transformRssResponse)
            .filter(Boolean);

        if (!transformedFeeds.length) {
            console.warn('⚠️ Warning: No RSS data available.');
            return ctx.reply(ERROR_MESSAGES.NO_RSS_DATA);
        }

        const providersMap: Record<string, RssItem[]> = {
            coindesk: safelyParseRssChannel(transformedFeeds[0], 'coindesk'),
            cointelegraph: safelyParseRssChannel(transformedFeeds[1], 'cointelegraph'),
            decrypt: safelyParseRssChannel(transformedFeeds[2], 'decrypt'),
        };

        const formattedNews = getFormattedNews(ctx, requestedProvider, providersMap, newsCount);

        // Reply with the final formatted string
        await ctx.replyWithHTML(formattedNews, {
            disable_web_page_preview: false,
        } as any);
    } catch (error) {
        console.error('❌ Error fetching news:', error);
        ctx.reply(ERROR_MESSAGES.FETCH_ERROR);
    }

    return;
}