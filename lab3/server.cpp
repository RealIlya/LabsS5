#include "common.h"

#ifdef _WIN32
#include <ws2tcpip.h>
#endif

#include <algorithm>
#include <atomic>
#include <cstring>  // Для strerror в Linux/macOS
#include <iostream>
#include <map>
#include <mutex>
#include <set>  // Добавлено для хранения свободных номеров
#include <string>
#include <thread>
#include <vector>

const int BUFFER_SIZE = 4096;

// ------ Глобальные переменные для управления клиентами ------
// Карта для хранения сокетов клиентов и их адресов
std::map<SOCKET, std::string> clients;
// Мьютекс для синхронизации доступа к карте клиентов
std::mutex clients_mutex;
// Атомарный счетчик для уникальных User #N
std::atomic<int> user_counter = 0;
// Новая структура для хранения освободившихся номеров
std::set<int> released_user_numbers;

// ------ Функции ------

#include <cctype>
#include <string>

/**
 * @brief Проверяет, что строка начинается с префикса "User #" и после '#' идёт положительное целое
 * число.
 * @param nickname Никнейм пользователя.
 * @return Если начинается, то true, иначе false.
 */
bool starts_with_user_and_positive_int(const std::string &nickname) {
  const std::string prefix = "User #";
  if (nickname.rfind(prefix, 0) != 0) return false;  // не начинается с "User #"
  size_t pos = prefix.size();
  if (pos >= nickname.size()) return false;  // нет символов после '#'
  // всё оставшееся — цифры и образуют положительное число (без ведущих знаков плюс)
  for (size_t i = pos; i < nickname.size(); ++i)
    if (!std::isdigit((unsigned char)nickname[i])) return false;
  // исключаем "0" и строки, состоящие только из нулей
  for (size_t i = pos; i < nickname.size(); ++i)
    if (nickname[i] != '0') return true;
  return false;
}

/**
 * @brief Обрезает пробельные символы (пробел, \r, \n, \t) с начала и конца
 * строки.
 * @param str Строка для обработки.
 * @return Очищенная строка.
 */
std::string trim_string(const std::string &str) {
  const std::string WHITESPACE = " \n\r\t";
  size_t first = str.find_first_not_of(WHITESPACE);
  if (std::string::npos == first) {
    return "";
  }
  size_t last = str.find_last_not_of(WHITESPACE);
  return str.substr(first, (last - first + 1));
}

/**
 * @brief Проверяет, занят ли уже указанный никнейм.
 * @param nickname Никнейм для проверки.
 * @return true, если ник занят, иначе false.
 */
// Важно: эта функция НЕ должна блокировать мьютекс сама,
// так как она будет вызываться из кода, где мьютекс уже захвачен.
bool is_nickname_taken_unsafe(const std::string &nickname) {
  return std::any_of(clients.begin(), clients.end(),
                     [&nickname](const auto &pair) { return pair.second == nickname; });
}

/**
 * @brief Рассылает сообщение всем подключенным клиентам, кроме отправителя.
 * @param message Сообщение для рассылки.
 * @param sender_socket Сокет клиента-отправителя.
 */
void broadcast_message(const std::string &message, SOCKET sender_socket) {
  std::lock_guard<std::mutex> lock(clients_mutex);
  for (auto const &[socket, nickname] : clients) {
    if (socket != sender_socket) {
      send(socket, message.c_str(), message.length(), 0);
    }
  }
}

/**
 * @brief Функция для обработки сообщений от одного клиента. Выполняется в
 * отдельном потоке.
 * @param client_socket Сокет подключенного клиента.
 * @param client_ip_port IP-адрес и порт клиента для логов сервера.
 */
