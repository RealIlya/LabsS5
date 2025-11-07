#include "CodingAlgorithms.hpp"

#include <QDebug>
#include <QFile>
#include <QTextStream>
#include <QUrl>

CodingAlgorithms::CodingAlgorithms(QObject* parent)
    : QObject(parent), m_gilbertMoore(), m_hamming() {}

CodingAlgorithms::GilbertMoore::GilbertMoore()
    : m_alphabet{"11", "12", "13", "14", "15", "16", "17"} {
  int alphabetSize = m_alphabet.length();
  double p = 1. / alphabetSize;
  m_bitSymbolSize =
      floor(log2(alphabetSize * 2)) + 1;  // количество бит на символ
  qInfo() << "--- Gilbert Moore ---";
  qInfo() << "Alphabet size:" << alphabetSize;
  m_probabilities.fill(p, alphabetSize);
  m_cumulativeProbabilities.resize(alphabetSize + 1);
  m_encodedAlphabet.resize(alphabetSize);
  m_cumulativeProbabilities[0] = 0;
  for (int i = 0; i < alphabetSize; ++i) {
    m_cumulativeProbabilities[i + 1] =
        m_cumulativeProbabilities[i] + m_probabilities[i];
    m_charToIndex[m_alphabet[i]] = i;
    m_encodedAlphabet[i] = doubleToBinaryString(
        m_cumulativeProbabilities[i] + m_probabilities[i] / 2, m_bitSymbolSize);
    m_encodedCharToIndex[m_encodedAlphabet[i]] = i;
    qInfo() << "Symbol:" << m_alphabet[i] << "Bits:" << m_encodedAlphabet[i]
            << "Probability:" << p
            << "Cumulative Probability:" << m_cumulativeProbabilities[i];
  }
}

QString CodingAlgorithms::GilbertMoore::stringToBits(const QString& text) {
  QString bits = "";
  for (int i = 0; i < text.length(); i += 2) {
    QString ch = text.mid(i, 2);
    if (!m_charToIndex.contains(ch)) {
      qWarning() << "Ошибка: символ не из алфавита:" << ch;
      return "";
    }
    bits.append(m_encodedAlphabet[m_charToIndex[ch]]);
  }
  return bits;
}

QString CodingAlgorithms::GilbertMoore::bitsToString(const QString& bits,
                                                     QString& err_message) {
  QString text = "";
  for (int i = 0; i < bits.length(); i += m_bitSymbolSize) {
    QString ch = bits.mid(i, m_bitSymbolSize);
    if (!m_encodedCharToIndex.contains(ch)) {
      err_message.append(
          "Ошибка: не получилось конвертировать последовательность "
          "бит в символ:" +
          ch + "\n");
      text.append("~~");
    } else
      text.append(m_alphabet[m_encodedCharToIndex[ch]]);
  }
  return text;
}

QString CodingAlgorithms::GilbertMoore::XOR(const QString& a,
                                            const QString& b) {
  if (a.length() != b.length()) {
    qWarning() << "Ошибка: длины строк для XOR не совпадают:" << a.length()
               << "!=" << b.length();
    return "";
  }
  QString result;
  for (int i = 0; i < a.length(); ++i) {
    result.append((a[i] == b[i]) ? '0' : '1');
  }
  return result;
}

QString CodingAlgorithms::GilbertMoore::doubleToBinaryString(double value,
                                                             int precision) {
  QString bits = "";
  double current = value;
  for (int i = 0; i < precision; ++i) {
    current *= 2.0;
    if (current >= 1.0) {
      bits.append('1');
      current -= 1.0;
    } else {
      bits.append('0');
    }
  }
  return bits;
}

double CodingAlgorithms::GilbertMoore::binaryStringToDouble(
    const QString& bits) {
  double value = 0.0;
  double powerOfTwo = 0.5;

  for (const QChar& bit : bits) {
    if (bit == '1') {
      value += powerOfTwo;
    }
    powerOfTwo /= 2.0;
  }
  return value;
}

bool CodingAlgorithms::openFile(const QString& inputFilePath, QString& message,
                                int* messageLength) {
  QFile inputFile(inputFilePath);
  if (!inputFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qWarning() << "Ошибка: невозможно открыть файл для чтения:"
               << inputFilePath;
    return false;
  }
  QTextStream in(&inputFile);
  if (messageLength == nullptr)
    message = in.readAll().trimmed();
  else {
    message = in.readLine();
    *messageLength = in.readLine().toInt();
  }
  inputFile.close();
  if (message.isEmpty()) {
    qWarning() << "Ошибка: входной файл пустой.";
    return false;
  }
  return true;
}

