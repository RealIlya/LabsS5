#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <cstring>
#include <algorithm>
#include <cstdio>

#ifdef _WIN32
    #define _WINSOCK_DEPRECATED_NO_WARNINGS
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #include <windows.h> 
    #pragma comment(lib, "Ws2_32.lib")

    #define CLOSESOCKET closesocket
    #define SOCKET_TYPE SOCKET
    #define IS_VALID_SOCKET(s) ((s) != INVALID_SOCKET)
#else
    #include <sys/types.h>
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <netdb.h>
    #include <clocale>

    #define CLOSESOCKET close
    #define SOCKET_TYPE int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define IS_VALID_SOCKET(s) ((s) >= 0)
#endif

// Функция настройки консоли
void setup_console() {
#ifdef _WIN32
    // Ставим CP1251, чтобы getline нормально читал русские буквы
    SetConsoleCP(1251);
    // Ставим UTF-8, чтобы отображать сообщения от Linux
    SetConsoleOutputCP(65001);

    // Включаем ANSI-коды (цвета, очистка строк)
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut != INVALID_HANDLE_VALUE) {
        DWORD dwMode = 0;
        if (GetConsoleMode(hOut, &dwMode)) {
            dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
            SetConsoleMode(hOut, dwMode);
        }
    }
    
    std::setvbuf(stdout, nullptr, _IOFBF, 1000);
#else
    std::setlocale(LC_ALL, "");
#endif
}

// Конвертация ввода Windows (CP1251) -> UTF-8
std::string to_utf8(const std::string& str) {
#ifdef _WIN32
    if (str.empty()) return "";

    // Сначала из CP1251 в UTF-16
    int wchars_num = MultiByteToWideChar(1251, 0, str.c_str(), -1, NULL, 0);
    if (wchars_num == 0) return str;
    
    std::vector<wchar_t> wstr(wchars_num);
    MultiByteToWideChar(1251, 0, str.c_str(), -1, &wstr[0], wchars_num);

    // Потом из UTF-16 в UTF-8
    int utf8_chars_num = WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, NULL, 0, NULL, NULL);
    if (utf8_chars_num == 0) return str;

    std::vector<char> utf8_str(utf8_chars_num);
    WideCharToMultiByte(CP_UTF8, 0, &wstr[0], -1, &utf8_str[0], utf8_chars_num, NULL, NULL);

    return std::string(&utf8_str[0]);
#else
    return str;
#endif
}

// Инициализация сети
bool initialize_sockets() {
#ifdef _WIN32
    WSADATA wsa_data;
    if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0) {
        std::cerr << "WSAStartup failed." << std::endl;
        return false;
    }
#endif
    return true;
}

// Очистка сети
void cleanup_sockets() {
#ifdef _WIN32
    WSACleanup();
#endif
}