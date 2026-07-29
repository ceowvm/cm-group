<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    cm_fail('Метод не поддерживается', 405);
}

$config = cm_config();
$token = trim((string) ($config['bot_token'] ?? ''));
$botConfigured = $token !== '' && $token !== 'PASTE_BOT_TOKEN_HERE';

try {
    $storage = cm_storage_driver();
    if ($storage === 'pdo') {
        cm_db();
    } else {
        cm_storage_path();
    }
    $storageOk = true;
} catch (Throwable $exception) {
    error_log('[CM Group API] Health check failed: ' . $exception->getMessage());
    $storage = null;
    $storageOk = false;
}

cm_response([
    'ok' => $storageOk && $botConfigured,
    'api_version' => CM_API_VERSION,
    'php_version' => PHP_VERSION,
    'storage' => $storage,
    'storage_ok' => $storageOk,
    'bot_configured' => $botConfigured,
]);