bool CodingAlgorithms::saveFile(const QString& outputFilePath,
                                const QString& message, int messageLength) {
  QFile outputFile(outputFilePath);
  if (!outputFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
    qWarning() << "Ошибка: невозможно открыть файл для записи:"
               << outputFilePath;
    return false;
  }
  QTextStream out(&outputFile);
  out << message << "\n";
  if (messageLength != 0) out << messageLength << "\n";
  outputFile.close();
  return true;
}

bool CodingAlgorithms::GilbertMoore::encode(const QString& inputFilePath,
                                            const QString& outputFilePath) {
  QString message;
  bool result = openFile(inputFilePath, message);
  if (!result) {
    return false;
  }
  qInfo() << "Сообщение для кодирования:" << message;
  QString binaryCode = stringToBits(message);
  if (!binaryCode.isEmpty()) {
    result = saveFile(outputFilePath, binaryCode);
    if (!result) {
      return false;
    }
    qInfo() << "Сообщение закодировано в" << binaryCode << "и сохранено в"
            << outputFilePath;
    return true;
  } else {
    qWarning() << "Ошибка: невозможно закодировать сообщение:" << message;
    return false;
  }
}

bool CodingAlgorithms::encodeGilbertMoore(const QString& inputFilePath,
                                          const QString& outputFilePath) {
  return m_gilbertMoore.encode(inputFilePath, outputFilePath);
}

bool CodingAlgorithms::GilbertMoore::decode(const QString& inputFilePath,
                                            const QString& outputFilePath) {
  QString binaryCode;
  bool result = openFile(inputFilePath, binaryCode);
  if (!result) {
    return false;
  }
  qInfo() << "Decoding code:" << binaryCode;
  if (binaryCode.length() % m_bitSymbolSize != 0) {
    qWarning()
        << "Ошибка: неверная длина последовательности бит. Должна делиться на "
           "m_bitSymbolSize ="
        << m_bitSymbolSize;
    return false;
  }
  QString err;
  QString decodedMessage = bitsToString(binaryCode, err);
  qWarning() << err;
  if (!decodedMessage.isEmpty()) {
    result = saveFile(outputFilePath, decodedMessage);
    if (!result) {
      return false;
    }
    qInfo() << "Decoded message:" << decodedMessage << "and saved to"
            << outputFilePath;
    return true;
  } else {
    qWarning() << "Decoded failded:" << binaryCode;
    return false;
  }
}

bool CodingAlgorithms::decodeGilbertMoore(const QString& inputFilePath,
                                          const QString& outputFilePath) {
  return m_gilbertMoore.decode(inputFilePath, outputFilePath);
}

bool CodingAlgorithms::GilbertMoore::encodeParity(
    const QString& inputFilePath, const QString& outputFilePath) {
  QString message;
  bool result = openFile(inputFilePath, message);
  if (!result) {
    return false;
  }
  QString bits = stringToBits(message);
  if (bits.isEmpty()) return false;

  QString encodedBits = "";
  // Проверяем, является ли длина битовой последовательности четной или нечетной
  if (bits.length() % 2 == 0) {
    // Правило для четной длины: блоки по 2 бита
    for (int i = 0; i < bits.length() - 1; i += 2) {
      auto b1 = bits[i];
      auto b2 = bits[i + 1];
      auto parity = XOR(b1, b2);
      encodedBits.append(b1);
      encodedBits.append(b2);
      encodedBits.append(parity);
    }
  } else {
    // Правило для нечетной длины: блоки по 3 бита
    qWarning() << "Ошибка: допускается кодирование блоками по"
               << m_bitSymbolSize << "бита (четной длины).";
  }

  result = saveFile(outputFilePath, encodedBits);
  if (!result) {
    return false;
  }
  qInfo() << "Кодирование с проверкой на четность прошло успешно.";
  return true;
}

bool CodingAlgorithms::encodeParity(const QString& inputFilePath,
                                    const QString& outputFilePath) {
  return m_gilbertMoore.encodeParity(inputFilePath, outputFilePath);
}

