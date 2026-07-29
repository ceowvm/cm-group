<?php
declare(strict_types=1);

return [
    // Токен бота из @BotFather. Никогда не добавляйте реальный токен в GitHub.
    'bot_token' => 'PASTE_BOT_TOKEN_HERE',
    'allowed_origin' => 'https://app.cmgroup.pro',
    'auth_max_age' => 86400,

    // Постоянные данные пользователей. Эту папку нельзя удалять при обновлении приложения.
    // Путь указывает на /data в корне сайта, отдельно от исполняемого кода /api.
    'storage_path' => dirname(__DIR__) . '/data',

    // HTTPS webhook SaleBot/CRM для передачи имени, телефона, квиза и заявок.
    'event_webhook_url' => '',
    'event_webhook_secret' => '',
];