void handle_client(SOCKET client_socket, std::string client_ip_port) {
  char buffer[BUFFER_SIZE];
  std::string nickname;

  // Цикл получения уникального никнейма от клиента
  while (true) {
    int bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
    if (bytes_received <= 0) {
      // Клиент отключился, не выбрав ник
      std::cout << "Client " << client_ip_port << " disconnected before setting a nickname."
                << std::endl;
      closesocket(client_socket);
      return;
    }
    buffer[bytes_received] = '\0';
    std::string proposed_nickname = trim_string(std::string(buffer));

    // Блокируем мьютекс на все время выбора ника, чтобы избежать "гонок"
    std::lock_guard<std::mutex> lock(clients_mutex);

    if (proposed_nickname.empty()) {
      // Логика генерации имени при пустом вводе
      if (!released_user_numbers.empty()) {
        // Переиспользуем освобожденный номер
        int reused_number = *released_user_numbers.begin();
        nickname = "User #" + std::to_string(reused_number);
        released_user_numbers.erase(released_user_numbers.begin());
      } else {
        // Генерируем новый номер, проверяя на случай ручного ввода
        do {
          nickname = "User #" + std::to_string(++user_counter);
        } while (is_nickname_taken_unsafe(nickname));
      }
      send(client_socket, "#NICK_OK#", 10, 0);
      break;
    }

    // Логика проверки ника, введенного пользователем
    if (is_nickname_taken_unsafe(proposed_nickname)) {
      // Отправляем сигнал, что ник занят - мьютекс будет освобожден
      // и клиент сможет отправить новый вариант
      send(client_socket, "#NICK_TAKEN#", 13, 0);
    } else {
      // Ник уникален
      nickname = proposed_nickname;
      send(client_socket, "#NICK_OK#", 10, 0);
      break;
    }
  }

  // Сохраняем никнейм клиента
  {
    std::lock_guard<std::mutex> lock(clients_mutex);
    clients[client_socket] = nickname;
  }

  // Оповещение всех о новом пользователе
  std::string server_join_msg =
      "User " + client_ip_port + " [" + nickname + "] has joined the chat.";
  std::cout << server_join_msg << std::endl;
  std::string client_join_msg = nickname + " has joined the chat.";
  broadcast_message(client_join_msg, client_socket);

  // Цикл приема сообщений от клиента
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
    std::cout << "Broadcasting message from " << client_ip_port << " [" << nickname
              << "]: " << trimmed_msg << std::endl;
    broadcast_message(received_message, client_socket);
  }

  // Обработка отключения клиента
  std::cout << "User " << client_ip_port << " [" + nickname + "] has left the chat." << std::endl;
  std::string disconnect_message = nickname + " has left the chat.";

  {
    std::lock_guard<std::mutex> lock(clients_mutex);
    clients.erase(client_socket);

    // Если ник был системным, возвращаем его номер в пул
    if (starts_with_user_and_positive_int(nickname)) {
      try {
        int number = std::stoi(nickname.substr(6));
        released_user_numbers.insert(number);
        std::cout << "System nickname ID " << number << " has been released." << std::endl;
      } catch (...) {
        // Игнорируем ошибки парсинга на всякий случай
      }
    }
  }

  broadcast_message(disconnect_message, client_socket);
  closesocket(client_socket);
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
  std::cout << "Sockets initialized." << std::endl;
  return true;
}

void cleanup_sockets() {
#ifdef _WIN32
  WSACleanup();
#endif
}

/**
 * @brief Создает и настраивает слушающий сокет.
 * @param port Порт для прослушивания.
 * @return Дескриптор слушающего сокета или INVALID_SOCKET в случае ошибки.
 */
SOCKET create_listen_socket(int port) {
  SOCKET listen_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (listen_socket == INVALID_SOCKET) {
    std::cerr << "Socket creation failed." << std::endl;
    return INVALID_SOCKET;
  }

  sockaddr_in server_addr;
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(port);
  server_addr.sin_addr.s_addr = INADDR_ANY;

  if (bind(listen_socket, (sockaddr *)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
    std::cerr << "Bind failed." << std::endl;
    closesocket(listen_socket);
    return INVALID_SOCKET;
  }

  if (listen(listen_socket, SOMAXCONN) == SOCKET_ERROR) {
    std::cerr << "Listen failed." << std::endl;
    closesocket(listen_socket);
    return INVALID_SOCKET;
  }

  std::cout << "Server started on port " << port << ". Listening for connections..." << std::endl;
  return listen_socket;
}

int main(int argc, char *argv[]) {
  if (argc != 2) {
    std::cerr << "Usage: " << argv[0] << " <port>" << std::endl;
    return 1;
  }
  int port = atoi(argv[1]);

  if (!initialize_sockets()) {
    return 1;
  }

  SOCKET listen_socket = create_listen_socket(port);
  if (listen_socket == INVALID_SOCKET) {
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
    SOCKET client_socket = accept(listen_socket, (sockaddr *)&client_addr, &client_addr_size);

    if (client_socket == INVALID_SOCKET) {
      std::cerr << "Accept failed." << std::endl;
      continue;
    }

    char client_ip[INET_ADDRSTRLEN];
    // В поле client_addr.sin_addr - сетевой порядок битов (Big-Endian - старший
    // байт находится по младшему адресу) Используем функцию inet_ntop, а не
    // inet_ntoa, так как она позволяет контролировать размер буфера
    inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, INET_ADDRSTRLEN);
    std::string client_ip_port =
        std::string(client_ip) + ":" + std::to_string(ntohs(client_addr.sin_port));

    // Передаем в поток сокет и IP:порт для логгирования
    std::thread client_thread(handle_client, client_socket, client_ip_port);

    // Используем detach для независимой параллельной обработки клиентов
    client_thread.detach();
  }

  closesocket(listen_socket);
  cleanup_sockets();
  return 0;
}