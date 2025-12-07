#include "common.h"
#include <algorithm>
#include <atomic>
#include <map>
#include <mutex>
#include <set>
#include <thread>
#include <cctype>

const int BUFFER_SIZE = 4096;

std::map<SOCKET_TYPE, std::string> clients;
std::mutex clients_mutex;
std::atomic<int> user_counter(0);
std::set<int> released_user_numbers;

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
            std::cout << "  - " << inet_ntoa(addr) << std::endl;
        }
    } else {
        std::cerr << "Could not resolve hostname." << std::endl;
    }
}

bool starts_with_user_and_positive_int(const std::string &nickname) {
    const std::string prefix = "User #";
    if (nickname.rfind(prefix, 0) != 0) return false;
    size_t pos = prefix.size();
    if (pos >= nickname.size()) return false;
    for (size_t i = pos; i < nickname.size(); ++i)
        if (!std::isdigit((unsigned char)nickname[i])) return false;
    for (size_t i = pos; i < nickname.size(); ++i)
        if (nickname[i] != '0') return true;
    return false;
}

std::string trim_string(const std::string &str) {
    const std::string WHITESPACE = " \n\r\t";
    size_t first = str.find_first_not_of(WHITESPACE);
    if (std::string::npos == first) return "";
    size_t last = str.find_last_not_of(WHITESPACE);
    return str.substr(first, (last - first + 1));
}

bool is_nickname_taken_unsafe(const std::string &nickname) {
    return std::any_of(clients.begin(), clients.end(),
                       [&nickname](const auto &pair) { return pair.second == nickname; });
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

    while (true) {
        int bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received <= 0) {
            std::cout << "Client " << client_ip_port << " disconnected before setting a nickname." << std::endl;
            CLOSESOCKET(client_socket);
            return;
        }
        buffer[bytes_received] = '\0';
        std::string proposed_nickname = trim_string(std::string(buffer));

        std::lock_guard<std::mutex> lock(clients_mutex);

        if (proposed_nickname.empty()) {
            if (!released_user_numbers.empty()) {
                int reused_number = *released_user_numbers.begin();
                nickname = "User #" + std::to_string(reused_number);
                released_user_numbers.erase(released_user_numbers.begin());
            } else {
                do {
                    nickname = "User #" + std::to_string(++user_counter);
                } while (is_nickname_taken_unsafe(nickname));
            }
            send(client_socket, "#NICK_OK#", 10, 0);
            break;
        }

        if (is_nickname_taken_unsafe(proposed_nickname)) {
            send(client_socket, "#NICK_TAKEN#", 13, 0);
        } else {
            nickname = proposed_nickname;
            send(client_socket, "#NICK_OK#", 10, 0);
            break;
        }
    }

    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients[client_socket] = nickname;
    }

    std::string server_join_msg = "User " + client_ip_port + " [" + nickname + "] has joined the chat.";
    std::cout << server_join_msg << std::endl;
    std::string client_join_msg = nickname + " has joined the chat.";
    broadcast_message(client_join_msg, client_socket);

    int bytes_received;
    while ((bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0)) > 0) {
        buffer[bytes_received] = '\0';
        bool data_truncated = (bytes_received == BUFFER_SIZE - 1);
        std::string trimmed_msg = trim_string(std::string(buffer));
        if (trimmed_msg.empty()) continue;
        std::string received_message = nickname + ": " + trimmed_msg;
        if (data_truncated) {
            received_message += " [message was too long and has been truncated]";
        }
        std::cout << "Broadcasting message from " << client_ip_port << " [" << nickname << "]: " << trimmed_msg << std::endl;
        broadcast_message(received_message, client_socket);
    }

    std::cout << "User " << client_ip_port << " [" << nickname << "] has left the chat." << std::endl;
    std::string disconnect_message = nickname + " has left the chat.";

    {
        std::lock_guard<std::mutex> lock(clients_mutex);
        clients.erase(client_socket);
        if (starts_with_user_and_positive_int(nickname)) {
            try {
                int number = std::stoi(nickname.substr(6));
                released_user_numbers.insert(number);
                std::cout << "System nickname ID " << number << " has been released." << std::endl;
            } catch (...) {}
        }
    }

    broadcast_message(disconnect_message, client_socket);
    CLOSESOCKET(client_socket);
}

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

void cleanup_sockets() {
#ifdef _WIN32
    WSACleanup();
#endif
}

SOCKET_TYPE create_listen_socket(int port) {
    SOCKET_TYPE listen_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (!IS_VALID_SOCKET(listen_socket)) {
        std::cerr << "Socket creation failed." << std::endl;
        return INVALID_SOCKET;
    }

    sockaddr_in server_addr;
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(listen_socket, (sockaddr *)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed." << std::endl;
        CLOSESOCKET(listen_socket);
        return INVALID_SOCKET;
    }

    if (listen(listen_socket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed." << std::endl;
        CLOSESOCKET(listen_socket);
        return INVALID_SOCKET;
    }

    std::cout << "Server started listening on port " << port << "." << std::endl;
    return listen_socket;
}

int main() {
    if (!initialize_sockets()) return 1;

    print_server_info();

    int port;
    std::cout << "Enter server port to listen on: ";
    std::cin >> port;

    SOCKET_TYPE listen_socket = create_listen_socket(port);
    if (!IS_VALID_SOCKET(listen_socket)) {
        cleanup_sockets();
        return 1;
    }

    while (true) {
        sockaddr_in client_addr;
#ifdef _WIN32
        int client_addr_size = sizeof(client_addr);
#else
        socklen_t client_addr_size = sizeof(client_addr);
#endif
        SOCKET_TYPE client_socket = accept(listen_socket, (sockaddr *)&client_addr, &client_addr_size);

        if (!IS_VALID_SOCKET(client_socket)) {
            std::cerr << "Accept failed." << std::endl;
            continue;
        }

        char client_ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, INET_ADDRSTRLEN);
        
        std::cout << "New connection from: " << client_ip << ":" << ntohs(client_addr.sin_port) << std::endl;

        std::string client_info = std::string(client_ip) + ":" + std::to_string(ntohs(client_addr.sin_port));
        
        std::thread client_thread(handle_client, client_socket, client_info);
        client_thread.detach();
    }

    CLOSESOCKET(listen_socket);
    cleanup_sockets();
    return 0;
}