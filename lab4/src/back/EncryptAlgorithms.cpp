#include "EncryptAlgorithms.hpp"

#include <QDebug>
#include <QFile>
#include <QTextStream>
#include <QUrl>

bool openFile(const QString& inputFilePath, QString& message) {
  QFile inputFile(inputFilePath);
  if (!inputFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
    qWarning() << "Ошибка: невозможно открыть файл для чтения:"
               << inputFilePath;
    return false;
  }
  QTextStream in(&inputFile);
  message = in.readAll().trimmed();
  inputFile.close();
  if (message.isEmpty()) {
    qWarning() << "Ошибка: входной файл пустой.";
    return false;
  }
  return true;
}

bool saveFile(const QString& outputFilePath, const QString& message) {
  QFile outputFile(outputFilePath);
  if (!outputFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
    qWarning() << "Ошибка: невозможно открыть файл для записи:"
               << outputFilePath;
    return false;
  }
  QTextStream out(&outputFile);
  out << message << "\n";
  outputFile.close();
  return true;
}

QString EncryptAlgorithms::readFileContent(
    const QString& filePath) const noexcept {
  try {
    QString result;
    return (openFile(filePath, result)) ? result : "";
  } catch (...) {
    return "Ошибка при чтении";
  }
}

bool EncryptAlgorithms::saveContent(const QString& filePath,
                                    const QString& text) const noexcept {
  try {
    return (filePath.isEmpty()) ? false : saveFile(filePath, text);
  } catch (...) {
    return false;
  }
}

EncryptAlgorithms::EncryptAlgorithms(QObject* parent) noexcept
    : QObject(parent), playfair_(nullptr) {}

QString EncryptAlgorithms::encryptPlayfair(const QString& keyPath,
                                           const QString& input) noexcept {
  try {
    QString key;
    if (openFile(keyPath, key)) {
      if (playfair_.get() == nullptr || playfair_->getKey() != key)
        playfair_ =
            std::make_unique<Playfair>(key, "ABCDEFGHIJKLMNOPQRSTUVWXYZ_", '*');
      return playfair_->encrypt(input);
    } else if (playfair_.get() != nullptr) {
      qInfo() << "Используется сохранённый ключ";
      return playfair_->encrypt(input);
    } else {
      qWarning() << "Ошибка: невозможно открыть файл с ключом";
      return "Ошибка при открытии файла ключа";
    }
  } catch (std::exception& e) {
    qWarning() << e.what();
    return "Ошибка при шифровании";
  }
}

QString EncryptAlgorithms::decryptPlayfair(const QString& keyPath,
                                           const QString& input) noexcept {
  try {
    QString key;
    if (openFile(keyPath, key)) {
      if (playfair_.get() == nullptr || playfair_->getKey() != key)
        playfair_ =
            std::make_unique<Playfair>(key, "ABCDEFGHIJKLMNOPQRSTUVWXYZ_", '*');
      return playfair_->decrypt(input);
    } else if (playfair_.get() != nullptr) {
      qInfo() << "Используется сохранённый ключ";
      return playfair_->decrypt(input);
    } else {
      qWarning() << "Ошибка: невозможно открыть файл с ключом";
      return "Ошибка при открытии файла ключа";
    }
  } catch (std::exception& e) {
    qWarning() << e.what();
    return "Ошибка при расшифровке";
  }
}

