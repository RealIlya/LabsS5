#define _WINSOCK_DEPRECATED_NO_WARNINGS

#include <winsock2.h>
#include <ws2tcpip.h>

#include <algorithm>
#include <chrono>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

#pragma comment(lib, "Ws2_32.lib")

// Директива #pragma pack заставляет компилятор располагать поля структуры
// вплотную друг к другу, без выравнивания
#pragma pack(push, 1)

// Структура, описывающая IP-заголовок (первые 20 байт IP-пакета)
// для парсинга ответа от удаленного хоста
struct IpHeader {
  unsigned char iph_ihl : 4;   // Длина заголовка в 32-битных словах (обычно 5)
  unsigned char iph_ver : 4;   // Версия IP (для IPv4 всегда 4)
  unsigned char iph_tos;       // Тип сервиса (редко используется)
  unsigned short iph_len;      // Общая длина пакета в байтах
  unsigned short iph_ident;    // Идентификатор (используется для сборки фрагментов)
  unsigned short iph_flags;    // Флаги и смещение фрагмента
  unsigned char iph_ttl;       // Время жизни (Time To Live)
  unsigned char iph_protocol;  // Протокол транспортного уровня (для ICMP это 1)
  unsigned short iph_chksum;   // Контрольная сумма заголовка
  unsigned int iph_sourceip;   // IP-адрес отправителя
  unsigned int iph_destip;     // IP-адрес получателя
};

// Структура, описывающая заголовок ICMP-сообщения (8 байт)
// для создания нашего эхо-запроса
struct IcmpHeader {
  unsigned char icmp_type;     // Тип сообщения (8 для эхо-запроса, 0 для эхо-ответа)
  unsigned char icmp_code;     // Код сообщения (для эхо-запроса/ответа всегда 0)
  unsigned short icmp_chksum;  // Контрольная сумма всего ICMP-пакета
  unsigned short icmp_id;      // Идентификатор, чтобы отличить ответы для нашей
                               // программы от других
  unsigned short icmp_seq;     // Порядковый номер пакета в сессии
};

#pragma pack(pop)

// Константы для ICMP-протокола
const int ICMP_ECHO_REQUEST = 8;
const int ICMP_ECHO_REPLY = 0;
const int ICMP_PACKET_SIZE = 32;  // Размер поля данных, которое мы будем добавлять к ICMP-пакету

/**
 * @brief Вычисляет 16-битную контрольную сумму для ICMP-пакета по алгоритму RFC
 * 1071. Контрольная сумма - это 16-битное дополнение до единицы от суммы всех
 * 16-битных слов пакета.
 * @param buffer Указатель на буфер с пакетом (заголовок + данные).
 * @param size Размер буфера в байтах.
 * @return 16-битная контрольная сумма в сетевом порядке байт.
 */
unsigned short calculate_checksum(unsigned short *buffer, int size) {
  unsigned long cksum = 0;
  // Суммируем все 16-битные слова
  while (size > 1) {
    cksum += *buffer++;
    size -= sizeof(unsigned short);
  }
  // Если остался один байт, добавляем его
  if (size) {
    cksum += *(unsigned char *)buffer;
  }
  // Складываем старшую и младшую части суммы, пока старшая не обнулится
  cksum = (cksum >> 16) + (cksum & 0xffff);
  cksum += (cksum >> 16);
  // Инвертируем результат (дополнение до единицы)
  return (unsigned short)(~cksum);
}

/**
 * @brief Разбирает полученный от сети IP-пакет, извлекает из него ICMP-ответ и
 * выводит информацию на экран.
 * @param buffer Буфер с полученными данными (содержит полный IP-пакет).
 * @param bytes Количество полученных байт.
 * @param rtt Вычисленное время отклика в миллисекундах.
 * @param from_addr Структура с адресом отправителя.
 * @param expected_id Ожидаемый идентификатор ICMP-пакета, чтобы убедиться, что
 * ответ предназначен именно нам.
 * @return true, если получен корректный эхо-ответ, иначе false.
 */
bool decode_reply(char *buffer, int bytes, double rtt, sockaddr_in *from_addr,
                  unsigned short expected_id) {
  // Преобразуем начало буфера в указатель на структуру IP-заголовка
  IpHeader *ip_header = (IpHeader *)buffer;
  // Вычисляем длину IP-заголовка (значение в поле ihl * 4 байта)
  int ip_header_len = ip_header->iph_ihl * 4;

  // Проверяем, что полученный пакет достаточно большой, чтобы вместить IP и
  // ICMP заголовки
  if (bytes < ip_header_len + sizeof(IcmpHeader)) {
    std::cout << "Received packet is too small." << std::endl;
    return false;
  }

  // ICMP-заголовок начинается сразу после IP-заголовка
  IcmpHeader *icmp_header = (IcmpHeader *)(buffer + ip_header_len);

  // Проверяем, является ли это эхо-ответом (тип 0)
  if (icmp_header->icmp_type == ICMP_ECHO_REPLY) {
    // Проверяем, совпадает ли ID пакета с тем, что мы отправляли
    if (icmp_header->icmp_id == expected_id) {
      char ip_str[INET_ADDRSTRLEN];
      // Преобразуем IP-адрес отправителя из двоичного формата в строку
      inet_ntop(AF_INET, &(from_addr->sin_addr), ip_str, INET_ADDRSTRLEN);

      int data_size = bytes - ip_header_len - sizeof(IcmpHeader);

      std::cout << "Reply from " << ip_str << ": bytes=" << data_size << " time=" << rtt << "ms"
                << " TTL=" << (int)ip_header->iph_ttl << std::endl;
      return true;
    }
  }

  return false;
}

