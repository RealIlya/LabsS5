#include "common.h"
#include <atomic>
#include <thread>

const int BUFFER_SIZE = 4096;
std::atomic<bool> should_exit(false);

void redraw_prompt() {
    std::cout << "\r\033[K"; 
    std::cout << "Enter message: ";
    std::cout.flush();
}

void receive_messages(SOCKET_TYPE client_socket) {
    char buffer[BUFFER_SIZE];
    int bytes_received;

    while (!should_exit) {
        bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received > 0) {
            buffer[bytes_received] = '\0';
            std::cout << "\r\033[K";
            std::cout << buffer << std::endl;
            redraw_prompt();
        } else {
            if (!should_exit) {
                std::cout << "\rConnection to server lost. Press Enter to exit." << std::endl;
            }
            should_exit = true;
            break;
        }
    }
}

SOCKET_TYPE connect_to_server(const char* server_ip, int port) {
    SOCKET_TYPE client_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP); // 0 = TCP
    if (!IS_VALID_SOCKET(client_socket)) {
        std::cerr << "Socket creation failed." << std::endl;
        return INVALID_SOCKET;
    }

    sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    server_addr.sin_addr.s_addr = inet_addr(server_ip);

    if (connect(client_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        std::cerr << "Connection to server failed." << std::endl;
        CLOSESOCKET(client_socket);
        return INVALID_SOCKET;
    }

    std::cout << "Successfully connected to server " << server_ip << ":" << port << std::endl;
    return client_socket;
}

int main() {
    setup_console(); 

    if (!initialize_sockets()) return 1;

    std::string server_ip;
    int port;
    std::cout << "Enter server IP: ";
    std::cin >> server_ip;
    std::cout << "Enter server port: ";
    std::cin >> port;
    std::cin.ignore(); 

    SOCKET_TYPE client_socket = connect_to_server(server_ip.c_str(), port);
    if (!IS_VALID_SOCKET(client_socket)) {
        cleanup_sockets();
        return 1;
    }

    char response_buffer[BUFFER_SIZE];
    
    // --- Ввод никнейма ---
    while (!should_exit) {
        std::string nickname_raw;
        std::cout << "Enter your nickname (or press Enter for default): ";
        std::getline(std::cin, nickname_raw);

        // Конвертируем ввод в UTF-8 перед отправкой
        std::string nickname_utf8 = to_utf8(nickname_raw);

        if (nickname_utf8 == "/exit") {
            should_exit = true;
            break;
        }

        std::string nick_to_send = nickname_utf8.empty() ? " " : nickname_utf8;

        if (send(client_socket, nick_to_send.c_str(), nick_to_send.length(), 0) == SOCKET_ERROR) {
            std::cerr << "Send failed." << std::endl;
            should_exit = true;
            break;
        }

        int bytes = recv(client_socket, response_buffer, BUFFER_SIZE - 1, 0);
        if (bytes <= 0) {
            should_exit = true;
            break;
        }
        response_buffer[bytes] = '\0';
        
        if (strcmp(response_buffer, "#NICK_OK#") == 0) {
            std::cout << "Nickname accepted." << std::endl;
            break;
        } else if (strcmp(response_buffer, "#NICK_TAKEN#") == 0) {
            std::cout << "This nickname is already taken." << std::endl;
        } else {
            std::cout << "Unknown response." << std::endl;
            should_exit = true;
            break;
        }
    }

    if (should_exit) {
        CLOSESOCKET(client_socket);
        cleanup_sockets();
        return 0;
    }

    std::thread receiver_thread(receive_messages, client_socket);

    // --- Основной цикл отправки ---
    std::string message_raw;
    while (!should_exit) {
        redraw_prompt();
        std::getline(std::cin, message_raw);

        if (should_exit) break;

        std::cout << "\033[A\033[K"; 
        
        // Конвертируем в UTF-8
        std::string message_utf8 = to_utf8(message_raw);

        std::cout << "You: " << message_utf8 << std::endl;

        if (message_utf8 == "/exit") {
            should_exit = true;
            break;
        }

        if (send(client_socket, message_utf8.c_str(), message_utf8.length(), 0) == SOCKET_ERROR) {
            std::cerr << "Send failed." << std::endl;
            should_exit = true;
        }
    }

#ifdef _WIN32
    shutdown(client_socket, SD_SEND);
#else
    shutdown(client_socket, SHUT_WR);
#endif

    if (receiver_thread.joinable()) {
        receiver_thread.join();
    }

    CLOSESOCKET(client_socket);
    cleanup_sockets();
    return 0;
}