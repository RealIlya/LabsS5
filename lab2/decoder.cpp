// decoder.cpp — для алгоритма Гильберта–Мура
#include <iostream>
#include <fstream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <cmath>

using namespace std;

struct Symbol {
    int id;
    double prob;
};

string build_code_for_symbol(double x, int l) {
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
    return code;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        cerr << "Использование: " << argv[0] << " <файл_вероятностей> <закодированный_файл>" << endl;
        return 1;
    }

    // 1. Загрузка вероятностей
    ifstream prob_in(argv[1]);
    if (!prob_in.is_open()) {
        cerr << "Ошибка: не удалось открыть файл вероятностей: " << argv[1] << endl;
        return 1;
    }

    vector<Symbol> symbols;
    int id; double p;
    while (prob_in >> id >> p) {
        symbols.push_back({id, p});
    }
    prob_in.close();

    // 2. Сортировка по убыванию вероятностей
    sort(symbols.begin(), symbols.end(), [](const Symbol& a, const Symbol& b) {
        return a.prob > b.prob;
    });

    // 3. Построение кумулятивных вероятностей и кодов
    map<string, int> reverse_code_map;
    vector<double> F(symbols.size(), 0.0);
    for (size_t i = 1; i < symbols.size(); ++i) {
        F[i] = F[i-1] + symbols[i-1].prob;
    }

    for (size_t i = 0; i < symbols.size(); ++i) {
        double x = F[i] + symbols[i].prob / 2.0;
        int l = static_cast<int>(ceil(log2(1.0 / symbols[i].prob))) + 1;
        if (l > 100) l = 100;
        string code = build_code_for_symbol(x, l);
        reverse_code_map[code] = symbols[i].id;
    }

    // 4. Чтение закодированной последовательности
    ifstream encoded_in(argv[2]);
    if (!encoded_in.is_open()) {
        cerr << "Ошибка: не удалось открыть закодированный файл: " << argv[2] << endl;
        return 1;
    }

    string encoded;
    encoded_in >> encoded;
    encoded_in.close();

    // 5. Декодирование
    ofstream decoded_out("decoded_output.txt");
    if (!decoded_out.is_open()) {
        cerr << "Ошибка: не удалось создать выходной файл" << endl;
        return 1;
    }

    string current = "";
    bool error = false;
    for (char c : encoded) {
        current += c;
        if (reverse_code_map.find(current) != reverse_code_map.end()) {
            decoded_out << reverse_code_map[current] << " ";
            current = "";
        }
    }

    if (!current.empty()) {
        cerr << "Ошибка: остаток '" << current << "' не распознан!" << endl;
        error = true;
    }

    decoded_out.close();

    if (error) {
        return 1;
    }

    cout << "Раскодированная последовательность сохранена в: decoded_output.txt" << endl;
    return 0;
}