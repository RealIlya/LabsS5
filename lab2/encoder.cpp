// encoder.cpp — строгая реализация алгоритма Гильберта–Мура
#include <iostream>
#include <fstream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <cmath>
#include <iomanip>

using namespace std;

struct Symbol {
    int id;
    double prob;
};

class GilbertMooreCoder {
private:
    vector<Symbol> symbols;
    map<int, string> code_map;
    double avg_length = 0.0;
    double entropy = 0.0;
    double redundancy = 0.0;
    bool kraft_inequality_holds = true;

public:
    void load_probabilities(const string& filename) {
        ifstream fin(filename);
        if (!fin.is_open()) {
            cerr << "Ошибка: не удалось открыть файл вероятностей: " << filename << endl;
            exit(1);
        }

        int id;
        double prob;
        while (fin >> id >> prob) {
            if (prob <= 0) {
                cerr << "Ошибка: вероятность должна быть > 0" << endl;
                exit(1);
            }
            symbols.push_back({id, prob});
        }
        fin.close();

        // Сортировка по убыванию вероятностей — ОБЯЗАТЕЛЬНО для Гильберта-Мура
        sort(symbols.begin(), symbols.end(), [](const Symbol& a, const Symbol& b) {
            return a.prob > b.prob;
        });

        // Проверка: сумма вероятностей ≈ 1
        double total = 0.0;
        for (const auto& s : symbols) total += s.prob;
        if (abs(total - 1.0) > 1e-6) {
            cerr << "Предупреждение: сумма вероятностей = " << total << " (должна быть ~1.0)" << endl;
        }

        // Энтропия
        entropy = 0.0;
        for (const auto& s : symbols) {
            entropy += s.prob * log2(1.0 / s.prob);
        }
    }

    void build_codes() {
        if (symbols.empty()) return;

        // Шаг 1: кумулятивные вероятности F[i]
        vector<double> F(symbols.size(), 0.0);
        for (size_t i = 1; i < symbols.size(); ++i) {
            F[i] = F[i-1] + symbols[i-1].prob;
        }

        // Шаг 2: для каждого символа — строим код
        for (size_t i = 0; i < symbols.size(); ++i) {
            double x = F[i] + symbols[i].prob / 2.0; // центр интервала
            int l = static_cast<int>(ceil(log2(1.0 / symbols[i].prob))) + 1;

            // Защита от слишком больших l (на случай очень малых p)
            if (l > 100) l = 100;

            string code = "";
            double frac = x;
            for (int j = 0; j < l; ++j) {
                frac *= 2.0;
                if (frac >= 1.0) {
                    code += '1';
                    frac -= 1.0;
                } else {
                    code += '0';
                }
            }

            code_map[symbols[i].id] = code;
        }
    }

    void calculate_metrics() {
        avg_length = 0.0;
        for (const auto& s : symbols) {
            avg_length += s.prob * static_cast<double>(code_map[s.id].length());
        }
        redundancy = avg_length - entropy;

        // Проверка неравенства Крафта
        double kraft_sum = 0.0;
        for (const auto& s : symbols) {
            kraft_sum += pow(2.0, -static_cast<double>(code_map[s.id].length()));
        }
        kraft_inequality_holds = (kraft_sum <= 1.0 + 1e-9);
    }

    void print_results() {
        cout << "=== Кодовые слова (алгоритм Гильберта–Мура) ===" << endl;
        for (const auto& s : symbols) {
            cout << "Символ " << s.id 
                 << " (p=" << fixed << setprecision(6) << s.prob 
                 << "): " << code_map[s.id] << endl;
        }

        cout << fixed << setprecision(6);
        cout << "\nСредняя длина кодового слова: " << avg_length << endl;
        cout << "Энтропия: " << entropy << endl;
        cout << "Избыточность: " << redundancy << endl;
        cout << "Неравенство Крафта: " << (kraft_inequality_holds ? "выполняется" : "НЕ выполняется") << endl;
    }

    void encode_sequence(const string& input_file, const string& output_file) {
        ifstream fin(input_file);
        if (!fin.is_open()) {
            cerr << "Ошибка: не удалось открыть входной файл: " << input_file << endl;
            exit(1);
        }

        ofstream fout(output_file);
        if (!fout.is_open()) {
            cerr << "Ошибка: не удалось создать выходной файл: " << output_file << endl;
            exit(1);
        }

        int symbol;
        string encoded = "";
        while (fin >> symbol) {
            if (code_map.find(symbol) == code_map.end()) {
                cerr << "Ошибка: символ " << symbol << " отсутствует в алфавите!" << endl;
                exit(1);
            }
            encoded += code_map[symbol];
        }

        fout << encoded << endl;
        cout << "\nЗакодированная последовательность сохранена в: " << output_file << endl;
        cout << "Длина закодированной последовательности: " << encoded.length() << " бит" << endl;

        fin.close();
        fout.close();
    }
};

int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Использование: " << argv[0] << " <файл_вероятностей> <входной_файл>" << endl;
        return 1;
    }

    GilbertMooreCoder coder;
    coder.load_probabilities(argv[1]);
    coder.build_codes();
    coder.calculate_metrics();
    coder.print_results();
    coder.encode_sequence(argv[2], "encoded_output.txt");

    return 0;
}