#pragma once

#include <QMap>
#include <QObject>
#include <QString>
#include <QVariant>
#include <QVector>

#include "matrix.h"

/**
 * @class EncryptAlgorithms
 * @brief Класс, реализующий различные алгоритмы шифрования и дешифрования.
 */
class EncryptAlgorithms : public QObject {
  Q_OBJECT
 public:
  /**
   * @brief Конструктор класса EncryptionAlgorithms.
   * @param parent Родительский  Qt объект.
   */
  explicit EncryptAlgorithms(QObject* parent = nullptr) noexcept;

  Q_INVOKABLE QString readFileContent(const QString& filePath) const noexcept;
  Q_INVOKABLE bool saveContent(const QString& filePath,
                               const QString& text) const noexcept;

  Q_INVOKABLE QString encryptPlayfair(const QString& keyPath,
                                      const QString& input) noexcept;
  Q_INVOKABLE QString decryptPlayfair(const QString& keyPath,
                                      const QString& input) noexcept;

 private:
  /**
   * @brief Класс, реализующий алгоритм шифрования Плейфера.
   */
  class Playfair {
   private:
    QString key_;        // ключ-слово
    QChar filled_char_;  // символ-заполнитель
    QString matrix_;     // матрица алфавита
    int dimension_;      // размерность матрицы

    /**
     * @brief Подготовить текст к зашифровке - заменить пробелы и повторы.
     * @param text Текст для зашифровки (изменяется).
     * @param mode Режим (true) - готовим к шифрованию, (false) - расшифровка
     */
    void prepareText(QString& text, bool mode) const;

    /**
     * @brief Применить правила Плейфера для шифрования.
     * @param text Текст для зашифровки (изменяется).
     */
    void applyRules(QString& text, bool mode) const noexcept;

   public:
    /**
     * @brief Конструктор класса Playfair.
     * @param key Ключ шифрования.
     * @param alphabet Алфавит
     * @param filled_char символ-заполнитель
     * @throws std::invalid_argument В случае если ключ пуст/алфавит
     * пуст/символы ключа не входят в алфавит.
     */
    Playfair(const QString& key, const QString& alphabet,
             const QChar filled_char);

    QString getKey() const noexcept { return key_; }

    /**
     * @brief Зашифровать текст.
     * @param text Текст для зашифровки.
     * @return Зашифрованный текст.
     */
    QString encrypt(const QString& text) const;

    /**
     * @brief Расшифровать текст.
     * @param text Текст для расшифровки.
     * @return Расшифрованный текст.
     */
    QString decrypt(const QString& text) const;
  };
  std::unique_ptr<Playfair> playfair_;
};