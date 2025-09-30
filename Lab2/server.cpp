#define _WINSOCK_DEPRECATED_NO_WARNINGS

#include <winsock2.h>

#include <cctype>  // для isupper, islower
#include <iostream>
#include <string>

// При компиляции необходимо подключить библиотеку Ws2_32.lib
#pragma comment(lib, "Ws2_32.lib")

const int BUFFER_SIZE = 1024;  // Размер буфера

int main(int argc, char* argv[]) {
    // Проверка аргументов командной строки
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
        std::cerr << "Example: " << argv[0] << " 2001" << std::endl;
        return 1;
    }

    // Преобразование порта из строки в число
    int port = atoi(argv[1]);

    // Проверка диапазона порта
    if (port <= 1024 || port > 65535) {
        std::cerr << "Invalid port number. Please use a port in the range 1025-65535." << std::endl;
        return 1;
    }

    // Инициализация Winsock
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed." << std::endl;
        return 1;
    }
    std::cout << "Winsock initialized." << std::endl;

    // Создание сокета
    SOCKET listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSocket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed. Error: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return 1;
    }
    std::cout << "Listen socket created." << std::endl;

    // Привязка сокета к IP-адресу и порту
    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = INADDR_ANY;  // Принимать подключения на любом IP-адресе

    if (bind(listenSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed. Error: " << WSAGetLastError() << std::endl;
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }
    std::cout << "Server started at port " << serverAddr.sin_port << std::endl;

    // Перевод сокета в режим прослушивания
    if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed. Error: " << WSAGetLastError() << std::endl;
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }
    std::cout << "Server is listening for incoming connections..." << std::endl;

    // Цикл приема клиентов
    SOCKET clientSocket;
    sockaddr_in clientAddr;
    int clientAddrSize = sizeof(clientAddr);
    char buffer[BUFFER_SIZE];

    while (true) {
        clientSocket = accept(listenSocket, (SOCKADDR*)&clientAddr, &clientAddrSize);
        if (clientSocket == INVALID_SOCKET) {
            std::cerr << "Accept failed. Error: " << WSAGetLastError() << std::endl;
            continue;  // Продолжаем слушать других клиентов
        }

        std::cout << "New connection accepted from " << inet_ntoa(clientAddr.sin_addr)
                  << ":" << ntohs(clientAddr.sin_port) << std::endl;

        // Получение данных от клиента
        int bytesReceived = recv(clientSocket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';  // Гарантируем, что строка заканчивается null-терминатором
            std::cout << "Data received: " << buffer << std::endl;

            // --- Основная логика ---
            std::string inputStr(buffer);
            std::string resultStr = "";

            if (!inputStr.empty()) {
                resultStr += inputStr[0];  // Первый символ добавляем как есть
                for (size_t i = 1; i < inputStr.length(); ++i) {
                    // Если текущий символ - эьл прописная буква, а предыдущий - строчная
                    if (isupper(static_cast<unsigned char>(inputStr[i])) && islower(static_cast<unsigned char>(inputStr[i - 1]))) {
                        resultStr += ' ';  // Вставляем пробел
                    }
                    resultStr += inputStr[i];
                }
            }
            // --- Конец блока ---

            // Отправка обработанных данных обратно клиенту
            send(clientSocket, resultStr.c_str(), resultStr.length(), 0);
            std::cout << "Processed data sent: " << resultStr << std::endl;
        }

        // Закрытие сокета клиента
        closesocket(clientSocket);
        std::cout << "Connection closed." << std::endl
                  << std::endl;
    }

    // Очистка (в данном примере до этого кода не дойдет)
    closesocket(listenSocket);
    WSACleanup();

    return 0;
}