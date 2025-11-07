#pragma once

#include <QObject>
#include <QVector>

class Generator : public QObject {
  Q_OBJECT
 private:
  int p;           // mod p
  int k;           // количсество рекурент
  QVector<int> a;  // коэффициенты рекуренты
  QVector<int> x;  // начальные значения рекуренты
 public:
  explicit Generator(QObject* parent = nullptr) noexcept;

  Q_INVOKABLE QString readFileContent(const QString& filePath) const noexcept;
  Q_INVOKABLE bool saveContent(const QString& filePath,
                               const QString& text) const noexcept;
  Q_INVOKABLE void generateSequence(const QString& init_params) noexcept;
  Q_INVOKABLE int findPeriod() const noexcept;
  Q_INVOKABLE double chiSquaredTest() const noexcept;
  Q_INVOKABLE QString generateString() const noexcept;
};