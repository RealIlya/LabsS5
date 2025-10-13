#define _WINSOCK_DEPRECATED_NO_WARNINGS

#include <winsock2.h>
#include <ws2tcpip.h>  // Для inet_ntop

#include <algorithm>  // для std::any_of
#include <atomic>
#include <iostream>
#include <map>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#pragma comment(lib, "Ws2_32.lib")

const int BUFFER_SIZE = 4096;

// --- Глобальные переменные для управления клиентами ---
// Карта для хранения сокетов клиентов и их адресов
std::map<SOCKET, std::string> clients;
// Мьютекс для синхронизации доступа к карте клиентов
std::mutex clients_mutex;
// Атомарный счетчик для уникальных User #N
std::atomic<int> user_counter = 0;

// --- Функции ---

/**
 * @brief Проверяет, занят ли уже указанный никнейм.
 * @param nickname Никнейм для проверки.
 * @return true, если ник занят, иначе false.
 */
bool is_nickname_taken(const std::string& nickname) {
    std::lock_guard<std::mutex> lock(clients_mutex);
    // std::any_of проверяет, удовлетворяет ли хотя бы один элемент коллекции условию
    return std::any_of(clients.begin(), clients.end(),
                       [&nickname](const auto& pair) {
                           return pair.second == nickname;
                       });
}

/**
 * @brief Рассылает сообщение всем подключенным клиентам, кроме отправителя.
 * @param message Сообщение для рассылки.
 * @param sender_socket Сокет клиента-отправителя.
 */
void broadcast_message(const std::string& message, SOCKET sender_socket) {
    std::lock_guard<std::mutex> lock(clients_mutex);
    for (auto const& [socket, nickname] : clients) {
        if (socket != sender_socket) {
            send(socket, message.c_str(), message.length(), 0);
        }
    }
}

/**
 * @brief Функция для обработки сообщений от одного клиента. Выполняется в отдельном потоке.
 * @param client_socket Сокет подключенного клиента.
 * @param client_ip_port IP-адрес и порт клиента для логов сервера.
 */
void handle_client(SOCKET client_socket, std::string client_ip_port) {
    char buffer[BUFFER_SIZE];
    std::string nickname;

    // 1. Цикл получения уникального никнейма от клиента
    while (true) {
        int bytesReceived = recv(client_socket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived <= 0) {
            // Клиент отключился, не выбрав ник
            std::cout << "Client " << client_ip_port << " disconnected before setting a nickname." << std::endl;
            closesocket(client_socket);
            return;
        }
        buffer[bytesReceived] = '\0';
        nickname = std::string(buffer);

        if (nickname.empty()) {
            nickname = "User #" + std::to_string(++user_counter);
            // Сгенерированный ник всегда уникален, выходим из цикла
            send(client_socket, "#NICK_OK#", 10, 0);  // Сообщаем клиенту, что все ок
            break;
        }

        if (is_nickname_taken(nickname)) {
            // Отправляем клиенту сигнал, что ник занят
            send(client_socket, "#NICK_TAKEN#", 13, 0);
        } else {
            // Ник уникален, выходим из цикла
            send(client_socket, "#NICK_OK#", 10, 0);
            break;
        }
    }

    // Сохраняем никнейм клиента
    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients[client_socket] = nickname;
    }

    // 2. Оповещение всех о новом пользователе
    std::string server_join_msg = "User " + client_ip_port + " [" + nickname + "] has joined the chat.";
    std::cout << server_join_msg << std::endl;
    std::string client_join_msg = nickname + " has joined the chat.";
    broadcast_message(client_join_msg, client_socket);

    // 3. Цикл приема сообщений от клиента
    int bytesReceived;
    while ((bytesReceived = recv(client_socket, buffer, BUFFER_SIZE, 0)) > 0) {
        buffer[bytesReceived] = '\0';
        std::string received_message = nickname + ": " + std::string(buffer);

        // ИЗМЕНЕНИЕ: Улучшенное логирование для сервера
        std::cout << "Broadcasting message from " << client_ip_port << " [" << nickname << "]: " << std::string(buffer) << std::endl;
        broadcast_message(received_message, client_socket);
    }

    // 4. Обработка отключения клиента
    std::cout << "User " << client_ip_port << " [" << nickname << "] has left the chat." << std::endl;
    std::string disconnect_message = nickname + " has left the chat.";

    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients.erase(client_socket);
    }

    broadcast_message(disconnect_message, client_socket);
    closesocket(client_socket);
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
    std::cout << "Winsock initialized." << std::endl;
    return true;
}

/**
 * @brief Создает и настраивает слушающий сокет.
 * @param port Порт для прослушивания.
 * @return Дескриптор слушающего сокета или INVALID_SOCKET в случае ошибки.
 */
SOCKET create_listen_socket(int port) {
    SOCKET listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSocket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed." << std::endl;
        return INVALID_SOCKET;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(listenSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed." << std::endl;
        closesocket(listenSocket);
        return INVALID_SOCKET;
    }

    if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed." << std::endl;
        closesocket(listenSocket);
        return INVALID_SOCKET;
    }

    std::cout << "Server started on port " << port << ". Listening for connections..." << std::endl;
    return listenSocket;
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
        return 1;
    }
    int port = atoi(argv[1]);

    if (!initialize_winsock()) {
        return 1;
    }

    SOCKET listenSocket = create_listen_socket(port);
    if (listenSocket == INVALID_SOCKET) {
        WSACleanup();
        return 1;
    }

    while (true) {
        sockaddr_in clientAddr;
        int clientAddrSize = sizeof(clientAddr);
        SOCKET clientSocket = accept(listenSocket, (SOCKADDR*)&clientAddr, &clientAddrSize);

        if (clientSocket == INVALID_SOCKET) {
            std::cerr << "Accept failed." << std::endl;
            continue;
        }

        char client_ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &clientAddr.sin_addr, client_ip, INET_ADDRSTRLEN);
        std::string client_ip_port = std::string(client_ip) + ":" + std::to_string(ntohs(clientAddr.sin_port));

        // Передаем в поток сокет и IP:порт для логгирования
        std::thread client_thread(handle_client, clientSocket, client_ip_port);
        client_thread.detach();
    }

    closesocket(listenSocket);
    WSACleanup();
    return 0;
}