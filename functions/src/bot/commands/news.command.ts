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
import { NewsProvider, RssItem } from '../../rss/interfaces';

export async function newsCommand(ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message.TextMessage>>): Promise<void> {
    const input = ctx.message.text.split(' ').slice(1);
    const requestedProvider = input[0]?.toLowerCase();
    let newsCount = parseInt(input[1], 10) || DEFAULT_NEWS_COUNT;

    if (newsCount > MAX_NEWS_COUNT) {
        ctx.reply(ERROR_MESSAGES.TOO_MANY_NEWS);
        return
    }

    try {
        const rssResponses = await Promise.allSettled(RSS_FEEDS.map(fetchRssFeed));

        const successfulResponses = rssResponses
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value);

        const transformedFeeds = successfulResponses
            .map(transformRssResponse)
            .filter(Boolean);

        if (!transformedFeeds.length) {
            ctx.reply(ERROR_MESSAGES.NO_RSS_DATA);
            return
        }

        const providersMap: Record<string, RssItem[]> = {
            [NewsProvider.COINDESK]: safelyParseRssChannel(transformedFeeds[0], NewsProvider.COINDESK),
            [NewsProvider.COINTELEGRAPH]: safelyParseRssChannel(transformedFeeds[1], NewsProvider.COINTELEGRAPH),
            [NewsProvider.DECRYPT]: safelyParseRssChannel(transformedFeeds[2], NewsProvider.DECRYPT),
        };

        const formattedNews = getFormattedNews(ctx, requestedProvider, providersMap, newsCount);

        if (!formattedNews) return

        await ctx.replyWithHTML(formattedNews);
    } catch (error) {
        console.error('Error fetching news:', error);
        ctx.reply(ERROR_MESSAGES.FETCH_ERROR);
    }
}