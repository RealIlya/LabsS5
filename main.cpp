#include <iostream>
#include <string>
#include <windows.h>


// ���������� ������������ �������
// ������� ���������� ����� (0 - ����� ��� -1 - ������)
extern "C" int ExtractAndToUpper(
    const char* src, // ��������� �� �������� ������
    int pos,
    int len,
    char* dst        // ����� ��� ����������
);


void PrintOemString(const char* ansiStr) {
    char oemStr[256];
    CharToOemA(ansiStr, oemStr);
    std::cerr << oemStr;
}

int main() {
// ============================================================
    SetConsoleCP(866); // ������������� ������� �������� ����� � OEM 866 (��������� ��� �������)
    SetConsoleOutputCP(866); // ������������� ������� �������� ������

    char input_oem[256] = {0}; // ����� ��� ������ OEM
    char input_ansi[256] = {0}; // ����� ��� ��� �� ������ ANSI
    char result[256] = {0}; // ����� ��� ���������� � ANSI
    int pos, len;
// ============================================================


    std::cout << "Enter source string: ";
    std::cin.getline(input_oem, 255);
    OemToCharA(input_oem, input_ansi); // �������������� OEM -> ANSI

    std::cout << "Enter start position (0-based): ";
    std::cin >> pos;

    std::cout << "Enter substring length: ";
    std::cin >> len;

    // =================================================== 
    // �������� ������ (������� ����� ������)
    // lstrlenA - �-�� Windows ��� ����������� ����� ANSI ������
    //
    int src_len = lstrlenA(input_ansi);
    if (pos < 0 || len <= 0 || pos + len > src_len) {
        PrintOemString("������: ������������ ������� ��� �����.\n");
        system("pause");
        return 1;
    }

    // ����� ������������ ���������
    int status = ExtractAndToUpper(input_ansi, pos, len, result);
    
    // ���� ��������� ������ �� 0, �� ������� ��������� �� ������
    if (status != 0) {
        PrintOemString("������: ������������ ��������� �������� � ������� ����������.\n");
        system("pause");
        return 1;
    }

    char result_oem[256];
    CharToOemA(result, result_oem);
    std::cout << "Result: " << result_oem << std::endl;

    system("pause");
    return 0;
}