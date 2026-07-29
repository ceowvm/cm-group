<?php
declare(strict_types=1);

return [
    // Токен бота из @BotFather. Никогда не добавляйте реальный токен в GitHub.
    'bot_token' => 'PASTE_BOT_TOKEN_HERE',
    'allowed_origin' => 'https://app.cmgroup.pro',
    'auth_max_age' => 86400,

    // Профили и события сохраняются в защищённой папке на REG.RU.
    'storage_path' => __DIR__ . '/storage',

    // Необязательно: HTTPS webhook SaleBot/CRM для автоматической передачи событий.
    'event_webhook_url' => '',
    'event_webhook_secret' => '',
];
