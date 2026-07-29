<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$user = cm_validate_telegram_user();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $record = cm_profile_get($user['id']);
    } catch (Throwable $exception) {
        cm_fail('Не удалось загрузить профиль', 500, $exception);
    }
    $profile = $record ? [
        'state' => $record['state'] ?? null,
        'created_at' => $record['created_at'] ?? null,
        'updated_at' => $record['updated_at'] ?? null,
    ] : null;
    cm_response(['ok' => true, 'profile' => $profile, 'telegram_user' => $user, 'storage' => cm_storage_driver(), 'api_version' => CM_API_VERSION]);
}

if ($method === 'POST') {
    $body = cm_request_body();
    $state = cm_clean_state($body['state'] ?? null);
    try {
        $savedAt = cm_profile_save($user, $state);
    } catch (Throwable $exception) {
        cm_fail('Не удалось сохранить профиль', 500, $exception);
    }
    cm_response(['ok' => true, 'saved_at' => $savedAt, 'storage' => cm_storage_driver()]);
}

if ($method === 'DELETE') {
    try {
        cm_profile_delete($user['id']);
    } catch (Throwable $exception) {
        cm_fail('Не удалось удалить профиль', 500, $exception);
    }
    cm_response(['ok' => true]);
}

cm_fail('Метод не поддерживается', 405);
