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

const int BUFFER_SIZE = 1024;

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

void cleanup_net() {
#ifdef _WIN32
    WSACleanup();
#endif
}

int main() {
    if (!init_net()) return 1;

    std::string serverIp;
    int port;

    std::cout << "Enter server IP (e.g. 127.0.0.1): ";
    std::cin >> serverIp;
    std::cout << "Enter server port: ";
    std::cin >> port;
    std::cin.ignore();

    SOCKET_TYPE clientSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (!IS_VALID_SOCKET(clientSocket)) {
        std::cerr << "Socket creation failed." << std::endl;
        cleanup_net();
        return 1;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(port);
    serverAddr.sin_addr.s_addr = inet_addr(serverIp.c_str());

    if (connect(clientSocket, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Connection failed." << std::endl;
        CLOSESOCKET(clientSocket);
        cleanup_net();
        return 1;
    }
    std::cout << "Connected to " << serverIp << ":" << port << std::endl;

    std::string message;
    std::cout << "Enter text to send: ";
    std::getline(std::cin, message);

    if (send(clientSocket, message.c_str(), message.length(), 0) == SOCKET_ERROR) {
        std::cerr << "Send failed." << std::endl;
    } else {
        std::cout << "Data sent." << std::endl;

        char buffer[BUFFER_SIZE];
        int bytesReceived = recv(clientSocket, buffer, BUFFER_SIZE, 0);
        if (bytesReceived > 0) {
            buffer[bytesReceived] = '\0';
            std::cout << "Server response: " << buffer << std::endl;
        } else {
            std::cerr << "Receive failed or connection closed." << std::endl;
        }
    }

    CLOSESOCKET(clientSocket);
    cleanup_net();
    
    std::cout << "Press Enter to exit...";
    std::cin.get();
    return 0;
}