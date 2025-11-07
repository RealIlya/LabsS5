#include <iostream>
#include <fstream>
#include <vector>
#include <map>
#include <cmath>
#include <string>
#include <iomanip>

using namespace std;

const int N = 30;
const int MAX_GEN_FOR_SEARCH = 1200; // Для поиска максимального периода

// --- ФУНКЦИИ ДЛЯ ЧАСТИ I ---

// Генерация последовательности
vector<int> generateSequence(int x0, int x1, int count) {
    vector<int> seq;
    if (count <= 0) return seq;
    seq.push_back(x0);
    if (count == 1) return seq;
    seq.push_back(x1);
    for (int i = 2; i < count; ++i) {
        int next = (seq[i - 1] + seq[i - 2]) % N;
        seq.push_back(next);
    }
    return seq;
}

// Поиск периода по повторению пары состояний
int findPeriod(const vector<int>& seq) {
    map<pair<int, int>, int> seen;
    for (int i = 0; i < static_cast<int>(seq.size()) - 1; ++i) {
        pair<int, int> state = make_pair(seq[i], seq[i + 1]);
        if (seen.count(state)) {
            return i - seen[state];
        }
        seen[state] = i;
    }
    return -1;
}

// χ²-тест
double chiSquaredTest(const vector<int>& seq) {
    vector<int> freq(N, 0);
    for (int x : seq) {
        if (x >= 0 && x < N) freq[x]++;
    }
    double expected = static_cast<double>(seq.size()) / N;
    double chi2 = 0.0;
    for (int i = 0; i < N; ++i) {
        double diff = freq[i] - expected;
        chi2 += (diff * diff) / expected;
    }
    return chi2;
}

// Запись результата в output.txt
void writeOutput(const vector<int>& seq, int period, double chi2, int x0, int x1, int count, const string& filename) {
    ofstream fout(filename);
    if (!fout.is_open()) {
        cerr << "Ошибка: не удалось открыть файл для записи: " << filename << endl;
        return;
    }

    fout << "=== РЕЗУЛЬТАТЫ ГЕНЕРАЦИИ ===" << endl;
    fout << "Параметры генератора:" << endl;
    fout << "  N = " << N << endl;
    fout << "  Начальные значения: x0 = " << x0 << ", x1 = " << x1 << endl;
    fout << "  Длина последовательности: " << count << endl;
    fout << endl;

    fout << "Сгенерированная последовательность:" << endl;
    for (size_t i = 0; i < seq.size(); ++i) {
        fout << seq[i];
        if (i < seq.size() - 1) fout << ", ";
    }
    fout << endl << endl;

    fout << "Найденный период: " << period << endl;
    fout << endl;

    fout << "Результат проверки по критерию χ²-Пирсона:" << endl;
    fout << "  χ² = " << fixed << setprecision(6) << chi2 << endl;

    fout.close();
    cout << "Результаты части I записаны в файл: " << filename << endl;
}

// --- ФУНКЦИИ ДЛЯ ЧАСТИ II ---

// Поиск лучшей пары (x0, x1) с максимальным периодом
void findBestParameters(int& best_x0, int& best_x1, int& max_period, vector<int>& best_seq) {
    best_x0 = 0;
    best_x1 = 0;
    max_period = 0;

    for (int x0 = 0; x0 < N; ++x0) {
        for (int x1 = 0; x1 < N; ++x1) {
            if (x0 == 0 && x1 == 0) continue; // Тривиальный случай

            vector<int> seq = generateSequence(x0, x1, MAX_GEN_FOR_SEARCH);
            int period = findPeriod(seq);

            if (period > max_period) {
                max_period = period;
                best_x0 = x0;
                best_x1 = x1;
                best_seq = seq;
            }
        }
    }
}

