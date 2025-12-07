#pragma once

#ifdef _WIN32
    #define _WINSOCK_DEPRECATED_NO_WARNINGS
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "Ws2_32.lib")
    
    // Макросы для унификации с Linux
    #define CLOSESOCKET closesocket
    #define SOCKET_TYPE SOCKET
    #define IS_VALID_SOCKET(s) ((s) != INVALID_SOCKET)
    #define GET_SOCKET_ERROR WSAGetLastError()
#else
    #include <sys/types.h>
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    #include <netdb.h> // Нужно для gethostbyname в Linux
    #include <cstring>
    
    // Макросы для унификации с Windows
    #define CLOSESOCKET close
    #define SOCKET_TYPE int
    #define INVALID_SOCKET -1
    #define SOCKET_ERROR -1
    #define IS_VALID_SOCKET(s) ((s) >= 0)
    #define GET_SOCKET_ERROR errno
#endif

#include <iostream>
#include <string>
#include <vector>