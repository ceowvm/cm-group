<?php
declare(strict_types=1);

const CM_API_VERSION = '3.0.0';

function cm_config(): array
{
    static $config = null;
    if (is_array($config)) return $config;

    $localFile = __DIR__ . '/config.local.php';
    $local = is_file($localFile) ? require $localFile : [];
    if (!is_array($local)) $local = [];

    $defaults = [
        'bot_token' => getenv('CM_BOT_TOKEN') ?: '',
        'allowed_origin' => getenv('CM_ALLOWED_ORIGIN') ?: 'https://app.cmgroup.pro',
        'auth_max_age' => 86400,
        'storage_path' => getenv('CM_STORAGE_PATH') ?: __DIR__ . '/storage',
        'event_webhook_url' => getenv('CM_EVENT_WEBHOOK_URL') ?: '',
        'event_webhook_secret' => getenv('CM_EVENT_WEBHOOK_SECRET') ?: '',
    ];
    return $config = array_replace_recursive($defaults, $local);
}

function cm_limit_text(mixed $value, int $length): string
{
    $text = trim((string) $value);
    if (function_exists('mb_substr')) return mb_substr($text, 0, $length, 'UTF-8');
    if (function_exists('iconv_substr')) {
        $result = iconv_substr($text, 0, $length, 'UTF-8');
        if ($result !== false) return $result;
    }
    return substr($text, 0, $length);
}

function cm_security_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');

    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $allowed = (string) (cm_config()['allowed_origin'] ?? '');
    if ($origin !== '' && $allowed !== '' && hash_equals($allowed, $origin)) {
        header('Access-Control-Allow-Origin: ' . $allowed);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-Telegram-Init-Data');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
}

function cm_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function cm_fail(string $message, int $status = 400, ?Throwable $exception = null): never
{
    if ($exception !== null) error_log('[CM Group API] ' . $message . ': ' . $exception->getMessage());
    cm_response(['ok' => false, 'error' => $message], $status);
}

function cm_request_body(): array
{
    static $body = null;
    if (is_array($body)) return $body;

    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return $body = [];
    if (strlen($raw) > 131072) cm_fail('Слишком большой запрос', 413);

    try {
        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        cm_fail('Некорректный JSON', 400, $exception);
    }
    if (!is_array($decoded)) cm_fail('Тело запроса должно быть объектом', 400);
    return $body = $decoded;
}

function cm_init_data(): string
{
    $header = $_SERVER['HTTP_X_TELEGRAM_INIT_DATA'] ?? '';
    if (is_string($header) && $header !== '') return $header;
    $body = cm_request_body();
    return is_string($body['initData'] ?? null) ? $body['initData'] : '';
}

function cm_validate_telegram_user(): array
{
    $config = cm_config();
    $botToken = trim((string) ($config['bot_token'] ?? ''));
    if ($botToken === '' || $botToken === 'PASTE_BOT_TOKEN_HERE') {
        cm_fail('Сервер не настроен: отсутствует токен Telegram-бота', 503);
    }

    $initData = cm_init_data();
    if ($initData === '') cm_fail('Откройте приложение из Telegram-бота', 401);

    parse_str($initData, $fields);
    $receivedHash = $fields['hash'] ?? '';
    if (!is_string($receivedHash) || !preg_match('/^[a-f0-9]{64}$/i', $receivedHash)) {
        cm_fail('Некорректная подпись Telegram', 401);
    }
    unset($fields['hash']);
    ksort($fields, SORT_STRING);

    $pairs = [];
    foreach ($fields as $key => $value) {
        if (is_array($value)) cm_fail('Некорректные данные Telegram', 401);
        $pairs[] = $key . '=' . (string) $value;
    }
    $dataCheckString = implode("\n", $pairs);
    $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
    $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey);
    if (!hash_equals(strtolower($receivedHash), strtolower($calculatedHash))) {
        cm_fail('Данные Telegram не прошли проверку', 401);
    }

    $authDate = filter_var($fields['auth_date'] ?? null, FILTER_VALIDATE_INT);
    $maxAge = max(300, (int) ($config['auth_max_age'] ?? 86400));
    $now = time();
    if (!$authDate || $authDate > $now + 300 || $now - $authDate > $maxAge) {
        cm_fail('Сессия Telegram устарела. Откройте приложение заново', 401);
    }

    try {
        $user = json_decode((string) ($fields['user'] ?? ''), true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        cm_fail('Telegram не передал данные пользователя', 401, $exception);
    }
    if (!is_array($user) || !isset($user['id'])) cm_fail('Telegram не передал идентификатор пользователя', 401);

    $userId = preg_replace('/\D/', '', (string) $user['id']);
    if ($userId === '') cm_fail('Некорректный идентификатор пользователя', 401);

    return [
        'id' => $userId,
        'username' => cm_limit_text($user['username'] ?? '', 64),
        'first_name' => cm_limit_text($user['first_name'] ?? '', 128),
        'last_name' => cm_limit_text($user['last_name'] ?? '', 128),
        'language_code' => cm_limit_text($user['language_code'] ?? '', 16),
    ];
}

