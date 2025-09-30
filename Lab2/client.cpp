#define _WINSOCK_DEPRECATED_NO_WARNINGS

#include <winsock2.h>

#include <iostream>
#include <string>

// При компиляции необходимо подключить библиотеку Ws2_32.lib
#pragma comment(lib, "Ws2_32.lib")

const int BUFFER_SIZE = 1024;  // Размер буфера

int main(int argc, char* argv[]) {
    // Проверка аргументов командной строки
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <server_ip> <port>" << std::endl;
        std::cerr << "Example: " << argv[0] << " 127.0.0.1 2001" << std::endl;
        return 1;
    }

    const char* serverIp = argv[1];
    int port = atoi(argv[2]);

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
    SOCKET clientSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (clientSocket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed. Error: " << WSAGetLastError() << std::endl;
        WSACleanup();
        return 1;
    }
    std::cout << "Client socket created." << std::endl;

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = inet_addr(serverIp);

    // Подключение к серверу
    if (connect(clientSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Connection to server failed. Error: " << WSAGetLastError() << std::endl;
        closesocket(clientSocket);
        WSACleanup();
        return 1;
    }
    std::cout << "Successfully connected to server " << serverIp << ":" << port << std::endl;

    // Отправка данных
    std::string message;
    std::cout << "Enter a line of text to send: ";
    std::getline(std::cin, message);

    if (send(clientSocket, message.c_str(), message.length(), 0) == SOCKET_ERROR) {
        std::cerr << "Send failed. Error: " << WSAGetLastError() << std::endl;
    } else {
        std::cout << "Data sent." << std::endl;

        // Получение ответа от сервера
        char buffer[BUFFER_SIZE];
        int bytesReceived = recv(clientSocket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            std::cout << "Server response: " << buffer << std::endl;
        } else {
            std::cerr << "Receive failed or connection closed. Error: " << WSAGetLastError() << std::endl;
        }
    }

    // Закрытие сокета и очистка
    closesocket(clientSocket);
    WSACleanup();
    std::cout << "Connection closed. Exiting." << std::endl;

    system("pause");  // Чтобы консольное окно не закрылось сразу
    return 0;
}