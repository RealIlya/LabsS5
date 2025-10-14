#include <atomic>
#include <cstring>  // For strerror on Linux/macOS
#include <iostream>
#include <string>
#include <thread>

#include "common.h"

const int CLEANER_COUNT = 80;
const int BUFFER_SIZE = 4096;
// Атомарный флаг для потокобезопасного завершения
std::atomic<bool> should_exit = false;

#ifdef _WIN32
#include <windows.h>
void enable_virtual_terminal_processing() {
  HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
  if (hOut == INVALID_HANDLE_VALUE) return;
  DWORD dwMode = 0;
  if (!GetConsoleMode(hOut, &dwMode)) return;
  dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
  SetConsoleMode(hOut, dwMode);
}
#endif

/**
 * @brief Очищает текущую строку в консоли и перерисовывает приглашение к вводу.
 */
void redraw_prompt() {
  std::cout << "\r\033[K";
  std::cout << "Enter message: ";
  std::cout.flush();
}

/**
 * @brief Функция для приема сообщений от сервера. Выполняется в отдельном
 * потоке.
 * @param client_socket Сокет для связи с сервером.
 */
void receive_messages(SOCKET client_socket) {
  char buffer[BUFFER_SIZE];
  int bytes_received;

  while (!should_exit) {
    bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
    if (bytes_received > 0) {
      buffer[bytes_received] = '\0';
      // Перемещаем курсор в начало строки, очищаем ее и выводим сообщение
      std::cout << "\r\033[K";
      std::cout << buffer << std::endl;
      redraw_prompt();
    } else {
      // Если recv вернул 0 или ошибку, значит соединение потеряно
      if (!should_exit) {
        std::cout << "\rConnection to server lost. Press Enter to exit." << std::endl;
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

/**
 * @brief Создает сокет и подключается к серверу.
 * @param server_ip IP-адрес сервера.
 * @param port Порт сервера.
 * @return Дескриптор сокета или INVALID_SOCKET в случае ошибки.
 */
SOCKET connect_to_server(const char* server_ip, int port) {
  SOCKET client_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (client_socket == INVALID_SOCKET) {
    std::cerr << "Socket creation failed." << std::endl;
    return INVALID_SOCKET;
  }

  sockaddr_in server_addr;
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(port);
  server_addr.sin_addr.s_addr = inet_addr(server_ip);

  if (connect(client_socket, (sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
    std::cerr << "Connection to server failed." << std::endl;
    closesocket(client_socket);
    return INVALID_SOCKET;
  }

  std::cout << "Successfully connected to server " << server_ip << ":" << port << std::endl;
  return client_socket;
}

int main(int argc, char* argv[]) {
#ifdef _WIN32
  enable_virtual_terminal_processing();  // Включаем поддержку ANSI кодов в
                                         // Windows
#endif

  if (argc != 3) {
    std::cerr << "Usage: " << argv[0] << " <server_ip> <port>" << std::endl;
    return 1;
  }

  if (!initialize_sockets()) {
    return 1;
  }

  SOCKET client_socket = connect_to_server(argv[1], atoi(argv[2]));
  if (client_socket == INVALID_SOCKET) {
    cleanup_sockets();
    return 1;
  }

  // Цикл запроса и проверки никнейма
  char response_buffer[BUFFER_SIZE];
  while (!should_exit) {
    std::string nickname;
    std::cout << "Enter your nickname (or press Enter for default): ";
    std::getline(std::cin, nickname);

    if (nickname == "/exit") {
      should_exit = true;  // Сигнализируем потоку-приемнику, что мы выходим
      break;
    }

    std::string nick_to_send = nickname.empty() ? " " : nickname;

    if (send(client_socket, nick_to_send.c_str(), nick_to_send.length(), 0) == SOCKET_ERROR) {
      std::cerr << "Send failed." << std::endl;
      should_exit = true;  // Ошибка отправки, выходим
      break;
    }

    int bytes = recv(client_socket, response_buffer, BUFFER_SIZE - 1, 0);

    if (bytes <= 0) {
      should_exit = true;  // Сервер закрыл соединение, выходим
      break;
    }
    response_buffer[bytes] = '\0';
    if (strcmp(response_buffer, "#NICK_OK#") == 0) {
      std::cout << "Nickname accepted." << std::endl;
      break;  // Ник принят, выходим из цикла
    } else if (strcmp(response_buffer, "#NICK_TAKEN#") == 0) {
      std::cout << "This nickname is already taken. Please choose another one." << std::endl;
    } else {
      std::cout << "Unknown response from server. Disconnecting." << std::endl;
      should_exit = true;
      break;
    }
  }

  if (should_exit) {
    std::cout << "Could not set nickname or exiting. Connection closed." << std::endl;
    closesocket(client_socket);
    cleanup_sockets();
    return 1;
  }

  // Запускаем поток для приема сообщений
  std::thread receiver_thread(receive_messages, client_socket);

  // Основной цикл для отправки сообщений
  std::string message;
  while (!should_exit) {
    redraw_prompt();
    std::getline(std::cin, message);

    // Если should_exit стал true, пока мы ждали getline, выходим
    if (should_exit) {
      break;
    }

    // Перемещаем курсор на одну строку вверх и очищаем ее
    std::cout << "\033[A\033[K";  // Вверх на строку, очистить ее
    std::cout << "You: " << message << std::endl;

    if (message == "/exit") {
      should_exit = true;  // Сигнализируем потоку-приемнику, что мы выходим
      break;
    }

    if (send(client_socket, message.c_str(), message.length(), 0) == SOCKET_ERROR) {
      std::cerr << "Send failed." << std::endl;
      should_exit = true;
    }
  }

#ifdef _WIN32
  shutdown(client_socket, SD_SEND);
#else
  shutdown(client_socket, SHUT_WR);
#endif

  // Главный поток и receiver_thread должны завершиться вместе, поэтому
  // дожидаемся его
  if (receiver_thread.joinable()) {
    receiver_thread.join();
  }

  closesocket(client_socket);
  cleanup_sockets();

  std::cout << "Connection closed. Press Enter to exit." << std::endl;

  return 0;
}