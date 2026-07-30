<?php
declare(strict_types=1);

function cm_salebot_configured(): bool
{
    $config = cm_config();
    return trim((string)($config['salebot_api_key'] ?? '')) !== ''
        && trim((string)($config['salebot_group_id'] ?? '')) !== '';
}

function cm_salebot_request(string $method, array $payload): ?array
{
    $config = cm_config();
    $apiKey = trim((string)($config['salebot_api_key'] ?? ''));
    if ($apiKey === '') return null;

    $url = 'https://chatter.salebot.pro/api/' . rawurlencode($apiKey) . '/' . ltrim($method, '/');
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $headers = ['Content-Type: application/json', 'Accept: application/json', 'User-Agent: CM-Group-MiniApp/' . CM_API_VERSION];

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
        $raw = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if ($error !== '' || $status < 200 || $status >= 300 || !is_string($raw)) {
            error_log('[CM Group API] SaleBot ' . $method . ' failed: ' . ($error ?: 'HTTP ' . $status));
            return null;
        }
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $json,
            'timeout' => 8,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $context);
        if (!is_string($raw)) return null;
    }

    try {
        $decoded = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : [];
    } catch (Throwable $exception) {
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
    if (!cm_salebot_configured()) return false;

    $config = cm_config();
    $user = is_array($event['telegram_user'] ?? null) ? $event['telegram_user'] : [];
    $profile = is_array($event['profile'] ?? null) ? $event['profile'] : [];
    $state = is_array($profile['state'] ?? null) ? $profile['state'] : [];
    $payload = is_array($event['payload'] ?? null) ? $event['payload'] : [];
    $telegramId = preg_replace('/\D/', '', (string)($user['id'] ?? ''));
    $groupId = trim((string)($config['salebot_group_id'] ?? ''));
    if ($telegramId === '' || $groupId === '') return false;

    $lookup = cm_salebot_request('find_client_id_by_platform_id', [
        'platform_ids' => [$telegramId],
        'group_id' => $groupId,
    ]);
    $clientId = cm_salebot_extract_client_id($lookup, $telegramId);
    if ($clientId === null) {
        error_log('[CM Group API] SaleBot client not found for Telegram ID ' . $telegramId);
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

    $saved = cm_salebot_request('save_variables', [
        'client_id' => (int)$clientId,
        'variables' => $variables,
    ]);
    if ($saved === null) return false;

    if (($event['event'] ?? '') === 'product_consultation_requested') {
        $callback = cm_salebot_request('tg_callback', [
            'user_id' => $telegramId,
            'group_id' => $groupId,
            'message' => 'cm_group_consultation_requested',
            'resume_bot' => true,
            'cm_product' => (string)($payload['product'] ?? $state['recommendedProduct'] ?? ''),
            'cm_source' => (string)($payload['source'] ?? 'application'),
        ]);
        return $callback !== null;
    }

    return true;
}
