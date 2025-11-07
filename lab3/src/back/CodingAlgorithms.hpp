#pragma once

#include <QMap>
#include <QObject>
#include <QString>
#include <QVariant>
#include <QVector>

#include "matrix.h"

/**
 * @class CodingAlgorithms
 * @brief Класс, реализующий различные алгоритмы кодирования и декодирования.
 */
class CodingAlgorithms : public QObject {
  Q_OBJECT
 public:
  /**
   * @brief Конструктор класса CodingAlgorithms.
   * @param parent Родительский  Qt объект.
   */
  explicit CodingAlgorithms(QObject* parent = nullptr);

  /**
   * @brief Кодирование с использованием алгоритма Гилберта-Мура.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return true, если кодирование прошло успешно, иначе false.
   */
  Q_INVOKABLE bool encodeGilbertMoore(const QString& inputFilePath,
                                      const QString& outputFilePath);

  /**
   * @brief Декодирование с использованием алгоритма Гилберта-Мура.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return true, если декодирование прошло успешно, иначе false.
   */
  Q_INVOKABLE bool decodeGilbertMoore(const QString& inputFilePath,
                                      const QString& outputFilePath);

  /**
   * @brief Помехоустойчивое кодирование с использованием алгоритма
   * Гильберта-Мура и проверкой на четность.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return true, если кодирование прошло успешно, иначе false.
   */
  Q_INVOKABLE bool encodeParity(const QString& inputFilePath,
                                const QString& outputFilePath);

  /**
   * @brief Декодирование помехоустойчивого кода с использованием алгоритма
   * Гильберта-Мура и проверкой на четность.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return Обнаруженные в сообщении ошибки. В случае, если во время
   * декодирования произошла ошибка - "false".
   */
  Q_INVOKABLE QString decodeParity(const QString& inputFilePath,
                                   const QString& outputFilePath);

  /**
   * @brief Помехоустойчивое кодирование с использованием алгоритма Хэмминга.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return true, если кодирование прошло успешно, иначе false.
   */
  Q_INVOKABLE bool encodeHamming(const QString& inputFilePath,
                                 const QString& outputFilePath);

  /**
   * @brief Декодирование помехоустойчивого кода Хэмминга.
   * @param inputFilePath Путь к входному файлу.
   * @param outputFilePath Путь к выходному файлу.
   * @return Обнаруженные и исправленные в сообщении ошибки. В случае, если во
   * время декодирования произошла ошибка - "false".
   */
  Q_INVOKABLE QString decodeHamming(const QString& inputFilePath,
                                    const QString& outputFilePath);

  /**
   * @brief Преобразование сообщения из десятичных чисел в двоичные коды.
   * @param outputFilePath Путь к выходному файлу, куда сохраняется
   * закодированное сообщение.
   * @param message Сообщение для кодирования (Целые числа от 0 до 31 через
   * пробел).
   * @return Закодированное сообщение, либо сообщение об ошибке во время
   * выполнения.
   */
  Q_INVOKABLE QString humanToHamming(const QString& outputFilePath,
                                     const QString& message);

  /**
   * @brief Преобразование кода Хэмминга в сообщение.
   * @param inputFilePath Путь к входному файлу.
   * @return Раскодированное сообщение - result.message и содержимое файла -
   * result.file. В случае ошибке во время выполнения result.message - пустая
   * строка, result.file - сообщение об ошибке.
   */
  Q_INVOKABLE QVariantMap hammingToHuman(const QString& inputFilePath);

  /**
   * @brief Внесение помех в сообщение.
   * @param inputFilePath Путь к входному файлу.
   * @param blockSize Размер блока для внесения помех.
   * @return true, если операция прошла успешно, иначе false.
   */
  Q_INVOKABLE bool interference(const QString& inputFilePath, int blockSize);

 protected:
  /**
   * @brief Вспомогательная функция для открытия файла и чтения сообщения.
   * @param filePath Путь к файлу.
   * @param message Считанное сообщение.
   * @param messageLength Длина сообщения (опционально).
   * @return true, если файл успешно открыт, иначе false.
   */
  static bool openFile(const QString& filePath, QString& message,
                       int* messageLength = nullptr);

  /**
   * @brief Сохранение сообщения в файл.
   * @param filePath Путь к файлу.
   * @param message Сообщение для сохранения.
   * @param messageLength Длина сообщения (опционально).
   * @return true, если файл успешно сохранен, иначе false.
   */
  static bool saveFile(const QString& filePath, const QString& message,
                       int messageLength = 0);

  /**
   * @class GilbertMoore
   * @brief Класс, реализующий алгоритм Гилберта-Мура.
   */
  class GilbertMoore {
   public:
    /**
     * @brief Конструктор класса GilbertMoore.
     */
    GilbertMoore();

    bool encode(const QString& inputFilePath, const QString& outputFilePath);
    bool decode(const QString& inputFilePath, const QString& outputFilePath);

    bool encodeParity(const QString& inputFilePath,
                      const QString& outputFilePath);
    QString decodeParity(const QString& inputFilePath,
                         const QString& outputFilePath);

    QString stringToBits(const QString& text);
    QString bitsToString(const QString& bits, QString& err_message);
    QString doubleToBinaryString(double value, int precision);
    double binaryStringToDouble(const QString& bits);
    QString XOR(const QString& a, const QString& b);

    QVector<QString> m_alphabet;
    uint32_t m_bitSymbolSize;
    QVector<double> m_probabilities;
    QVector<double> m_cumulativeProbabilities;
    QMap<QString, int> m_charToIndex;
    QVector<QString> m_encodedAlphabet;
    QMap<QString, int> m_encodedCharToIndex;
  };

  /**
   * @class Hamming
   * @brief Класс, реализующий алгоритм Хэмминга.
   */
  class Hamming {
   public:
    /**
     * @brief Конструктор класса Hamming.
     */
    Hamming();

    bool encode(const QString& inputFilePath, const QString& outputFilePath);
    QString decode(const QString& inputFilePath, const QString& outputFilePath);

    uint32_t m_bitSymbolSize = 5;
    QVector<QString> m_alphabet;
    QVector<QString> m_encodedAlphabet;
    QMap<QString, int> m_charToIndex;
    QMap<QString, int> m_encodedCharToIndex;

    Matrix<int> m_G95{{1, 0, 0, 0, 0, 0, 1, 0, 1},
                      {0, 1, 0, 0, 0, 1, 0, 1, 1},
                      {0, 0, 1, 0, 0, 1, 1, 0, 0},
                      {0, 0, 0, 1, 0, 0, 1, 1, 0},
                      {0, 0, 0, 0, 1, 0, 0, 1, 1}};
    Matrix<int> m_H95{{0, 1, 1, 0, 0, 1, 0, 0, 0},
                      {1, 0, 1, 1, 0, 0, 1, 0, 0},
                      {0, 1, 0, 1, 1, 0, 0, 1, 0},
                      {1, 1, 0, 0, 1, 0, 0, 0, 1}};

   private:
    /**
     * @brief Умножение слова на матрицу.
     * @param symbol Слово для умножения.
     * @param M Матрица для умножения.
     * @return Результат умножения.
     */
    QString mul(const QString& symbol, const Matrix<int>& M);
  };

  GilbertMoore m_gilbertMoore;
  Hamming m_hamming;
};