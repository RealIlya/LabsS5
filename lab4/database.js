// Импортируем библиотеку sqlite3
const sqlite3 = require("sqlite3").verbose();

// Указываем путь к файлу базы данных
const DB_PATH = "./tasks.db";

// Создаем и подключаемся к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Ошибка при подключении к базе данных:", err.message);
  } else {
    console.log("Успешное подключение к базе данных SQLite.");
    // Создаем таблицу, если она не существует
    createTable();
  }
});

// Функция для создания таблицы задач
const createTable = () => {
  const sql = `
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'new',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
  db.run(sql, (err) => {
    if (err) {
      console.error("Ошибка при создании таблицы:", err.message);
    }
  });
};

// Экспортируем объект db, чтобы использовать его в других файлах
module.exports = db;
