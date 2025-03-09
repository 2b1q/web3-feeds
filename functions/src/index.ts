import * as functions from 'firebase-functions';
import { getAllFeeds } from './rss';
import { telegramBotWebhook } from './bot/bot';

exports.getAllFeeds = functions.https.onRequest(getAllFeeds);

exports.telegramBotWebhook = functions.https.onRequest(async (req, res) => {
    await telegramBotWebhook(req, res);
});