QString CodingAlgorithms::GilbertMoore::decodeParity(
    const QString& inputFilePath, const QString& outputFilePath) {
  QString encodedBits;
  bool result = openFile(inputFilePath, encodedBits);
  if (!result) {
    return "false";
  }
  QString decodedBits = "";
  QString errorLog = "";

  if (encodedBits.length() % 3 == 0) {
    for (int i = 0; i < encodedBits.length(); i += 3) {
      auto b1 = encodedBits[i];
      auto b2 = encodedBits[i + 1];
      auto p = encodedBits[i + 2];

      if (XOR(b1, b2) != p) {
        errorLog.append(QString("Замечена ошибка в блоке %1.\n").arg(i));
      }
      // Даже если есть ошибка, мы все равно пытаемся раскодировать, как требует
      // задание
      decodedBits.append(b1);
      decodedBits.append(b2);
    }
  } else {
    qWarning() << "Ошибка: допускается кодирование блоками по"
               << m_bitSymbolSize << "бита (четной длины).";
    return "false";
  }
  if (decodedBits.length() % m_bitSymbolSize != 0) {
    qWarning()
        << "Ошибка: неверная длина последовательности бит. Должна делиться на "
           "m_bitSymbolSize ="
        << m_bitSymbolSize;
    return "false";
  }
  auto decodedMessage = bitsToString(decodedBits, errorLog);
  if (decodedMessage.length() / 2 !=
      encodedBits.length() / 3 * 2 / m_bitSymbolSize) {
    errorLog.append(
        "Длина раскодированного сообщения не совпадает с оригинальной.\n");
  }
  // Запись раскодированного сообщения
  QFile decodedFile(outputFilePath);
  if (!decodedFile.open(QIODevice::WriteOnly | QIODevice::Text)) { /*...*/
    return "false";
  }
  QTextStream outDecoded(&decodedFile);
  outDecoded << decodedMessage;
  decodedFile.close();

  if (errorLog.isEmpty()) errorLog.append("No errors detected.");
  qInfo() << errorLog;
  qInfo() << "Parity decoding successful.";
  return errorLog;
}

QString CodingAlgorithms::decodeParity(const QString& inputFilePath,
                                       const QString& outputFilePath) {
  return m_gilbertMoore.decodeParity(inputFilePath, outputFilePath);
}

CodingAlgorithms::Hamming::Hamming() {
  m_H95 = m_H95.Transpose();
  qInfo() << "--- Hamming (9,5) ---";
  int alphabetSize = pow(2, m_bitSymbolSize);
  qInfo() << "Alphabet size:" << alphabetSize;
  for (int i = 0; i < alphabetSize; i++) {
    m_alphabet.append(
        QString::number(i, 2).rightJustified(m_bitSymbolSize, '0'));
    m_charToIndex[m_alphabet[i]] = i;
    m_encodedAlphabet.append(mul(m_alphabet[i], m_G95));
    m_encodedCharToIndex[m_encodedAlphabet[i]] = i;
    qInfo() << "Symbol:" << m_alphabet[i] << "Bits:" << m_encodedAlphabet[i];
  }
}

QString CodingAlgorithms::Hamming::mul(const QString& symbol,
                                       const Matrix<int>& M) {
  QString result;
  for (int j = 0; j < M.GetCols(); ++j) {
    int sum = 0;
    for (int i = 0; i < M.GetRows(); ++i) {
      sum += M(i, j) * symbol[i].digitValue();
    }
    result.append((sum % 2) ? '1' : '0');
  }
  return result;
}

bool CodingAlgorithms::Hamming::encode(const QString& inputFilePath,
                                       const QString& outputFilePath) {
  QString message;
  bool result = openFile(inputFilePath, message, nullptr);
  if (!result) {
    return false;
  }
  qInfo() << "Сообщение для кодирования:" << message;
  QStringList symbols;
  QString tmp = "";
  for (int i = 0; i < message.length(); i++) {
    tmp.append(message[i]);
    if (tmp.length() == m_bitSymbolSize) {
      symbols.append("");
      symbols.back() = tmp;
      tmp = "";
    }
  }
  if (!tmp.isEmpty()) {
    qWarning() << "Ошибка: длина сообщения не делится на размер слова:"
               << m_bitSymbolSize;
    return false;
  }
  QString binaryCode = "";
  for (int i = 0; i < symbols.size(); i++) {
    binaryCode.append(m_encodedAlphabet[m_charToIndex[symbols[i]]]);
  }
  result = saveFile(outputFilePath, binaryCode);
  if (!result) {
    return false;
  }
  qInfo() << "Сообщение закодировано в" << binaryCode << "и сохранено в"
          << outputFilePath;
  return true;
}

bool CodingAlgorithms::encodeHamming(const QString& inputFilePath,
                                     const QString& outputFilePath) {
  return m_hamming.encode(inputFilePath, outputFilePath);
}

