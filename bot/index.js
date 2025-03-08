const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

if (!BOT_TOKEN || !CF_API_TOKEN) {
    console.error('Please provide BOT_TOKEN and CF_API_TOKEN .env variables');
    process.exit(1);
}

const CF_FEEDS_URL = 'https://us-central1-web3-feeds.cloudfunctions.net/getAllFeeds';

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('Привет! Напиши /news чтобы получить последние новости.'));

bot.command('news', async (ctx) => {
    try {
        const response = await axios.get(CF_FEEDS_URL, {
            headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
        });

        const [coindesc, cointelegraph, decrypt] = response.data;

        const formatNews = (sourceTitle, items) => {
            const newsItems = items.slice(0, 3).map((item, index) => {
                const date = new Date(item.pubDate).toLocaleString('ru-RU');
                return `📰 <b>${index + 1}. ${item.title}</b>\n📅 ${date}\n<a href=\"${item.link}\">Читать полностью</a>`;
            }).join('\n\n');

            return `<b>🔹 ${sourceTitle} 🔹</b>\n\n${newsItems}`;
        };

        const formattedNews = [
            formatNews('CoinDesk', coindesc.items),
            formatNews('Cointelegraph', cointelegraph.items),
            formatNews('Decrypt', decrypt.items)
        ].join('\n───────────────\n');

        await ctx.replyWithHTML(formattedNews);

    } catch (error) {
        console.error(error);
        ctx.reply('❌ Не удалось получить новости.');
    }
});

bot.launch();
