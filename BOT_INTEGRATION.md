# Подключение к Telegram-боту и SaleBot

## Как открывать Mini App

Используйте inline-кнопку Web App под сообщением, Menu Button или Main Mini App.

```text
https://app.cmgroup.pro/
```

Так Telegram передаёт подписанный `initData`, а сервер надёжно определяет Telegram ID и восстанавливает профиль на разных устройствах.

## Схема передачи данных

```text
Mini App → https://app.cmgroup.pro/api/event.php → журнал в /data → входящий webhook SaleBot/CRM
```

Приложение не использует `sendData()` для каждого действия: этот метод закрывает Mini App и не подходит постоянному личному кабинету.

## Что передаётся

Webhook получает JSON со следующими блоками:

- `event` — название события;
- `telegram_user.id`, `username`, `first_name`, `last_name`;
- `profile.name`, `profile.phone`, `profile.consent`;
- `profile.state.answers` — ответы квиза;
- `profile.state.recommendedProduct`, `profile`, `calculatorCompleted`;
- `payload` — данные конкретного действия;
- `created_at`, `source`.

Основные события:

- `name_saved` — пользователь сохранил имя;
- `lead_completed` — оставил телефон и открыл полный доступ;
- `product_consultation_requested` — запросил консультацию;
- `calculator_completed` — выполнил расчёт;
- `book_opened`, `basic_course_opened`, `lesson_opened`;
- `full_access_opened`, `return_to_bot`.

## Что требуется настроить в SaleBot

Нужен реальный входящий HTTP/webhook-адрес SaleBot, который умеет найти клиента по Telegram ID и записать переменные. В текущем выгруженном сценарии такого обработчика нет, поэтому одной загрузки файлов приложения недостаточно.

В обработчике SaleBot нужно:

1. искать клиента по `telegram_user.id`;
2. записывать в карточку клиента `name`, `phone` и переменные квиза;
3. при `lead_completed` отметить полный доступ и при необходимости запустить ветку выдачи материалов;
4. при `product_consultation_requested` создать заявку или отправить уведомление менеджеру;
5. при `calculator_completed` сохранить параметры расчёта;
6. возвращать HTTP 2xx, чтобы приложение отметило передачу успешной.

Рекомендуемые переменные SaleBot:

```text
quiz_completed
name
phone
experience
interest
capital_range
main_barrier
goal
recommended_product
calculator_completed
consent_personal_data
miniapp_completed_at
miniapp_last_event
```

Этот состав соответствует утверждённой воронке CM Group.

## Настройка приложения

В `api/config.local.php` укажите:

```php
'event_webhook_url' => 'https://РЕАЛЬНЫЙ-ВХОДЯЩИЙ-АДРЕС-SALEBOT',
'event_webhook_secret' => 'СЛУЧАЙНАЯ_ДЛИННАЯ_СТРОКА',
```

При заполненном секрете запрос содержит заголовок:

```text
X-CM-Signature: sha256=<HMAC-SHA256 тела запроса>
```

Если конкретный входящий механизм SaleBot не поддерживает проверку HMAC, поле `event_webhook_secret` можно временно оставить пустым, но URL должен быть непубличным и трудноподбираемым.

## Уведомление менеджеру

Триггер в SaleBot: `event = product_consultation_requested`.

Текст уведомления должен содержать:

```text
Новая заявка на консультацию из Mini App
Имя: #{name}
Телефон: #{phone}
Telegram ID: #{telegram_user_id}
Продукт: #{recommended_product}
Ответы квиза: опыт / интерес / капитал / барьер / цель
```

Получателей уведомления и канал доставки нужно выбрать в самом SaleBot: личное сообщение менеджеру, рабочая группа или CRM-задача.

## Возврат в бот

Кнопки приложения открывают:

```text
https://t.me/cmgroup_pro_bot
```

со `start`-параметром для продолжения нужной ветки.