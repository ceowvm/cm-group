<?php
declare(strict_types=1);

return [
    // Токен бота из @BotFather. Никогда не добавляйте реальный токен в GitHub.
    'bot_token' => 'PASTE_BOT_TOKEN_HERE',
    'allowed_origin' => 'https://app.cmgroup.pro',
    'auth_max_age' => 86400,

    // auto — PDO/SQLite при наличии расширения, иначе защищённые JSON-файлы.
    // Для REG.RU можно оставить auto: отдельная база на первом этапе не обязательна.
    'storage_driver' => 'auto',
    'storage_path' => __DIR__ . '/storage',
    'database' => [
        'dsn' => 'sqlite:' . __DIR__ . '/storage/cm_group.sqlite',
        'user' => null,
        'password' => null,
    ],

    // Необязательно: HTTPS webhook SaleBot/CRM для автоматической передачи событий.
    'event_webhook_url' => '',
    'event_webhook_secret' => '',
];
