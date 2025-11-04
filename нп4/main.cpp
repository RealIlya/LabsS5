#include <iostream>
#include <windows.h>
#include <cmath>
#include <limits>

extern "C" double compute_func(double x);

void PrintOemString(const char* ansiStr) {
    char oemStr[512];
    CharToOemA(ansiStr, oemStr);
    std::cout << oemStr;
}

int main() {
    // Настройка OEM-консоли
    SetConsoleCP(866);
    SetConsoleOutputCP(866);

    double x;
    PrintOemString("Введите значение x: ");

    // Попытка прочитать число
    if (!(std::cin >> x)) {
        PrintOemString("Ошибка: введены некорректные данные (требуется число).\n");
        return 1;
    }

    // Проверка на деление на ноль
    if (std::abs(x - 1.0) < 1e-12) {
        PrintOemString("Ошибка: деление на ноль (x не может быть равно 1).\n");
        return 1;
    }

    double result = compute_func(x);
    if (result == 0.0) result = 0.0;

    // Формируем строку результата
    char buffer[256];
    int len = std::snprintf(buffer, sizeof(buffer),
        "Результат: (%.2f + 2*%.2f^2) / (%.2f - 1) = %.2f\n", x, x, x, result);
    if (len > 0 && len < static_cast<int>(sizeof(buffer))) {
        PrintOemString(buffer);
    }
    else {
        PrintOemString("Ошибка: не удалось сформировать строку результата.\n");
    }

    return 0;
}