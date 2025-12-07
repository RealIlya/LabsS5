// ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Добавлены макросы и заголовки для кроссплатформенности
#ifdef _WIN32
    #define _WINSOCK_DEPRECATED_NO_WARNINGS
    #include <winsock2.h>
    #include <ws2tcpip.h>
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
    #include <cstring>
    #define CLOSESOCKET close
    #define SOCKET_TYPE int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define IS_VALID_SOCKET(s) ((s) >= 0)
#endif

#include <iostream>
#include <string>
#include <vector>
#include <cctype> // для isupper, islower

const int BUFFER_SIZE = 1024;

// ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Функция инициализации сети (нужна только для Windows)
bool init_net() {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed." << std::endl;
        return false;
    }
#endif
    return true;
}

// ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Функция очистки сети (нужна только для Windows)
void cleanup_net() {
#ifdef _WIN32
    WSACleanup();
#endif
}

// ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Функция для вывода IP-адресов компьютера (Требование Лаб 6)
void print_server_ips() {
    char hostname[256];
    if (gethostname(hostname, sizeof(hostname)) == -1) {
        std::cerr << "Error getting hostname." << std::endl;
        return;
    }
    std::cout << "Server Hostname: " << hostname << std::endl;

    struct hostent* host = gethostbyname(hostname);
    if (host != nullptr) {
        std::cout << "Available IP addresses:" << std::endl;
        for (int i = 0; host->h_addr_list[i] != 0; ++i) {
            struct in_addr addr;
            #ifdef _WIN32
                memcpy(&addr, host->h_addr_list[i], sizeof(struct in_addr));
            #else
                memcpy(&addr, host->h_addr_list[i], sizeof(struct in_addr));
            #endif
            std::cout << "  - " << inet_ntoa(addr) << std::endl;
        }
    } else {
        std::cerr << "Could not resolve hostname." << std::endl;
    }
}

int main(int argc, char* argv[]) {
    if (!init_net()) return 1;

    // ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Вывод IP-адресов сервера при запуске
    print_server_ips();

    int port;
    // ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Ввод номера порта с клавиатуры
    std::cout << "Enter server port to listen on: ";
    std::cin >> port;

    // Проверка диапазона порта
    if (port <= 1024 || port > 65535) {
        std::cerr << "Invalid port number. Please use a port in the range 1025-65535." << std::endl;
        cleanup_net();
        return 1;
    }

    // Создание сокета
    SOCKET_TYPE listenSocket = socket(AF_INET, SOCK_STREAM, 0); // 0 автоматически выберет TCP
    if (!IS_VALID_SOCKET(listenSocket)) {
        std::cerr << "Socket creation failed." << std::endl;
        cleanup_net();
        return 1;
    }

    // Привязка сокета
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    // ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Привязка к INADDR_ANY (любые типы сетей: локальная, глобальная, петля)
    serverAddr.sin_addr.s_addr = INADDR_ANY; 

    if (bind(listenSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed." << std::endl;
        CLOSESOCKET(listenSocket);
        cleanup_net();
        return 1;
    }

    if (listen(listenSocket, 5) == SOCKET_ERROR) {
        std::cerr << "Listen failed." << std::endl;
        CLOSESOCKET(listenSocket);
        cleanup_net();
        return 1;
    }
    std::cout << "Server is listening on port " << port << "..." << std::endl;

    SOCKET_TYPE clientSocket;
    sockaddr_in clientAddr;
    #ifdef _WIN32
        int clientAddrSize = sizeof(clientAddr);
    #else
        socklen_t clientAddrSize = sizeof(clientAddr);
    #endif
    char buffer[BUFFER_SIZE];

    while (true) {
        std::cout << "Waiting for a connection..." << std::endl;
        clientSocket = accept(listenSocket, (struct sockaddr*)&clientAddr, &clientAddrSize);
        if (!IS_VALID_SOCKET(clientSocket)) {
            std::cerr << "Accept failed." << std::endl;
            continue;
        }

        // ====== ВНЕСЕНО ИЗМЕНЕНИЕ: Вывод IP-адреса и порта подключившегося клиента
        std::cout << "New connection from IP: " << inet_ntoa(clientAddr.sin_addr)
                  << ", Port: " << ntohs(clientAddr.sin_port) << std::endl;

        // Получение данных от клиента
        int bytesReceived = recv(clientSocket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            std::cout << "Data received: " << buffer << std::endl;

            // --- Основная логика (Вариант 1) ---
            std::string inputStr(buffer);
            std::string resultStr = "";

            if (!inputStr.empty()) {
                resultStr += inputStr[0];
                for (size_t i = 1; i < inputStr.length(); ++i) {
                    if (isupper(static_cast<unsigned char>(inputStr[i])) && islower(static_cast<unsigned char>(inputStr[i - 1]))) {
                        resultStr += ' '; // Вставляем пробел
                    }
                    resultStr += inputStr[i];
                }
            }
            // --- Конец блока ---

            // Отправка
            send(clientSocket, resultStr.c_str(), resultStr.length(), 0);
            std::cout << "Processed data sent: " << resultStr << std::endl;
        }

        CLOSESOCKET(clientSocket);
        std::cout << "Connection closed." << std::endl << std::endl;
    }

    CLOSESOCKET(listenSocket);
    cleanup_net();

    return 0;
}