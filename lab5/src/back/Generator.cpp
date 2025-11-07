#include "Generator.hpp"

#include <QDebug>
#include <QFile>
#include <QMap>
#include <QTextStream>

Generator::Generator(QObject* parent) noexcept
    : QObject(parent), p(30), k(2), a({1, 1}) {}

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

QString Generator::readFileContent(const QString& filePath) const noexcept {
  try {
    QString result;
    return (openFile(filePath, result)) ? result : "";
  } catch (...) {
    return "Ошибка при чтении";
  }
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

bool Generator::saveContent(const QString& filePath,
                            const QString& text) const noexcept {
  try {
    return (filePath.isEmpty()) ? false : saveFile(filePath, text);
  } catch (...) {
    return false;
  }
}

void Generator::generateSequence(const QString& init_params) noexcept {
  QStringList values = init_params.split(',');
  if (values.size() != k + 1) {
    qWarning() << "Ошибка: неверный формат входного файла.";
  } else {
    x.resize(k);
    for (int i = 0; i < k; ++i) {
      x[i] = values[i].toInt();
      qInfo() << x[i];
    }
    int count = values[k].toInt();
    if (count <= 0)
      x = {};
    else if (count == 1)
      x = {x[0]};
    else
      for (int i = 2; i < count; ++i) x.push_back((x[i - 1] + x[i - 2]) % p);
  }
}

int Generator::findPeriod() const noexcept {
  QMap<std::pair<int, int>, int> seen;
  for (int i = 0; i < static_cast<int>(x.size()) - 1; ++i) {
    std::pair<int, int> state = std::make_pair(x[i], x[i + 1]);
    if (seen.count(state)) {
      return i - seen[state];
    }
    seen[state] = i;
  }
  return -1;
}

double Generator::chiSquaredTest() const noexcept {
  QVector<int> freq(p, 0);
  for (int i : x) {
    if (i >= 0 && i < p) freq[i]++;
  }
  double expected = static_cast<double>(x.size()) / p;
  double chi2 = 0.0;
  for (int i = 0; i < p; ++i) {
    double diff = freq[i] - expected;
    chi2 += (diff * diff) / expected;
  }
  return chi2;
}

QString Generator::generateString() const noexcept {
  QString result;
  result.append("Последовательность:\n");
  for (int i = 0; i < x.size(); ++i)
    result += QString::number(x[i]) + ((i < x.size() - 1) ? ", " : "\n");
  result.append("Период: " + QString::number(findPeriod()) + "\n");
  result.append("Критерий Пирсона: " + QString::number(chiSquaredTest()));
  return result;
}
