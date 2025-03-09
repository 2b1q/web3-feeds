export const NEWS_PROVIDERS = {
    coindesk: 0,
    cointelegraph: 1,
    decrypt: 2,
};

export const DEFAULT_NEWS_COUNT = 3;
export const MAX_NEWS_COUNT = 10;

export const ERROR_MESSAGES = {
    COMMON_USER_RSS_ERROR: '❌ Ошибка загрузки новостей.',
    PROVIDER_NOT_FOUND: '❌ Неизвестный провайдер. Доступные провайдеры: coindesk, cointelegraph, decrypt.',
    NO_RSS_DATA: '❌ Не удалось получить данные от RSS провайдеров.',
    FETCH_ERROR: '❌ Ошибка получения новостей.',
    TOO_MANY_NEWS: `❌ Нельзя запрашивать больше ${MAX_NEWS_COUNT} новостей за раз.`,
    INVALID_COMMAND: `❌ Неизвестная команда.\n\n📌 Доступные команды:\n` +
        '/news - получить последние 3 новости от всех провайдеров\n' +
        '/news [provider] - получить новости от определённого провайдера (coindesk, cointelegraph, decrypt)\n' +
        `/news [provider] [n] - получить последние n новостей (макс. ${MAX_NEWS_COUNT})\n` +
        `/news all [n] - получить последние n новостей от всех провайдеров (макс. ${MAX_NEWS_COUNT})`,
};