// Загружаем переменные окружения из .env файла
require("dotenv").config();

// Импортируем библиотеку для работы с ботом
const { MaxBot } = require("@maxhub/max-bot-api");

// Импортируем наш модуль для работы с БД (пока не используется, но нужен будет дальше)
const db = require("./database.js");

// Получаем токен из переменных окружения
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Ошибка: Токен бота не найден. Проверьте ваш .env файл.");
  process.exit(1); // Выход из приложения, если токен не задан
}

// Создаем экземпляр бота
const bot = new MaxBot(token);

// Обработчик команды /start для проверки
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Привет! Я ваш менеджер задач. Используйте /add, /list, /done, /delete для управления задачами."
  );
});

// Запускаем бота
bot
  .startPolling()
  .then(() => {
    console.log("Бот успешно запущен и работает...");
  })
  .catch((err) => {
    console.error("Ошибка при запуске бота:", err);
  });
