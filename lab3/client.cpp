#define _WINSOCK_DEPRECATED_NO_WARNINGS

#include <winsock2.h>

#include <iostream>
#include <string>
#include <thread>

#pragma comment(lib, "Ws2_32.lib")

const int BUFFER_SIZE = 4096;
bool should_exit = false;  // Флаг для завершения работы

/**
 * @brief Очищает текущую строку в консоли и перерисовывает приглашение к вводу.
 */
void redraw_prompt() {
    std::cout << "\r" << std::string(70, ' ') << "\r";  // Очистка
    std::cout << "Enter message: ";
    std::cout.flush();
}

/**
 * @brief Функция для приема сообщений от сервера. Выполняется в отдельном потоке.
 * @param client_socket Сокет для связи с сервером.
 */
void receive_messages(SOCKET client_socket) {
    char buffer[BUFFER_SIZE];
    int bytesReceived;

    while (!should_exit) {
        bytesReceived = recv(client_socket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            // Перемещаем курсор в начало строки, очищаем ее и выводим сообщение
            std::cout << "\r" << std::string(70, ' ') << "\r";  // Очистка строки ввода
            std::cout << buffer << std::endl;
            std::cout << "Enter message: ";  // Повторный вывод приглашения
            std::cout.flush();               // Сброс буфера вывода
        } else if (bytesReceived == 0) {
            std::cout << "\rConnection closed by server." << std::endl;
            should_exit = true;
            break;
        } else {
            if (WSAGetLastError() != WSAECONNRESET && !should_exit) {
                std::cerr << "\rRecv failed with error: " << WSAGetLastError() << std::endl;
            }
            should_exit = true;
            break;
        }
    }
}

/**
 * @brief Инициализирует Winsock.
 * @return true в случае успеха, false в случае ошибки.
 */
bool initialize_winsock() {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed." << std::endl;
        return false;
    }
    return true;
}

/**
 * @brief Создает сокет и подключается к серверу.
 * @param server_ip IP-адрес сервера.
 * @param port Порт сервера.
 * @return Дескриптор сокета или INVALID_SOCKET в случае ошибки.
 */
SOCKET connect_to_server(const char* server_ip, int port) {
    SOCKET clientSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (clientSocket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed." << std::endl;
        return INVALID_SOCKET;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = inet_addr(server_ip);

    if (connect(clientSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Connection to server failed." << std::endl;
        closesocket(clientSocket);
        return INVALID_SOCKET;
    }

    std::cout << "Successfully connected to server " << server_ip << ":" << port << std::endl;
    return clientSocket;
}

int main(int argc, char* argv[]) {
    if (argc != 3) {
        std::cerr << "Usage: " << argv[0] << " <server_ip> <port>" << std::endl;
        return 1;
    }

    if (!initialize_winsock()) {
        return 1;
    }

    SOCKET clientSocket = connect_to_server(argv[1], atoi(argv[2]));
    if (clientSocket == INVALID_SOCKET) {
        WSACleanup();
        return 1;
    }

    // 1. Цикл запроса и проверки никнейма
    char response_buffer[BUFFER_SIZE];
    while (true) {
        std::string nickname;
        std::cout << "Enter your nickname (or press Enter for default): ";
        std::getline(std::cin, nickname);
        send(clientSocket, nickname.c_str(), nickname.length(), 0);

        int bytes = recv(clientSocket, response_buffer, BUFFER_SIZE, 0);
        if (bytes <= 0) {
            should_exit = true;
            break;
        }
        response_buffer[bytes] = '\0';
        if (strcmp(response_buffer, "#NICK_OK#") == 0) {
            break;  // Ник принят
        } else if (strcmp(response_buffer, "#NICK_TAKEN#") == 0) {
            std::cout << "This nickname is already taken. Please choose another one." << std::endl;
        }
    }

    // 2. Запускаем поток для приема сообщений
    if (!should_exit) {
        std::thread receiver_thread(receive_messages, clientSocket);
        receiver_thread.detach();
    }

    // 3. Основной цикл для отправки сообщений
    std::string message;
    while (!should_exit) {
        redraw_prompt();
        std::getline(std::cin, message);

        if (should_exit) break;

        // ИЗМЕНЕНИЕ: Улучшенный UI
        // Перемещаем курсор на одну строку вверх и очищаем ее
        std::cout << "\033[A" << std::string(70, ' ') << "\r";
        std::cout << "You: " << message << std::endl;

        if (message == "exit") {
            should_exit = true;
            break;
        }

        if (send(clientSocket, message.c_str(), message.length(), 0) == SOCKET_ERROR) {
            std::cerr << "Send failed." << std::endl;
            should_exit = true;
        }
    }

    closesocket(clientSocket);
    WSACleanup();

    std::cout << "Connection closed. Press Enter to exit." << std::endl;
    std::cin.get();

    return 0;
}