const sqlite3 = require("sqlite3").verbose();

// Подключаемся к файлу базы данных, если файла нет, то он будет создан
const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error("Ошибка при подключении к базе данных:", err.message);
  } else {
    console.log("Подключение к базе данных SQLite успешно установлено.");
    // Создаем таблицу, если она еще не существует
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_text TEXT NOT NULL,
            is_done INTEGER DEFAULT 0
        )`);
  }
});

/**
 * Добавляет новую задачу в базу данных.
 * @param {number} userId - ID пользователя в Telegram.
 * @param {string} taskText - Текст задачи.
 * @returns {Promise<number>} - Промис, который разрешается с ID новой задачи.
 */
const addTask = (userId, taskText) => {
  const sql = `INSERT INTO tasks (user_id, task_text) VALUES (?, ?)`;
  return new Promise((resolve, reject) => {
    db.run(sql, [userId, taskText], function (err) {
      if (err) {
        reject(new Error("Ошибка при добавлении задачи: " + err.message));
      } else {
        resolve(this.lastID);
      }
    });
  });
};

/**
 * Получает список невыполненных задач для пользователя.
 * @param {number} userId - ID пользователя в Telegram.
 * @returns {Promise<Array<{id: number, task_text: string}>>} - Список задач.
 */
const listTasks = (userId) => {
  const sql = `SELECT id, task_text FROM tasks WHERE user_id = ? AND is_done = 0`;
  return new Promise((resolve, reject) => {
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(new Error("Ошибка при получении списка задач: " + err.message));
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Помечает задачу как выполненную.
 * @param {number} taskId - ID задачи.
 * @param {number} userId - ID пользователя для проверки прав.
 * @returns {Promise<number>} - Количество измененных строк.
 */
const markTaskDone = (taskId, userId) => {
  const sql = `UPDATE tasks SET is_done = 1 WHERE id = ? AND user_id = ?`;
  return new Promise((resolve, reject) => {
    db.run(sql, [taskId, userId], function (err) {
      if (err) {
        reject(new Error("Ошибка при обновлении задачи: " + err.message));
      } else {
        resolve(this.changes);
      }
    });
  });
};

/**
 * Удаляет задачу из базы данных.
 * @param {number} taskId - ID задачи.
 * @param {number} userId - ID пользователя для проверки прав.
 * @returns {Promise<number>} - Количество удаленных строк.
 */
const deleteTask = (taskId, userId) => {
  const sql = `DELETE FROM tasks WHERE id = ? AND user_id = ?`;
  return new Promise((resolve, reject) => {
    db.run(sql, [taskId, userId], function (err) {
      if (err) {
        reject(new Error("Ошибка при удалении задачи: " + err.message));
      } else {
        resolve(this.changes);
      }
    });
  });
};

module.exports = {
  addTask,
  listTasks,
  markTaskDone,
  deleteTask,
};
