<?php
declare(strict_types=1);

function cm_salebot_debug_path(): string
{
    $directory = cm_storage_path() . '/diagnostics';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Cannot create diagnostics directory');
    }
    return $directory . '/salebot-latest.json';
}

function cm_salebot_debug_write(array $data): void
{
    try {
        $path = cm_salebot_debug_path();
        $data['updated_at'] = gmdate(DATE_ATOM);
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
        file_put_contents($path, $json, LOCK_EX);
        @chmod($path, 0600);
    } catch (Throwable $exception) {
        error_log('[CM Group API] SaleBot diagnostic write failed: ' . $exception->getMessage());
    }
}

function cm_salebot_configured(): bool
{
    $config = cm_config();
    return trim((string)($config['salebot_api_key'] ?? '')) !== ''
        && trim((string)($config['salebot_group_id'] ?? '')) !== '';
}

function cm_salebot_response_success(?array $response): bool
{
    if ($response === null) return false;
    if ($response === []) return true;
    if (isset($response['status'])) return strtolower((string)$response['status']) === 'success';
    if (isset($response['success'])) return (bool)$response['success'];
    if (isset($response['ok'])) return (bool)$response['ok'];
    return true;
}

function cm_salebot_request(string $method, array $payload, array &$trace = []): ?array
{
    $config = cm_config();
    $apiKey = trim((string)($config['salebot_api_key'] ?? ''));
    if ($apiKey === '') {
        $trace = ['method' => $method, 'ok' => false, 'error' => 'API key is empty'];
        return null;
    }

    $url = 'https://chatter.salebot.pro/api/' . rawurlencode($apiKey) . '/' . ltrim($method, '/');
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $headers = ['Content-Type: application/json', 'Accept: application/json', 'User-Agent: CM-Group-MiniApp/' . CM_API_VERSION];
    $status = 0;
    $error = '';
    $raw = '';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
        ]);
        $result = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        $raw = is_string($result) ? $result : '';
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $json,
            'timeout' => 8,
            'ignore_errors' => true,
        ]]);
        $result = @file_get_contents($url, false, $context);
        $raw = is_string($result) ? $result : '';
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $status = (int)$matches[1];
        }
        if (!is_string($result)) $error = 'file_get_contents failed';
    }

    $trace = [
        'method' => $method,
        'http_status' => $status,
        'transport_error' => $error,
        'request_keys' => array_keys($payload),
        'raw_response' => mb_substr($raw, 0, 4000),
    ];

    if ($error !== '' || $status < 200 || $status >= 300 || $raw === '') {
        $trace['ok'] = false;
        error_log('[CM Group API] SaleBot ' . $method . ' failed: ' . ($error ?: 'HTTP ' . $status));
        return null;
    }

    try {
        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        $trace['ok'] = true;
        $trace['decoded'] = is_array($decoded) ? $decoded : [];
        return is_array($decoded) ? $decoded : [];
    } catch (Throwable $exception) {
        $trace['ok'] = false;
        $trace['decode_error'] = $exception->getMessage();
        error_log('[CM Group API] Invalid SaleBot response: ' . $exception->getMessage());
        return [];
    }
}

function cm_salebot_extract_client_id(?array $response, string $telegramId): ?string
{
    if (!$response) return null;
    foreach (['client_id', 'id'] as $key) {
        if (isset($response[$key]) && preg_match('/^\d+$/', (string)$response[$key])) return (string)$response[$key];
    }
    foreach (['clients', 'items', 'data', 'result'] as $key) {
        if (!isset($response[$key]) || !is_array($response[$key])) continue;
        foreach ($response[$key] as $item) {
            if (!is_array($item)) continue;
            $platformId = (string)($item['platform_id'] ?? $item['user_id'] ?? '');
            $clientId = (string)($item['client_id'] ?? $item['id'] ?? '');
            if ($clientId !== '' && ($platformId === '' || $platformId === $telegramId)) return $clientId;
        }
    }
    if (isset($response[$telegramId]) && preg_match('/^\d+$/', (string)$response[$telegramId])) return (string)$response[$telegramId];
    return null;
}