function cm_storage_path(): string
{
    $path = rtrim((string) (cm_config()['storage_path'] ?? (__DIR__ . '/storage')), '/\\');
    if ($path === '') cm_fail('Не настроена папка хранения данных', 503);
    if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
        cm_fail('Не удалось создать папку хранения данных', 503);
    }
    if (!is_writable($path)) cm_fail('Папка хранения данных недоступна для записи', 503);
    return $path;
}

function cm_storage_driver(): string
{
    cm_storage_path();
    return 'file';
}

function cm_user_file(string $userId, string $type, string $extension): string
{
    $directory = cm_storage_path() . '/' . $type;
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        cm_fail('Не удалось создать хранилище данных', 503);
    }
    return $directory . '/' . hash('sha256', $userId) . '.' . $extension;
}

function cm_profile_get(string $userId): ?array
{
    $path = cm_user_file($userId, 'profiles', 'json');
    if (!is_file($path)) return null;
    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') return null;
    $record = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    return is_array($record) ? $record : null;
}

function cm_profile_save(array $user, array $state): string
{
    $now = gmdate(DATE_ATOM);
    $existing = cm_profile_get($user['id']);
    $record = [
        'telegram_user' => $user,
        'name' => $state['name'],
        'phone' => $state['phone'],
        'consent' => (bool) $state['consent'],
        'state' => $state,
        'created_at' => (string) ($existing['created_at'] ?? $now),
        'updated_at' => $now,
    ];
    $path = cm_user_file($user['id'], 'profiles', 'json');
    $temporary = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $json = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    if (file_put_contents($temporary, $json, LOCK_EX) === false || !rename($temporary, $path)) {
        @unlink($temporary);
        cm_fail('Не удалось сохранить профиль', 500);
    }
    @chmod($path, 0600);
    return $now;
}

function cm_profile_delete(string $userId): void
{
    foreach ([
        cm_user_file($userId, 'profiles', 'json'),
        cm_user_file($userId, 'events', 'jsonl'),
    ] as $path) {
        if (is_file($path) && !unlink($path)) throw new RuntimeException('User data file cannot be deleted');
    }
}

function cm_event_store(string $userId, string $eventName, array $payload, string $createdAt): void
{
    $line = json_encode([
        'user_id' => $userId,
        'event' => $eventName,
        'payload' => $payload,
        'created_at' => $createdAt,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";

    $path = cm_user_file($userId, 'events', 'jsonl');
    if (file_put_contents($path, $line, FILE_APPEND | LOCK_EX) === false) cm_fail('Не удалось сохранить событие', 500);
    @chmod($path, 0600);
}

function cm_clean_state(mixed $state): array
{
    if (!is_array($state)) cm_fail('Отсутствует состояние профиля', 422);
    $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    if (strlen($json) > 65535) cm_fail('Профиль превышает допустимый размер', 413);

    $decoded = json_decode($json, true, 32, JSON_THROW_ON_ERROR);
    $decoded['name'] = cm_limit_text($decoded['name'] ?? '', 80);
    $decoded['phone'] = cm_limit_text($decoded['phone'] ?? '', 40);
    $decoded['consent'] = (bool) ($decoded['consent'] ?? false);
    $decoded['phoneSubmitted'] = (bool) ($decoded['phoneSubmitted'] ?? false) && $decoded['phone'] !== '' && $decoded['consent'];
    $decoded['version'] = cm_limit_text($decoded['version'] ?? CM_API_VERSION, 20);
    $decoded['updatedAt'] = is_string($decoded['updatedAt'] ?? null) ? $decoded['updatedAt'] : gmdate(DATE_ATOM);
    return $decoded;
}

function cm_forward_event(array $event): bool
{
    $config = cm_config();
    $url = trim((string) ($config['event_webhook_url'] ?? ''));
    if ($url === '') return false;
    if (!str_starts_with($url, 'https://')) {
        error_log('[CM Group API] Event webhook must use HTTPS');
        return false;
    }

    $json = json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $secret = (string) ($config['event_webhook_secret'] ?? '');
    $signature = $secret !== '' ? hash_hmac('sha256', $json, $secret) : '';
    $headers = ['Content-Type: application/json', 'User-Agent: CM-Group-MiniApp/' . CM_API_VERSION];
    if ($signature !== '') $headers[] = 'X-CM-Signature: sha256=' . $signature;

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
        ]);
        curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($error !== '' || $status < 200 || $status >= 300) {
            error_log('[CM Group API] Event webhook failed: ' . ($error ?: 'HTTP ' . $status));
            return false;
        }
        return true;
    }

    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => implode("\r\n", $headers),
        'content' => $json,
        'timeout' => 5,
        'ignore_errors' => true,
    ]]);
    return @file_get_contents($url, false, $context) !== false;
}

cm_security_headers();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