QString CodingAlgorithms::Hamming::decode(const QString& inputFilePath,
                                          const QString& outputFilePath) {
  QString encodedMessage;
  int messageLength;
  bool result = openFile(inputFilePath, encodedMessage, &messageLength);
  if (!result) {
    return "false";
  }
  qInfo() << "Сообщение для декодирования:" << encodedMessage;
  QString decodedMessage = "";
  QString errorLog = "";
  QStringList blocks;
  QString tmp = "";
  for (int i = 0; i < encodedMessage.length(); ++i) {
    tmp.append(encodedMessage[i]);
    if (tmp.length() == 9) {
      blocks.append("");
      blocks.back() = tmp;
      tmp = "";
    }
  }
  if (!tmp.isEmpty()) {
    qWarning() << "Ошибка: длина закодированного сообщения не делится на "
                  "размер слова (9)";
    return "false";
  }
  int i = 0;
  for (auto& block : blocks) {
    // Проверка
    auto res = mul(block, m_H95);
    bool isError = res.contains('1');
    if (isError) {
      errorLog.append(QString("Обнаружена ошибка в блоке %1. Синдром: %2.\n")
                          .arg(i)
                          .arg(res));
      // Поиск позиции ошибки
      int errorPos = -1;
      for (int j = 0; j < m_H95.GetRows(); ++j) {
        QString row;
        for (int k = 0; k < m_H95.GetCols(); ++k)
          row.append(QString::number(m_H95(j, k)));
        if (row == res) {
          errorPos = j;
          break;
        }
      }
      if (errorPos == -1) {
        errorLog.append(
            QString("Ошибку в блоке %1 не получилось исправить.\n").arg(i));
        decodedMessage.append("~~~~~");
      } else {
        block[errorPos] = (block[errorPos] == '1') ? '0' : '1';
        // снова проверка
        auto res2 = mul(block, m_H95);
        if (res2.contains('1')) {
          errorLog.append(
              QString("Ошибку в блоке %1 не получилось исправить.\n").arg(i));
          decodedMessage.append("~~~~~");
        } else {
          errorLog.append(QString("Ошибка в блоке %1 исправлена.\n").arg(i));
          decodedMessage.append(m_alphabet[m_encodedCharToIndex[block]]);
        }
      }
    } else {
      int index = m_encodedCharToIndex[block];
      decodedMessage.append(m_alphabet[index]);
    }
    i++;
  }
  result = saveFile(outputFilePath, decodedMessage);
  if (!result) {
    return "false";
  }
  qInfo() << "Сообщение декодировано в" << decodedMessage << "и сохранено в"
          << outputFilePath;
  return errorLog;
}

QString CodingAlgorithms::decodeHamming(const QString& inputFilePath,
                                        const QString& outputFilePath) {
  return m_hamming.decode(inputFilePath, outputFilePath);
}

QString CodingAlgorithms::humanToHamming(const QString& outputFilePath,
                                         const QString& message) {
  bool error = false;
  auto symbols = message.trimmed().split(" ");
  QString result = "";
  for (auto& symbol : symbols) {
    bool ok;
    int sym = symbol.toInt(&ok);
    if (ok && sym < 32 && sym >= 0)
      result.append(m_hamming.m_alphabet[sym]);
    else if (symbol == "~") {
      result.append("~~~~~");
    } else {
      result = "Ошибка: символа " + symbol + " нет в алфавите";
      error = true;
      break;
    }
  }
  if (!error) {
    error = !saveFile(outputFilePath, result);
    return (error) ? "Ошибка: не удалось открыть файл для записи" : result;
  }
  return result;
}

QVariantMap CodingAlgorithms::hammingToHuman(const QString& inputFilePath) {
  QVariantMap result;
  QString file;
  QString message;
  bool error = !openFile(inputFilePath, file);
  if (error) {
    file = "Ошибка: не удалось открыть файл для чтения";
    message = "";
  } else {
    QStringList symbols;
    QString tmp = "";
    for (int i = 0; i < file.length(); ++i) {
      tmp.append(file[i]);
      if (tmp.length() == 5) {
        symbols.append("");
        symbols.back() = tmp;
        tmp = "";
      }
    }
    if (!tmp.isEmpty()) {
      qWarning()
          << "Ошибка: не удалось декодировать сообщение кода Хэмминга в числа";
      qWarning() << "Причина: сообщение не делится на длину кодового слова (5)";
      message = "";
    } else {
      message = "";
      for (const auto& symbol : symbols) {
        if (symbol == "~~~~~") {
          message.append("~ ");
        } else if (m_hamming.m_charToIndex.contains(symbol)) {
          message.append(QString::number(m_hamming.m_charToIndex[symbol]) +
                         " ");
        } else {
          qWarning()
              << "Ошибка: не удалось декодировать сообщение кода Хэмминга "
                 "в числа";
          qWarning() << "Ошибка: символа " + symbol + " нет в алфавите";
          message = "";
          break;
        }
      }
    }
  }
  result["file"] = file;
  result["message"] = message.trimmed();
  return result;
}

bool CodingAlgorithms::interference(const QString& inputFilePath,
                                    int blockSize) {
  QString message;
  bool result = openFile(inputFilePath, message);
  double interference = 0.4;
  int lastChanged = 0;
  if (result) {
    bool changed = false;
    for (int i = 0; i < message.length(); ++i) {
      if ((i - lastChanged) % blockSize == 0) {
        changed = false;
      }
      if (!changed && static_cast<double>(rand()) / RAND_MAX < interference) {
        message[i] = (message[i] == '0') ? '1' : '0';
        lastChanged = i;
        changed = true;
      }
    }
    result = saveFile(inputFilePath, message);
  }
  return result;
}