function cm_salebot_forward(array $event): bool
{
    $debug = [
        'configured' => cm_salebot_configured(),
        'event' => (string)($event['event'] ?? ''),
    ];
    if (!cm_salebot_configured()) {
        $debug['error'] = 'SaleBot is not configured';
        cm_salebot_debug_write($debug);
        return false;
    }

    $config = cm_config();
    $user = is_array($event['telegram_user'] ?? null) ? $event['telegram_user'] : [];
    $profile = is_array($event['profile'] ?? null) ? $event['profile'] : [];
    $state = is_array($profile['state'] ?? null) ? $profile['state'] : [];
    $payload = is_array($event['payload'] ?? null) ? $event['payload'] : [];
    $telegramId = preg_replace('/\D/', '', (string)($user['id'] ?? ''));
    $groupId = trim((string)($config['salebot_group_id'] ?? ''));
    $debug['telegram_id'] = $telegramId;
    $debug['group_id'] = $groupId;
    $debug['profile_name_present'] = trim((string)($profile['name'] ?? '')) !== '';
    $debug['profile_phone_present'] = trim((string)($profile['phone'] ?? '')) !== '';

    if ($telegramId === '' || $groupId === '') {
        $debug['error'] = 'Telegram ID or group ID is empty';
        cm_salebot_debug_write($debug);
        return false;
    }

    $lookupTrace = [];
    $lookup = cm_salebot_request('find_client_id_by_platform_id', [
        'platform_ids' => [$telegramId],
        'group_id' => $groupId,
    ], $lookupTrace);
    $debug['lookup'] = $lookupTrace;
    $clientId = cm_salebot_extract_client_id($lookup, $telegramId);
    $debug['client_id'] = $clientId;
    if ($clientId === null) {
        $debug['error'] = 'SaleBot client was not found in lookup response';
        cm_salebot_debug_write($debug);
        error_log('[CM Group API] SaleBot client not found for Telegram ID ' . $telegramId . '; group_id=' . $groupId);
        return false;
    }

    $answers = is_array($state['answers'] ?? null) ? $state['answers'] : [];
    $variables = [
        'client.name' => (string)($profile['name'] ?? $user['first_name'] ?? ''),
        'client.phone' => (string)($profile['phone'] ?? ''),
        'cm_telegram_id' => $telegramId,
        'cm_telegram_username' => (string)($user['username'] ?? ''),
        'cm_quiz_completed' => !empty($state['quizCompleted']) ? '1' : '0',
        'cm_experience' => (string)($answers['experience'] ?? ''),
        'cm_interest' => (string)($answers['interest'] ?? ''),
        'cm_capital_range' => (string)($answers['capital_range'] ?? ''),
        'cm_main_barrier' => (string)($answers['main_barrier'] ?? ''),
        'cm_goal' => (string)($answers['goal'] ?? ''),
        'cm_recommended_product' => (string)($state['recommendedProduct'] ?? ''),
        'cm_last_event' => (string)($event['event'] ?? ''),
        'cm_event_source' => (string)($payload['source'] ?? $event['source'] ?? 'cm_group_miniapp'),
        'cm_updated_at' => (string)($event['created_at'] ?? gmdate(DATE_ATOM)),
    ];
    $debug['variable_keys'] = array_keys($variables);

    $saveTrace = [];
    $saved = cm_salebot_request('save_variables', [
        'client_id' => (int)$clientId,
        'variables' => $variables,
    ], $saveTrace);
    $debug['save_variables'] = $saveTrace;
    if (!cm_salebot_response_success($saved)) {
        $debug['error'] = 'save_variables was rejected';
        cm_salebot_debug_write($debug);
        return false;
    }

    if (($event['event'] ?? '') === 'product_consultation_requested') {
        $callbackTrace = [];
        $callback = cm_salebot_request('send_callback_by_platform_id', [
            'platform_ids' => [$telegramId],
            'callback_text' => 'cm_group_consultation_requested',
            'group_id' => $groupId,
        ], $callbackTrace);
        $debug['callback'] = $callbackTrace;
        $debug['success'] = cm_salebot_response_success($callback);
        cm_salebot_debug_write($debug);
        return $debug['success'];
    }

    $debug['success'] = true;
    cm_salebot_debug_write($debug);
    return true;
}
