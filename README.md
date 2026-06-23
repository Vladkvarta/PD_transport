# Маршрутные листы в Telegram

Система для ведения маршрутных листов штатными водителями:

- водитель работает через Telegram-бота;
- любой новый пользователь автоматически появляется в заявках менеджера;
- менеджер создает и дополняет карточку водителя;
- фотографии документов бот отправляет в персональную тему супергруппы;
- смены, водители и документы хранятся в Firestore.

## Структура

- `functions` - TypeScript, Cloud Functions for Firebase и Telegraf;
- `web` - React-панель менеджера;
- `firestore.rules` - доступ только сотрудникам с ролью `secretary` или `admin`;
- `firebase.json` - Functions, Firestore, Hosting и эмуляторы.

## Регистрация водителя

1. Человек отправляет боту `/start` или любое сообщение.
2. Бот создает `registrationRequests/{telegramUserId}`.
3. Менеджер открывает вкладку `Заявки` и видит имя, username и Telegram ID.
4. ID можно скопировать кнопкой в строке заявки.
5. Менеджер нажимает `Оформить`, заполняет карточку и выбирает тему
   супергруппы из списка.
6. Панель создает `drivers/{telegramUserId}` и закрывает заявку.
7. Водитель повторно нажимает `/start` и получает рабочее меню.

Для получения Telegram ID больше не нужны сторонние боты.

## Темы основной группы

Основная архивная супергруппа задается параметром
`TELEGRAM_ARCHIVE_CHAT_ID`.

- бот автоматически сохраняет ID и название новой темы;
- любое сообщение в теме передает боту ее `message_thread_id`;
- темы появляются в выпадающем списке карточки водителя;
- менеджер может создать новую тему прямо из карточки;
- созданная тема автоматически выбирается для водителя.

У Telegram Bot API нет метода получения полного списка уже существующих тем.
Чтобы импортировать старую тему, после подключения бота отправьте в ней одно
сообщение. Если название темы неизвестно, она появится как `Тема {ID}`.

## Карточка водителя

```json
{
  "fullName": "Иван Петров",
  "telegramUserId": "584291037",
  "phone": "+380 67 123 45 67",
  "department": "Администрация",
  "vehicleLabel": "Toyota Camry",
  "vehiclePlate": "AA 1427 KC",
  "archiveTopicName": "Петров Иван",
  "archiveThreadId": 47,
  "notes": "",
  "active": true,
  "botState": { "step": "idle" }
}
```

## Установка

Требуется Node.js 22.

```powershell
cd functions
npm install
npm run build
npm test

cd ..\web
npm install
npm run build
```

## Firebase

1. Создайте Firebase-проект.
2. Включите Firestore и Email/Password в Firebase Authentication.
3. Создайте пользователя менеджера в Authentication.
4. Скопируйте `.firebaserc.example` в `.firebaserc` и укажите Project ID.
5. Скопируйте `web/.env.example` в `web/.env.local` и заполните параметры
   веб-приложения из настроек Firebase.
6. Назначьте пользователю роль.

Для назначения роли используйте service account или Application Default
Credentials:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\service-account.json"
cd functions
npm run set-role -- manager@company.ua secretary
```

После назначения роли пользователь должен выйти из панели и войти снова.

## Telegram

1. Создайте бота через BotFather.
2. Создайте закрытую супергруппу и включите темы.
3. Добавьте бота администратором с правами отправки сообщений и управления
   темами (`can_manage_topics`).
4. Темы можно создавать из панели. Для импорта существующей темы отправьте в
   ней любое сообщение.
5. Сохраните секреты:

```powershell
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_WEBHOOK_SECRET
```

При деплое задайте параметр `TELEGRAM_ARCHIVE_CHAT_ID`. ID супергруппы обычно
начинается с `-100`.

Не храните токен бота в README, `.env` или Git. Если токен когда-либо попал в
файл или переписку, отзовите его в BotFather и выпустите новый.

## Деплой

```powershell
firebase deploy --only functions,firestore,hosting
```

После первого деплоя установите webhook Telegram на URL функции
`telegramWebhook` и передайте тот же `TELEGRAM_WEBHOOK_SECRET` как
`secret_token`.

## Локальная панель

Для визуальной проверки без подключения Firebase:

```powershell
cd web
$env:VITE_DEMO_MODE="true"
npm run dev
```

Для рабочей панели не задавайте `VITE_DEMO_MODE`; она подключится к Firebase из
`web/.env.local`.
