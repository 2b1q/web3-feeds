import * as tg from 'telegraf/types';
import { Context, NarrowedContext } from 'telegraf';
import { Message, Update } from '@telegraf/types';
import * as functions from 'firebase-functions';
import { ERROR_MESSAGES } from '../bot.interface';
import { RssItem } from '../../rss/interfaces';

const NEWS_TEMPLATES = {
    sourceTitle: (title: string) => `<b>🔹 ${title} 🔹</b>`,
    itemNumberAndTitle: (index: number, title: string) => `📰 <b>${index}. ${title}</b>`,
    itemDate: (dateString: string) => `📅 ${dateString}`,
    itemLink: (link: string) => `<a href="${link}">Читать полностью</a>`,
    errorBlock: (title: string) =>
        `<b>🔹 ${title} 🔹</b>\n\n${ERROR_MESSAGES.COMMON_USER_RSS_ERROR}`,
};

function composeNewsItem(item: RssItem, index: number): string {
    const date = new Date(item.pubDate).toLocaleString('ru-RU');
    return [
        NEWS_TEMPLATES.itemNumberAndTitle(index, item.title),
        NEWS_TEMPLATES.itemDate(date),
        NEWS_TEMPLATES.itemLink(item.link),
    ].join('\n');
}

export function formatNews(sourceTitle: string, items: RssItem[], count: number): string {
    if (!Array.isArray(items) || items.length === 0) {
        functions.logger.warn(`⚠️ Warning: Data from ${sourceTitle} is empty or invalid.`);
        return NEWS_TEMPLATES.errorBlock(sourceTitle);
    }

    const limitedItems = items.slice(0, count);
    const newsItems = limitedItems
        .map((item, idx) => composeNewsItem(item, idx + 1))
        .join('\n\n');

    return `${NEWS_TEMPLATES.sourceTitle(sourceTitle)}\n\n${newsItems}`;
}

export function safelyParseRssChannel(channelData: any, providerName: string): RssItem[] {
    try {
        return parseRssChannel(channelData);
    } catch (error) {
        functions.logger.error(`❌ Error parsing data for provider ${providerName}:`, error);
        return [];
    }
}

function parseRssChannel(channelData: any): RssItem[] {
    if (!channelData || typeof channelData !== 'object' || !Array.isArray(channelData.items)) {
        functions.logger.warn('⚠️ Warning: Failed to parse RSS provider data:', channelData);
        return [];
    }

    return channelData.items.map((item: any) => ({
        title: item.title || 'Без названия',
        pubDate: item.pubDate || 'Нет даты',
        link: item.link || '#',
        id: item.id || '',
        author: item.author || 'Неизвестный автор',
        thumbnail: item.thumbnail || '',
        description: item.description || 'Описание отсутствует',
    }));
}

export function logRequest(update: tg.Update): void {
    if (update && 'message' in update) {
        const command = 'text' in update.message ? update.message.text : '';
        const user = update.message.from;

        functions.logger.info("Received command", {
            command,
            user: {
                id: user.id,
                username: user.username || 'unknown',
                first_name: user.first_name,
                last_name: user.last_name || '',
                language_code: user.language_code || 'unknown'
            }
        });
    }
}

/**
 * Returns a combined string of formatted news, for one or more providers.
 * @param ctx               Telegraf context, used for replying with errors
 * @param requestedProvider Specific provider name (or 'all')
 * @param providersMap      Map of provider -> RssItem[]
 * @param newsCount         Number of news items to show
 */
export function getFormattedNews(
    ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message.TextMessage>>,
    requestedProvider: string | null,
    providersMap: Record<string, RssItem[]>,
    newsCount: number
): string {
    if (requestedProvider && providersMap[requestedProvider]) {
        return formatNews(requestedProvider, providersMap[requestedProvider], newsCount);
    }

    if (!requestedProvider || requestedProvider === 'all') {
        const outputs: string[] = [];
        for (const providerName in providersMap) {
            outputs.push(formatNews(providerName, providersMap[providerName], newsCount));
        }
        return outputs.join('\n\n—————————————\n\n');
    }

    ctx.reply(ERROR_MESSAGES.PROVIDER_NOT_FOUND);
    return '';
}