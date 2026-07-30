<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/salebot.php';

cm_security_headers();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') cm_response(['ok' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') cm_fail('Метод не поддерживается', 405);

try {
    $path = cm_salebot_debug_path();
    if (!is_file($path)) {
        cm_response([
            'ok' => true,
            'configured' => cm_salebot_configured(),
            'message' => 'Диагностика пока отсутствует. Отправьте тестовую заявку из приложения.',
        ]);
    }

    $raw = file_get_contents($path);
    $diagnostic = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    if (!is_array($diagnostic)) cm_fail('Не удалось прочитать диагностику', 500);

    if (isset($diagnostic['telegram_id'])) {
        $id = (string)$diagnostic['telegram_id'];
        $diagnostic['telegram_id'] = strlen($id) > 4 ? str_repeat('*', strlen($id) - 4) . substr($id, -4) : $id;
    }

    cm_response(['ok' => true, 'diagnostic' => $diagnostic]);
} catch (Throwable $exception) {
    cm_fail('Ошибка чтения диагностики', 500, $exception);
}
