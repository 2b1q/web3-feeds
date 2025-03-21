const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

if (!BOT_TOKEN || !CF_API_TOKEN) {
    console.error('❌ Missing BOT_TOKEN or CF_API_TOKEN in environment variables.');
    process.exit(1);
}

const CF_FEEDS_URL = 'https://us-central1-web3-feeds.cloudfunctions.net/getAllFeeds';

const bot = new Telegraf(BOT_TOKEN);

const NEWS_PROVIDERS = {
    coindesk: 0,
    cointelegraph: 1,
    decrypt: 2
};

const DEFAULT_NEWS_COUNT = 3;
const MAX_NEWS_COUNT = 10;

const ERROR_MESSAGES = {
    COMMON_USER_RSS_ERROR: '❌ Ошибка загрузки новостей.',
    PROVIDER_NOT_FOUND: '❌ Неизвестный провайдер. Доступные провайдеры: coindesk, cointelegraph, decrypt.',
    NO_RSS_DATA: '❌ Не удалось получить данные от RSS провайдеров.',
    FETCH_ERROR: '❌ Ошибка получения новостей.',
    TOO_MANY_NEWS: `❌ Нельзя запрашивать больше ${MAX_NEWS_COUNT} новостей за раз.`,
    INVALID_COMMAND: `❌ Неизвестная команда.\n\n📌 Доступные команды:\n` +
                     '/news - получить последние 3 новости от всех провайдеров\n' +
                     '/news [provider] - получить новости от определённого провайдера (coindesk, cointelegraph, decrypt)\n' +
                     `/news [provider] [n] - получить последние n новостей от провайдера (макс. ${MAX_NEWS_COUNT})\n` +
                     `/news all [n] - получить последние n новостей от всех провайдеров (макс. ${MAX_NEWS_COUNT})`
};

const formatNews = (sourceTitle, items, count) => {
    if (!Array.isArray(items) || items.length === 0) {
        console.warn(`⚠️ Warning: Data from ${sourceTitle} is empty or invalid.`);
        return `<b>🔹 ${sourceTitle} 🔹</b>\n\n${ERROR_MESSAGES.COMMON_USER_RSS_ERROR}`;
    }

    const newsItems = items.slice(0, count).map((item, index) => {
        const date = new Date(item.pubDate).toLocaleString('ru-RU');
        return `📰 <b>${index + 1}. ${item.title}</b>\n📅 ${date}\n<a href="${item.link}">Читать полностью</a>`;
    }).join('\n\n');

    return `<b>🔹 ${sourceTitle} 🔹</b>\n\n${newsItems}`;
};

const safelyParseRssChannel = (channelData, providerName) => {
    try {
        return parseRssChannel(channelData);
    } catch (error) {
        console.error(`❌ Error parsing data for provider ${providerName}:`, error);
        return [];
    }
};

function parseRssChannel(channelData) {
    if (!channelData || typeof channelData !== 'object' || !Array.isArray(channelData.items)) {
        console.warn('⚠️ Warning: Failed to parse RSS provider data:', channelData);
        return [];
    }
    return channelData.items.map((item) => ({
        title: item.title || 'Без названия',
        pubDate: item.pubDate || 'Нет даты',
        link: item.link || '#',
        id: item.id || '',
        author: item.author || 'Неизвестный автор',
        thumbnail: item.thumbnail || '',
        description: item.description || 'Описание отсутствует'
    }));
};

bot.command('news', async (ctx) => {
    logRequest(ctx, '/news');

    const input = ctx.message.text.split(' ').slice(1);
    const requestedProvider = input[0]?.toLowerCase();
    let newsCount = parseInt(input[1], 10) || DEFAULT_NEWS_COUNT;

    if (newsCount > MAX_NEWS_COUNT) {
        console.warn(`⚠️ Warning: User requested ${newsCount} news, exceeding the limit of ${MAX_NEWS_COUNT}.`);
        return ctx.reply(ERROR_MESSAGES.TOO_MANY_NEWS);
    }

    try {
        const response = await axios.get(CF_FEEDS_URL, {
            headers: { Authorization: `Bearer ${CF_API_TOKEN}` }
        });

        if (!response.data || !response.data.length) {
            console.warn('⚠️ Warning: Failed to fetch RSS provider data.');
            return ctx.reply(ERROR_MESSAGES.NO_RSS_DATA);
        }

        const providersMap = {
            coindesk: safelyParseRssChannel(response.data[NEWS_PROVIDERS.coindesk], 'coindesk'),
            cointelegraph: safelyParseRssChannel(response.data[NEWS_PROVIDERS.cointelegraph], 'cointelegraph'),
            decrypt: safelyParseRssChannel(response.data[NEWS_PROVIDERS.decrypt], 'decrypt')
        };

        let formattedNews;

        if (requestedProvider && providersMap[requestedProvider]) {
            formattedNews = formatNews(requestedProvider, providersMap[requestedProvider], newsCount);
        } else if (!requestedProvider || requestedProvider === 'all') {
            formattedNews = Object.entries(providersMap)
                .map(([provider, items]) => formatNews(provider, items, newsCount))
                .join('\n\n—————————————\n\n');
        } else {
            return ctx.reply(ERROR_MESSAGES.PROVIDER_NOT_FOUND);
        }

        ctx.replyWithHTML(formattedNews, { disable_web_page_preview: false });

    } catch (error) {
        console.error('❌ Error fetching news:', error);
        ctx.reply(ERROR_MESSAGES.FETCH_ERROR);
    }
});

bot.on('text', (ctx) => {
    logRequest(ctx, 'UNKNOWN_COMMAND');
    ctx.reply(ERROR_MESSAGES.INVALID_COMMAND);
});

function logRequest(ctx, command) {
    const user = ctx.from;
    console.log(`📥 Command: ${command}`);
    console.log(`👤 User: ${user.first_name} ${user.last_name || ''} (@${user.username || 'N/A'})`);
    console.log(`🆔 User ID: ${user.id}\n`);
}

bot.launch();