EncryptAlgorithms::Playfair::Playfair(const QString& key,
                                      const QString& alphabet,
                                      const QChar filled_char)
    : key_(key), filled_char_(filled_char) {
  if (key.isEmpty()) throw std::invalid_argument("Пустой ключ");
  if (alphabet.isEmpty()) throw std::invalid_argument("Пустой алфавит");
  QString key_prepared = "";
  for (QChar i : key)
    if (!key_prepared.contains(i)) key_prepared.append(i);
  for (QChar i : key_prepared)
    if (!alphabet.contains(i))
      throw std::invalid_argument("Ключ содержит символ не входящий в алфавит");
  if (alphabet.contains(filled_char_))
    qWarning() << "Осторожно: заполняющий символ находится в алфавите, "
                  "возможно неоднозначное шифрование";
  dimension_ = static_cast<int>(std::ceil(std::sqrt(alphabet.size())));
  matrix_ = "";
  std::vector<bool> used(alphabet.size(), false);
  for (auto i : key_prepared) {
    matrix_.append(i);
    used[alphabet.indexOf(i)] = true;
  }
  for (int i = 0; i < alphabet.size(); i++)
    if (!used[i]) matrix_.append(alphabet[i]);
  matrix_.append(filled_char_);
  bool key_passed = false;
  int idx = 0;
  while (matrix_.size() < dimension_ * dimension_) {
    if (!key_passed)
      if (idx < key_prepared.size())
        matrix_.append(key_prepared[idx++].toLower());
      else {
        key_passed = true;
        idx = 0;
      }
    else if (!used[idx++])
      matrix_.append(alphabet[idx].toLower());
  }
  qInfo() << "Матрица Плейфера успешно создана:";
  for (int i = 0; i < dimension_; ++i) {
    QString msg = "";
    for (int j = 0; j < dimension_; ++j) {
      msg += (QString(matrix_[i * dimension_ + j]) + " ");
    }
    qInfo() << msg;
  }
}

QString EncryptAlgorithms::Playfair::encrypt(const QString& text) const {
  QString result(text);
  prepareText(result, true);
  for (QChar i : result) {
    bool in = false;
    auto m_it = matrix_.begin();
    while (!in && m_it != matrix_.end())
      if (*(m_it++) == i) in = true;
    if (!in)
      throw std::invalid_argument(
          "Текст содержит символ не входящий в "
          "алфавит");
  }
  applyRules(result, true);
  return result;
}

QString EncryptAlgorithms::Playfair::decrypt(const QString& text) const {
  QString result(text);
  for (QChar i : result) {
    bool in = false;
    auto m_it = matrix_.begin();
    while (!in && m_it != matrix_.end())
      if (*(m_it++) == i) in = true;
    if (!in)
      throw std::invalid_argument(
          "Текст содержит символ не входящий в "
          "алфавит");
  }
  applyRules(result, false);
  prepareText(result, false);
  return result;
}

void EncryptAlgorithms::Playfair::prepareText(QString& text, bool mode) const {
  if (mode) {
    for (int i = 0; i < text.size() - 1; ++i) {
      if (text[i] == ' ') text[i] = '_';
      if (text[i] == text[i + 1]) text.insert((i++) + 1, filled_char_);
    }
    if (text[text.size() - 1] == ' ') text[text.size() - 1] = '_';
    if (text.size() % 2 != 0) text.append(filled_char_);
  } else {
    for (int i = 0; i < text.size(); ++i) {
      if (text[i] == '_') text[i] = ' ';
      if (text[i] == filled_char_) text.remove(i--, 1);
    }
  }
}

void EncryptAlgorithms::Playfair::applyRules(QString& text,
                                             bool mode) const noexcept {
  for (int i = 0; i < text.size() - 1; i += 2) {
    std::pair<int, int> idx1{0, 0}, idx2{0, 0};
    for (int mi = 0; mi < dimension_; ++mi) {
      for (int mj = 0; mj < dimension_; ++mj) {
        if (matrix_[mi * dimension_ + mj] == text[i]) idx1 = {mi, mj};
        if (matrix_[mi * dimension_ + mj] == text[i + 1]) idx2 = {mi, mj};
      }
    }
    int shift = dimension_ + ((mode) ? 1 : -1);
    if (idx1.first == idx2.first) {
      text[i] =
          matrix_[idx1.first * dimension_ + (idx1.second + shift) % dimension_];
      text[i + 1] =
          matrix_[idx2.first * dimension_ + (idx2.second + shift) % dimension_];
    } else if (idx1.second == idx2.second) {
      text[i] = matrix_[((idx1.first + shift) % dimension_) * dimension_ +
                        idx1.second];
      text[i + 1] = matrix_[((idx2.first + shift) % dimension_) * dimension_ +
                            idx2.second];
    } else {
      text[i] = matrix_[idx1.first * dimension_ + idx2.second];
      text[i + 1] = matrix_[idx2.first * dimension_ + idx1.second];
    }
  }
}