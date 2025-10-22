#include <iostream>
#include <string>
#include <windows.h>


// Объявление ассемблерной функции
// Функция возвращает число (0 - успех или -1 - ошибка)
extern "C" int ExtractAndToUpper(
    const char* src, // указатель на исходную строку
    int pos,
    int len,
    char* dst        // буфер для результата
);


void PrintOemString(const char* ansiStr) {
    char oemStr[256];
    CharToOemA(ansiStr, oemStr);
    std::cerr << oemStr;
}

int main() {
// ============================================================
    SetConsoleCP(866); // устанавливает кодовую страницу ввода в OEM 866 (кириллица для консоли)
    SetConsoleOutputCP(866); // устанавливает кодовую страницу вывода

    char input_oem[256] = {0}; // буфер для строки OEM
    char input_ansi[256] = {0}; // буфер для той же строки ANSI
    char result[256] = {0}; // буфер для результата в ANSI
    int pos, len;
// ============================================================


    std::cout << "Enter source string: ";
    std::cin.getline(input_oem, 255);
    OemToCharA(input_oem, input_ansi); // Преобразование OEM -> ANSI

    std::cout << "Enter start position (0-based): ";
    std::cin >> pos;

    std::cout << "Enter substring length: ";
    std::cin >> len;

    // =================================================== 
    // проверка границ (включая длину строки)
    // lstrlenA - ф-ия Windows для определения длины ANSI строки
    //
    int src_len = lstrlenA(input_ansi);
    if (pos < 0 || len <= 0 || pos + len > src_len) {
        PrintOemString("Ошибка: неправильная позиция или длина.\n");
        system("pause");
        return 1;
    }

    // Вызов ассемблерной процедуры
    int status = ExtractAndToUpper(input_ansi, pos, len, result);
    
    // Если ассемблер вернул не 0, то выводим сообщение об ошибке
    if (status != 0) {
        PrintOemString("Ошибка: неправильная параметры переданы в функцию ассемблера.\n");
        system("pause");
        return 1;
    }

    char result_oem[256];
    CharToOemA(result, result_oem);
    std::cout << "Result: " << result_oem << std::endl;

    system("pause");
    return 0;
}