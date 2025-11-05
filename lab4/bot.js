require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const db = require("./database");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error(
    "Ошибка: Токен для Telegram бота не найден. Проверьте ваш .env файл."
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const TASKS_PER_PAGE = 5; // Устанавливаем, сколько задач показывать на одной странице

const escapeMarkdownV2 = (text) => {
  const specialChars = "_*[]()~`>#+-=|{}.!";
  return text.replace(
    new RegExp(`[${specialChars.split("").join("\\")}]`, "g"),
    "\\$&"
  );
};

const knownCommands = ["/start", "/add", "/list", "/done", "/delete"];

/**
 * Создает текст сообщения и клавиатуру для конкретной страницы.
 * @param {number} userId - ID пользователя Telegram.
 * @param {number} page - Номер страницы (начиная с 1).
 * @returns {Promise<{text: string, options: object}|null>} - Объект с текстом и опциями для отправки.
 */
const generateTaskList = async (userId, page = 1) => {
  const allTasks = await db.listTasks(userId);
  if (allTasks.length === 0) {
    return {
      text: "📝 Список задач пуст. Добавьте новую командой /add",
      options: {},
    };
  }

  const totalPages = Math.ceil(allTasks.length / TASKS_PER_PAGE);
  // Убедимся, что номер страницы корректен (например, если удалили последнюю задачу на странице)
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  const startIndex = (page - 1) * TASKS_PER_PAGE;
  const tasksToShow = allTasks.slice(startIndex, startIndex + TASKS_PER_PAGE);

  let text = `📋 *Ваш список задач \\(Стр\\. ${page}/${totalPages}\\):*\n\n`;
  const inline_keyboard = [];

  tasksToShow.forEach((task) => {
    // Добавляем текст задачи
    text += `*🆔 ${task.id}:* ${escapeMarkdownV2(task.task_text)}\n`;
    // Добавляем кнопки для этой задачи
    inline_keyboard.push([
      { text: "✅ Выполнено", callback_data: `done_${task.id}_${page}` },
      { text: "🗑️ Удалить", callback_data: `delete_${task.id}_${page}` },
    ]);
  });

  // Добавляем кнопки навигации
  const navButtons = [];
  if (page > 1) {
    navButtons.push({ text: "◀️ Назад", callback_data: `nav_${page - 1}` });
  }
  navButtons.push({ text: `[ ${page}/${totalPages} ]`, callback_data: "noop" }); // noop = no operation
  if (page < totalPages) {
    navButtons.push({ text: "Вперед ▶️", callback_data: `nav_${page + 1}` });
  }

  if (totalPages > 1) {
    inline_keyboard.push(navButtons);
  }

  return {
    text: text,
    options: {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard,
      },
    },
  };
};

// Команды

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Привет! Я твой менеджер задач. Используй /list, чтобы увидеть запланированные дела.",
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  const [chatId, userId, taskText] = [msg.chat.id, msg.from.id, match[1]];
  try {
    const taskId = await db.addTask(userId, taskText);
    bot.sendMessage(
      chatId,
      `✅ Задача "${taskText}" добавлена с ID: ${taskId}`
    );
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Не удалось добавить задачу.");
  }
});

// Команда /list
bot.onText(/\/list/, async (msg) => {
  const [chatId, userId] = [msg.chat.id, msg.from.id];
  const taskList = await generateTaskList(userId, 1);
  if (taskList) {
    bot.sendMessage(chatId, taskList.text, taskList.options);
  }
});

// Команда /done [ID]
bot.onText(/\/done (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const taskId = parseInt(match[1], 10);

  try {
    const changes = await db.markTaskDone(taskId, userId);
    if (changes > 0) {
      bot.sendMessage(
        chatId,
        `🎉 Задача с ID ${taskId} помечена как выполненная.`
      );
    } else {
      bot.sendMessage(
        chatId,
        `🤔 Задача с ID ${taskId} не найдена или уже выполнена.`
      );
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Произошла ошибка при обновлении задачи.");
  }
});

// Команда /delete [ID]
bot.onText(/\/delete (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const taskId = parseInt(match[1], 10);

  try {
    const changes = await db.deleteTask(taskId, userId);
    if (changes > 0) {
      bot.sendMessage(chatId, `🗑️ Задача с ID ${taskId} успешно удалена.`);
    } else {
      bot.sendMessage(chatId, `🤔 Задача с ID ${taskId} не найдена.`);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Произошла ошибка при удалении задачи.");
  }
});

// Обработка нажатий на кнопки

bot.on("callback_query", async (callbackQuery) => {
  const { message, from, data } = callbackQuery;
  const [chatId, userId] = [message.chat.id, from.id];

  const [action, ...params] = data.split("_");

  let needsUpdate = false;
  let page = 1;

  switch (action) {
    case "done": {
      const [taskId, currentPage] = params;
      page = parseInt(currentPage, 10);
      await db.markTaskDone(parseInt(taskId, 10), userId);
      bot.answerCallbackQuery(callbackQuery.id, { text: "Задача выполнена!" });
      needsUpdate = true;
      break;
    }
    case "delete": {
      const [taskId, currentPage] = params;
      page = parseInt(currentPage, 10);
      await db.deleteTask(parseInt(taskId, 10), userId);
      bot.answerCallbackQuery(callbackQuery.id, { text: "Задача удалена!" });
      needsUpdate = true;
      break;
    }
    case "nav": {
      page = parseInt(params[0], 10);
      needsUpdate = true;
      break;
    }
    case "noop": // Ничего не делать для кнопки с номером страницы
      bot.answerCallbackQuery(callbackQuery.id);
      return;
  }

  if (needsUpdate) {
    const taskList = await generateTaskList(userId, page);
    if (taskList) {
      // Редактируем существующее сообщение, чтобы избежать спама
      bot
        .editMessageText(taskList.text, {
          chat_id: chatId,
          message_id: message.message_id,
          ...taskList.options,
        })
        .catch((err) => {
          // Игнорируем ошибку, если сообщение не изменилось
          if (!err.message.includes("message is not modified")) {
            console.error("Ошибка при редактировании сообщения:", err);
          }
        });
    }
  }
});

// Обработка ошибок ввода

// Реакция на команду без аргументов
bot.onText(/\/add$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Пожалуйста, укажите текст задачи. Например: `/add Купить молоко`"
  );
});

bot.onText(/\/done$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Пожалуйста, укажите ID задачи. Например: `/done 3`"
  );
});

bot.onText(/\/delete$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Пожалуйста, укажите ID задачи. Например: `/delete 3`"
  );
});

// Реакция на любое сообщение, чтобы отловить неизвестные команды
bot.on("message", (msg) => {
  // Если сообщение - это не текст или не команда, игнорируем
  if (!msg.text || !msg.text.startsWith("/")) return;

  // Проверяем, что команда не является одной из известных
  // Используем startsWith, чтобы учесть команды с аргументами (например, /add milk)
  const isKnownCommand = knownCommands.some((command) =>
    msg.text.startsWith(command)
  );

  if (!isKnownCommand) {
    bot.sendMessage(
      msg.chat.id,
      "🤔 Неизвестная команда. Используйте /start, чтобы увидеть список доступных команд."
    );
  }
});

console.log("Бот запущен и готов к работе...");
