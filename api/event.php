<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    cm_fail('Метод не поддерживается', 405);
}

$user = cm_validate_telegram_user();
$body = cm_request_body();
$eventName = (string) ($body['event'] ?? '');
if (!preg_match('/^[a-z0-9_]{1,80}$/', $eventName)) {
    cm_fail('Некорректное имя события', 422);
}
$payload = is_array($body['payload'] ?? null) ? $body['payload'] : [];
$payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
if (strlen($payloadJson) > 32768) {
    cm_fail('Событие превышает допустимый размер', 413);
}

$now = gmdate(DATE_ATOM);
try {
    cm_event_store($user['id'], $eventName, $payload, $now);
    $profile = cm_profile_get($user['id']);
} catch (Throwable $exception) {
    cm_fail('Не удалось сохранить событие', 500, $exception);
}

$forwarded = cm_forward_event([
    'event' => $eventName,
    'payload' => $payload,
    'telegram_user' => $user,
    'profile' => $profile ? [
        'name' => $profile['name'] ?? '',
        'phone' => $profile['phone'] ?? '',
        'consent' => (bool) ($profile['consent'] ?? false),
        'state' => $profile['state'] ?? null,
    ] : null,
    'created_at' => $now,
    'source' => 'cm_group_miniapp',
]);

cm_response(['ok' => true, 'stored' => true, 'forwarded' => $forwarded, 'storage' => cm_storage_driver()]);
