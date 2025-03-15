
import { Telegraf } from 'telegraf';
import { defineString } from 'firebase-functions/params';
import { Request, Response } from 'express';

import { setupHandlers } from './bot.handlers';
import { setupCommands } from './commands';
import { logRequest } from './utils/indes';

const BOT_TOKEN = defineString('BOT_TOKEN');

export const bot = new Telegraf(BOT_TOKEN.value());

setupCommands(bot);
setupHandlers(bot);

// webhook entry point
export async function telegramBotWebhook(req: Request, res: Response) {
    logRequest(req);
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Error in telegramBotWebhook:', err);
        res.status(500).send('Internal bot error');
    }
}