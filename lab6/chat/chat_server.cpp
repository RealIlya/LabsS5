#include "common.h"
#include <map>
#include <mutex>
#include <thread>
#include <atomic>
#include <set>

const int BUFFER_SIZE = 4096;

std::map<SOCKET_TYPE, std::string> clients;
std::mutex clients_mutex;
std::atomic<int> user_counter(0);
std::set<int> released_user_numbers;

// Функция для вывода IP-адресов сервера (добавлено по требованию 6-й ЛР)
void print_server_info() {
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
            memcpy(&addr, host->h_addr_list[i], sizeof(struct in_addr));
            std::cout << "--- " << inet_ntoa(addr) << std::endl;
        }
    } else {
        std::cerr << "Could not resolve hostname." << std::endl;
    }
}

// Очистка строки от пробелов по краям
std::string trim_string(const std::string &str) {
    const std::string WHITESPACE = " \n\r\t";
    size_t first = str.find_first_not_of(WHITESPACE);
    if (std::string::npos == first) return "";
    size_t last = str.find_last_not_of(WHITESPACE);
    return str.substr(first, (last - first + 1));
}

bool is_nickname_taken_unsafe(const std::string &nickname) {
    for (const auto& pair : clients) {
        if (pair.second == nickname) return true;
    }
    return false;
}

void broadcast_message(const std::string &message, SOCKET_TYPE sender_socket) {
    std::lock_guard<std::mutex> lock(clients_mutex);
    for (auto const &[socket, nickname] : clients) {
        if (socket != sender_socket) {
            send(socket, message.c_str(), message.length(), 0);
        }
    }
}

void handle_client(SOCKET_TYPE client_socket, std::string client_ip_port) {
    char buffer[BUFFER_SIZE];
    std::string nickname;

    // Цикл получения ника
    while (true) {
        int bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received <= 0) {
            CLOSESOCKET(client_socket);
            return;
        }
        buffer[bytes_received] = '\0';
        std::string proposed = trim_string(std::string(buffer));

        std::lock_guard<std::mutex> lock(clients_mutex);
        
        if (proposed.empty()) {
            if (!released_user_numbers.empty()) {
                int reused = *released_user_numbers.begin();
                nickname = "User #" + std::to_string(reused);
                released_user_numbers.erase(released_user_numbers.begin());
            } else {
                do {
                    nickname = "User #" + std::to_string(++user_counter);
                } while (is_nickname_taken_unsafe(nickname));
            }
            send(client_socket, "#NICK_OK#", 10, 0);
            break;
        }
        
        if (is_nickname_taken_unsafe(proposed)) {
            send(client_socket, "#NICK_TAKEN#", 13, 0);
        } else {
            nickname = proposed;
            send(client_socket, "#NICK_OK#", 10, 0);
            break;
        }
    }

    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients[client_socket] = nickname;
    }

    std::string join_msg = "User " + client_ip_port + " [" + nickname + "] has joined.";
    std::cout << join_msg << std::endl;
    broadcast_message(nickname + " has joined the chat.", client_socket);

    int bytes;
    while ((bytes = recv(client_socket, buffer, BUFFER_SIZE - 1, 0)) > 0) {
        buffer[bytes] = '\0';
        std::string msg = trim_string(std::string(buffer));
        if (msg.empty()) continue;
        
        std::cout << "[" << client_ip_port << " (" << nickname << ")]: " << msg << std::endl;
        broadcast_message(nickname + ": " + msg, client_socket);
    }
    
    std::cout << "User " << client_ip_port << " [" << nickname << "] left." << std::endl;
    
    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients.erase(client_socket);
        if (nickname.rfind("User #", 0) == 0) {
            try {
                int num = std::stoi(nickname.substr(6));
                released_user_numbers.insert(num);
            } catch(...) {}
        }
    }
    
    broadcast_message(nickname + " left the chat.", client_socket);
    CLOSESOCKET(client_socket);
}

int main(int argc, char* argv[]) {
    setup_console();

    if (!initialize_sockets()) return 1;

    print_server_info();

    int port;
    if (argc == 2) {
        port = atoi(argv[1]);
    } else {
        std::cout << "Enter server port (e.g. 2010): ";
        std::cin >> port;
    }

    SOCKET_TYPE listenSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (!IS_VALID_SOCKET(listenSocket)) return 1;

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    // Привязка к INADDR_ANY (любые типы сетей: локальная, глобальная, петля)
    serverAddr.sin_addr.s_addr = INADDR_ANY;

    if (bind(listenSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed." << std::endl;
        return 1;
    }

    // Ограничиваем очередь из клиентов числом 5
    if (listen(listenSocket, 5) == SOCKET_ERROR) return 1;

    std::cout << "Server is listening on port " << port << "..." << std::endl;

    while (true) {
        sockaddr_in clientAddr;
        #ifdef _WIN32
            int clientSize = sizeof(clientAddr);
        #else
            socklen_t clientSize = sizeof(clientAddr);
        #endif

        SOCKET_TYPE clientSocket = accept(listenSocket, (struct sockaddr*)&clientAddr, &clientSize);

        if (IS_VALID_SOCKET(clientSocket)) {
            char clientIP[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIP, INET_ADDRSTRLEN);
            std::string clientInfo = std::string(clientIP) + ":" + std::to_string(ntohs(clientAddr.sin_port));
            
            std::cout << "New connection from: " << clientInfo << std::endl;

            std::thread t(handle_client, clientSocket, clientInfo);
            t.detach();
        }
    }

    CLOSESOCKET(listenSocket);
    cleanup_sockets();
    return 0;
}