import { CallableOptions } from "firebase-functions/https";

export const RSS_FEEDS = [
    {
        title: 'CoinDesk',
        logoURI:
            'https://www.coindesk.com/resizer/fTK3gATlyciJ-BZG2_OP12niDe0=/144x32/downloads.coindesk.com/arc/failsafe/feeds/coindesk-feed-logo.png',
        rssURI: 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
    },
    {
        title: 'Cointelegraph',
        logoURI: 'https://cointelegraph.com/assets/img/CT_Logo_YG_tag.png',
        rssURI: 'https://cointelegraph.com/rss',
    },
    {
        title: 'Decrypt',
        logoURI: '',
        rssURI: 'https://decrypt.co/feed',
    },
];

export const callOpts = {
    memory: '256MiB',
    concurrency: 1,
} as CallableOptions;