# Инструкция по запуску и тестированию системы

## 1. Настройка Telegram
1.  **Бот**: Создайте бота в [@BotFather](https://t.me/botfather). Сохраните токен.
2.  **Архив**: Создайте группу, включите в ней «Темы» (Topics). Добавьте бота администратором с правом управления темами.
3.  **ID Группы**: Узнайте ID группы (обычно начинается с `-100`).

## 2. Настройка Firebase
1.  Создайте проект в [Firebase Console](https://console.firebase.google.com/).
2.  Включите **Firestore** и **Authentication** (метод Email/Password).
3.  В Authentication создайте пользователя для менеджера.
4.  Назначьте пользователю роль `admin`. В папке `functions` выполните:
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="путь/к/сервис-аккаунту.json"
    npm run set-role -- email@example.com admin
    ```

## 3. Конфигурация
1.  **Секреты (Functions)**:
    ```bash
    firebase functions:secrets:set TELEGRAM_BOT_TOKEN
    firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET
    ```
2.  **Параметры**:
    Задайте ID архивной группы в `functions/src/config.ts` (или через `firebase functions:config:set`).
3.  **Frontend**:
    В `web/.env.local` вставьте ключи вашего Firebase проекта.

## 4. Деплой
```bash
firebase deploy
```

## 5. Привязка Mini App
1.  В @BotFather: `Bot Settings` -> `Menu Button` -> `Configure menu button`.
2.  Укажите ссылку на ваш хостинг с путем `/app`: `https://ваш-проект.web.app/app`.
3.  Установите Webhook: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL_FUNCTION>&secret_token=<SECRET>`

---

## Как тестировать

### Сценарий Водителя (в Telegram):
1. Откройте бота, нажмите кнопку в меню или введите `/start`.
2. В Mini App заполните регистрацию.
3. Дождитесь одобрения (см. ниже).
4. Нажмите **«Начать смену»**, введите пробег.
5. Нажмите **«Куда едем?»**, продиктуйте адрес голосом, выберите результат.
6. Нажмите **«Фото документа»**, сделайте любое фото. Проверьте, что оно появилось в теме Telegram.
7. Нажмите **«Завершить смену»**, введите пробег.

### Сценарий Менеджера (в браузере):
1. Откройте `https://ваш-проект.web.app/admin`.
2. Во вкладке **«Заявки»** одобрите своего водителя (выберите или создайте ему тему).
3. Во вкладке **«История смен»** найдите завершенную смену.
4. Нажмите на иконку карты — вы увидите маршрут между точками и расчет дистанции.
