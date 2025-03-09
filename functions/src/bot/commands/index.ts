import { Telegraf } from 'telegraf';
import { newsCommand } from './news.command';

export function setupCommands(bot: Telegraf) {
    bot.command('news', (ctx) => newsCommand(ctx));
}