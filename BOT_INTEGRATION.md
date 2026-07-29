# Подключение к Telegram-боту и SaleBot

## Как открывать Mini App

Рекомендуемый вариант — inline-кнопка Web App под сообщением или Menu Button бота.

URL приложения:

```text
https://app.cmgroup.pro/
```

Этот способ передаёт приложению Telegram `initData`, необходимый для подтверждённого Telegram ID и восстановления профиля на разных устройствах.

## Почему приложение больше не использует sendData для каждого действия

`Telegram.WebApp.sendData()`:

- работает только при запуске из reply-кнопки Web App;
- закрывает Mini App после отправки;
- не подходит для многоэкранного личного кабинета и постоянного профиля.

События теперь идут по схеме:

```text
Mini App → api/event.php → журнал на REG.RU → webhook SaleBot/CRM
```

## Какие события формируются

- `name_saved`;
- `lead_completed`;
- `calculator_completed`;
- `book_opened`;
- `basic_course_opened`;
- `lesson_opened`;
- `product_consultation_requested`;
- `full_access_opened`;
- `privacy_policy_opened`;
- `return_to_bot`.

Webhook получает Telegram ID, username, имя Telegram, сохранённое имя, телефон, согласие, ответы квиза, профиль и полезную нагрузку события.

## Что нужно получить в SaleBot

Нужен URL входящего webhook, принимающий POST JSON. После получения адреса заполните в `api/config.local.php`:

```php
'event_webhook_url' => 'https://... ',
'event_webhook_secret' => 'случайная_секретная_строка',
```

При наличии секрета сервер добавляет заголовок:

```text
X-CM-Signature: sha256=<HMAC>
```

## Возврат в бот

Кнопки «Вернуться в Telegram-бот» и «Продолжить в Telegram-боте» открывают:

```text
https://t.me/cmgroup_pro_bot
```

и передают `start`-параметр, по которому можно продолжить нужную ветку сценария.