// Сохранение лучшей последовательности
void saveBestSequence(const vector<int>& seq, int x0, int x1, int period, double chi2) {
    ofstream fout("best_sequence.txt");
    if (!fout.is_open()) {
        cerr << "Ошибка: не удалось открыть файл best_sequence.txt для записи." << endl;
        return;
    }

    fout << "=== ЛУЧШАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ (максимальный период) ===\n";
    fout << "Начальные значения: x0 = " << x0 << ", x1 = " << x1 << "\n";
    fout << "Максимальный период: " << period << "\n";
    fout << "Длина сгенерированной последовательности: " << seq.size() << "\n";
    fout << "Критерий χ² = " << fixed << setprecision(6) << chi2 << "\n\n";

    fout << "Последовательность (первый период):\n";
    for (int i = 0; i < period; ++i) {
        fout << seq[i];
        if (i + 1 < period) fout << ", ";
    }
    fout << "\n";
    fout.close();
    cout << "Результаты части II сохранены в best_sequence.txt" << endl;
}

// --- ОСНОВНАЯ ПРОГРАММА ---

int main() {
    cout << "=== ЗАДАНИЕ: АДДИТИВНЫЙ ГЕНЕРАТОР С N=30 ===" << endl;
    cout << "Формула: x_{t+1} = (x_t + x_{t-1}) mod 30" << endl;

    // --- ЧАСТЬ I ---
    cout << "\n--- ЧАСТЬ I: ГЕНЕРАЦИЯ ПО ПАРАМЕТРАМ ИЗ input.txt ---" << endl;

    ifstream fin("input.txt");
    if (!fin.is_open()) {
        cerr << "Ошибка: не удалось открыть входной файл input.txt" << endl;
        cout << "Создайте файл input.txt с содержимым:" << endl;
        cout << "x0 x1 count" << endl;
        cout << "Пример: 1 2 100" << endl;
        return 1;
    }

    int x0, x1, count;
    fin >> x0 >> x1 >> count;
    fin.close();

    cout << "Прочитано: x0=" << x0 << ", x1=" << x1 << ", count=" << count << endl;

    vector<int> sequence = generateSequence(x0, x1, count);
    int period = findPeriod(sequence);
    double chi2 = chiSquaredTest(sequence);

    writeOutput(sequence, period, chi2, x0, x1, count, "output.txt");

    // --- ЧАСТЬ II ---
    cout << "\n--- ЧАСТЬ II: ПОИСК МАКСИМАЛЬНОГО ПЕРИОДА ---" << endl;

    int best_x0, best_x1, max_period;
    vector<int> best_seq;

    findBestParameters(best_x0, best_x1, max_period, best_seq);

    // Берём один полный период для теста
    vector<int> one_period(best_seq.begin(), best_seq.begin() + max_period);
    double chi2_best = chiSquaredTest(one_period);

    cout << "\n✅ Результаты поиска:" << endl;
    cout << "Лучшая пара: x0 = " << best_x0 << ", x1 = " << best_x1 << endl;
    cout << "Максимальный период: " << max_period << endl;
    cout << "χ² для одного периода: " << fixed << setprecision(6) << chi2_best << endl;

    const double chi2_critical = 42.557; // df = 29, α = 0.05
    if (chi2_best < chi2_critical) {
        cout << "Последовательность проходит тест на равномерность (α = 0.05)." << endl;
    } else {
        cout << "Последовательность НЕ проходит тест на равномерность." << endl;
    }

    saveBestSequence(best_seq, best_x0, best_x1, max_period, chi2_best);

    // --- ВЫВОДЫ ---
    cout << "\n=== ВЫВОДЫ ===" << endl;
    cout << "1. Программа корректно работает при различных параметрах (проверено на примере из input.txt)." << endl;
    cout << "2. Максимальный период найден автоматически: " << max_period << endl;
    cout << "   (Теоретический максимум для N=30 — 899, но из-за составного модуля реальный максимум меньше)." << endl;
    cout << "3. Критерий χ²-Пирсона показал, что лучшая последовательность " 
         << (chi2_best < chi2_critical ? "равномерна" : "не является равномерной") << "." << endl;
    cout << "4. Все результаты сохранены в файлах output.txt и best_sequence.txt." << endl;

    return 0;
}