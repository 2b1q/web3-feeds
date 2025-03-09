import { Request } from 'express';
import { ERROR_MESSAGES } from '../bot.interface';
import { Context, NarrowedContext } from 'telegraf';
import { Message, Update } from '@telegraf/types';
import * as functions from 'firebase-functions';

interface RssItem {
    title: string;
    pubDate: string;
    link: string;
    id: string;
    author: string;
    thumbnail: string;
    description: string;
}

export function formatNews(sourceTitle: string, items: RssItem[], count: number): string {
    if (!Array.isArray(items) || items.length === 0) {
        functions.logger.warn(`⚠️ Warning: Data from ${sourceTitle} is empty or invalid.`);
        return `<b>🔹 ${sourceTitle} 🔹</b>\n\n${ERROR_MESSAGES.COMMON_USER_RSS_ERROR}`;
    }

    const newsItems = items.slice(0, count).map((item, index) => {
        const date = new Date(item.pubDate).toLocaleString('ru-RU');
        return `📰 <b>${index + 1}. ${item.title}</b>\n📅 ${date}\n<a href="${item.link}">Читать полностью</a>`;
    }).join('\n\n');

    return `<b>🔹 ${sourceTitle} 🔹</b>\n\n${newsItems}`;
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

export function logRequest(req: Request) {
    functions.logger.info('Incoming Telegram update:', req.body);
}

export function getFormattedNews(
    ctx: NarrowedContext<Context<Update>, Update.MessageUpdate<Message.TextMessage>>,
    requestedProvider: string | null,
    providersMap: Record<string, any>,
    newsCount: number): string {
    let formattedNews = '';

    if (requestedProvider && providersMap[requestedProvider]) {
        // Single provider
        formattedNews = formatNews(requestedProvider, providersMap[requestedProvider], newsCount);
    } else if (!requestedProvider || requestedProvider === 'all') {
        // All providers
        const outputs: string[] = [];
        for (const provider in providersMap) {
            outputs.push(formatNews(provider, providersMap[provider], newsCount));
        }
        formattedNews = outputs.join('\n\n—————————————\n\n');
    } else {
        ctx.reply(ERROR_MESSAGES.PROVIDER_NOT_FOUND);
        return formattedNews
    }

    return formattedNews;
}