int main(int argc, char *argv[]) {
  if (argc != 2) {
    std::cerr << "Usage: " << argv[0] << " <hostname>" << std::endl;
    return 1;
  }

  WSADATA wsaData;
  if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
    std::cerr << "WSAStartup failed." << std::endl;
    return 1;
  }

  // Разрешение доменного имени в IP-адрес
  hostent *host = gethostbyname(argv[1]);
  if (host == nullptr) {
    std::cerr << "Could not resolve hostname: " << argv[1] << std::endl;
    WSACleanup();
    return 1;
  }

  // Заполняем структуру адреса назначения
  sockaddr_in dest_addr;
  dest_addr.sin_family = AF_INET;
  dest_addr.sin_addr.s_addr = *(u_long *)host->h_addr_list[0];
  dest_addr.sin_port = 0;  // Для ICMP порт не используется

  char dest_ip_str[INET_ADDRSTRLEN];
  inet_ntop(AF_INET, &dest_addr.sin_addr, dest_ip_str, INET_ADDRSTRLEN);

  std::cout << "Pinging " << argv[1] << " [" << dest_ip_str << "] with " << ICMP_PACKET_SIZE
            << " bytes of data:" << std::endl;

  // Создание "сырого" сокета (Raw Socket)
  // AF_INET - семейство адресов IPv4
  // SOCK_RAW - тип сокета, позволяющий работать с IP-пакетами напрямую
  // IPPROTO_ICMP - указываем, что мы будем работать с протоколом ICMP
  SOCKET sock = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
  if (sock == INVALID_SOCKET) {
    std::cerr << "Failed to create raw socket. Error: " << WSAGetLastError()
              << ". Try running as Administrator." << std::endl;
    WSACleanup();
    return 1;
  }

  // Устанавливаем таймаут на получение ответа
  int timeout = 1000;  // мс
  setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (char *)&timeout, sizeof(timeout));

  // Подготовка буфера для отправляемого ICMP-пакета
  char send_buf[sizeof(IcmpHeader) + ICMP_PACKET_SIZE];
  IcmpHeader *icmp_header = (IcmpHeader *)send_buf;

  icmp_header->icmp_type = ICMP_ECHO_REQUEST;                    // Тип - эхо-запрос
  icmp_header->icmp_code = 0;                                    // Код - 0
  icmp_header->icmp_id = (unsigned short)GetCurrentProcessId();  // Используем ID процесса как
                                                                 // уникальный идентификатор

  // Заполняем поле данных произвольными символами
  memset(send_buf + sizeof(IcmpHeader), 'D', ICMP_PACKET_SIZE);

  // Переменные для сбора статистики
  int packets_sent = 0;
  int packets_received = 0;
  std::vector<double> rtt_times;

  // Отправляем 4 пакета и ждем ответы
  for (int i = 0; i < 4; ++i) {
    icmp_header->icmp_seq = i;     // Порядковый номер
    icmp_header->icmp_chksum = 0;  // Обнуляем контрольную сумму перед вычислением новой
    icmp_header->icmp_chksum = calculate_checksum((unsigned short *)send_buf, sizeof(send_buf));

    // Фиксируем время перед отправкой
    auto start_time = std::chrono::high_resolution_clock::now();

    // Отправляем пакет
    if (sendto(sock, send_buf, sizeof(send_buf), 0, (sockaddr *)&dest_addr, sizeof(dest_addr)) ==
        SOCKET_ERROR) {
      std::cerr << "sendto failed with error: " << WSAGetLastError() << std::endl;
      break;
    }
    packets_sent++;

    // Буфер для приема ответа (размер больше, т.к. придет полный IP-пакет)
    char recv_buf[1024];
    sockaddr_in from_addr;
    int from_addr_len = sizeof(from_addr);

    // Блокирующая операция: ждем ответа (не дольше таймаута)
    int bytes_received =
        recvfrom(sock, recv_buf, sizeof(recv_buf), 0, (sockaddr *)&from_addr, &from_addr_len);

    // Фиксируем время после получения ответа
    auto end_time = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> rtt = end_time - start_time;

    if (bytes_received == SOCKET_ERROR) {
      // Если recvfrom вернул ошибку, проверяем, не таймаут ли это
      if (WSAGetLastError() == WSAETIMEDOUT) {
        std::cout << "Request timed out." << std::endl;
      } else {
        std::cerr << "recvfrom failed with error: " << WSAGetLastError() << std::endl;
      }
    } else {
      // Если данные получены, декодируем ответ
      if (decode_reply(recv_buf, bytes_received, rtt.count(), &from_addr, icmp_header->icmp_id)) {
        packets_received++;
        rtt_times.push_back(rtt.count());
      }
    }

    Sleep(1000);
  }

  std::cout << "\nPing statistics for " << dest_ip_str << ":" << std::endl;
  int packets_lost = packets_sent - packets_received;
  double loss_percent = (packets_sent > 0) ? ((double)packets_lost / packets_sent * 100.0) : 0;
  std::cout << "    Packets: Sent = " << packets_sent << ", Received = " << packets_received
            << ", Lost = " << packets_lost << " (" << (int)loss_percent << "% loss)," << std::endl;

  if (!rtt_times.empty()) {
    double min_rtt = *std::min_element(rtt_times.begin(), rtt_times.end());
    double max_rtt = *std::max_element(rtt_times.begin(), rtt_times.end());
    double avg_rtt = std::accumulate(rtt_times.begin(), rtt_times.end(), 0.0) / rtt_times.size();

    std::cout << "Approximate round trip times in milli-seconds:" << std::endl;
    std::cout << "    Minimum = " << (int)min_rtt << "ms"
              << ", Maximum = " << (int)max_rtt << "ms"
              << ", Average = " << (int)avg_rtt << "ms" << std::endl;
  }

  closesocket(sock);
  WSACleanup();

  return 0;
}