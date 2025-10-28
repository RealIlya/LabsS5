#include <fstream>
#include <iomanip>  // Для форматирования вывода
#include <iostream>
#include <vector>

// Для кроссплатформенной работы с сетевыми функциями
#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "Ws2_32.lib")
#else
#include <arpa/inet.h>  // Для ntohs
#endif

// Выравнивание по 1 байту критически важно, чтобы компилятор не добавил "пустышки" между полями.
#pragma pack(push, 1)

// Структура, описывающая заголовок Ethernet (первые 14 байт кадра)
struct EthernetHeader {
    unsigned char dest_mac[6];
    unsigned char source_mac[6];
    unsigned short type_len;
};

// Структура, описывающая IP-заголовок (минимальный размер 20 байт)
// Нам нужны только адреса, поэтому опишем поля до них.
struct IpHeader {
    unsigned char ihl_version;      // Длина заголовка и версия
    unsigned char tos;              // Тип сервиса
    unsigned short total_len;       // Общая длина пакета
    unsigned short identification;  // Идентификатор
    unsigned short flags_offset;    // Флаги и смещение
    unsigned char ttl;              // Время жизни
    unsigned char protocol;         // Протокол
    unsigned short checksum;        // Контрольная сумма заголовка
    unsigned char source_ip[4];     // IP-адрес отправителя
    unsigned char dest_ip[4];       // IP-адрес получателя
};

#pragma pack(pop)

/**
 * @brief Выводит MAC-адрес в стандартном формате.
 * @param mac Указатель на 6-байтовый массив MAC-адреса.
 */
void print_mac_address(const unsigned char* mac) {
    for (int i = 0; i < 6; ++i) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') << (int)mac[i];
        if (i < 5) std::cout << ":";
    }
    std::cout << std::dec;  // Возвращаем в десятичный режим
}

/**
 * @brief Выводит IP-адрес в стандартном формате.
 * @param ip Указатель на 4-байтовый массив IP-адреса.
 */
void print_ip_address(const unsigned char* ip) {
    for (int i = 0; i < 4; ++i) {
        std::cout << (int)ip[i];
        if (i < 3) std::cout << ".";
    }
}

int main() {
    std::string filename;
    std::cout << "Enter the name of the .bin file to analyze: ";
    std::cin >> filename;

    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        std::cerr << "Error: Could not open file " << filename << std::endl;
        return 1;
    }

    // --- Статистика ---
    int frame_counter = 0;
    int ip_frames = 0;
    int arp_frames = 0;
    int novell_raw_frames = 0;
    int llc_frames = 0;
    int snap_frames = 0;

    while (!file.eof()) {
        EthernetHeader eth_header;

        // Читаем заголовок Ethernet (14 байт)
        file.read((char*)&eth_header, sizeof(EthernetHeader));
        if (file.gcount() < sizeof(EthernetHeader)) {
            // Если прочитали меньше 14 байт, значит, достигли конца файла
            // или в файле "мусор" в конце.
            break;
        }

        frame_counter++;
        std::cout << "----------------------------------------\n";
        std::cout << "Frame #" << frame_counter << std::endl;

        // Преобразуем поле Type/Length из сетевого порядка байт (Big-Endian) в хостовый
        unsigned short type_len = ntohs(eth_header.type_len);

        std::cout << "  Source MAC:      ";
        print_mac_address(eth_header.source_mac);
        std::cout << std::endl;
        std::cout << "  Destination MAC: ";
        print_mac_address(eth_header.dest_mac);
        std::cout << std::endl;

        long frame_data_len = 0;

        // ------ Логика определения типа кадра ------

        if (type_len > 1500) {  // Это кадр Ethernet II (DIX)
            std::cout << "  Frame Type:      Ethernet II (DIX)" << std::endl;
            if (type_len == 0x0800) {  // IP-пакет
                ip_frames++;
                std::cout << "  Upper Protocol:  IP (0x0800)" << std::endl;

                // Читаем IP заголовок
                IpHeader ip_header;
                file.read((char*)&ip_header, sizeof(IpHeader));
                frame_data_len = file.gcount();

                std::cout << "  Source IP:       ";
                print_ip_address(ip_header.source_ip);
                std::cout << std::endl;
                std::cout << "  Destination IP:  ";
                print_ip_address(ip_header.dest_ip);
                std::cout << std::endl;

                // Пропускаем оставшуюся часть IP-пакета, чтобы перейти к следующему кадру
                // Общая длина IP-пакета хранится в ip_header.total_len
                long remaining_bytes = ntohs(ip_header.total_len) - sizeof(IpHeader);
                if (remaining_bytes > 0) {
                    file.seekg(remaining_bytes, std::ios::cur);
                    frame_data_len += remaining_bytes;
                }

            } else if (type_len == 0x0806) {  // ARP-пакет
                arp_frames++;
                std::cout << "  Upper Protocol:  ARP (0x0806)" << std::endl;
                // Размер ARP-пакета стандартный - 28 байт
                file.seekg(28, std::ios::cur);
                frame_data_len = 28;
            } else {
                std::cout << "  Upper Protocol:  Unknown (0x" << std::hex << type_len << std::dec << ")" << std::endl;
                // Неизвестный тип Ethernet II. Пропускаем остаток кадра.
                // В реальном анализаторе нужно было бы смотреть на размер пакета,
                // но здесь для простоты считаем его минимальным.
                // Длина поля данных должна быть минимум 46 байт.
                file.seekg(46, std::ios::cur);
                frame_data_len = 46;
            }

        } else {  // Это кадр IEEE 802.3
            std::cout << "  Frame Length:    " << type_len << " bytes" << std::endl;

            // Читаем первые два байта поля данных, чтобы определить подтип
            unsigned short data_header;
            file.read((char*)&data_header, sizeof(data_header));

            if (data_header == 0xFFFF) {
                novell_raw_frames++;
                std::cout << "  Frame Type:      IEEE 802.3 Novell RAW" << std::endl;
            } else if (data_header == 0xAAAA) {
                snap_frames++;
                std::cout << "  Frame Type:      IEEE 802.3 SNAP" << std::endl;
            } else {
                llc_frames++;
                std::cout << "  Frame Type:      IEEE 802.3 LLC" << std::endl;
            }

            // Пропускаем оставшуюся часть поля данных
            // Мы уже прочитали 2 байта из type_len, так что пропускаем остаток
            if (type_len > 2) {
                file.seekg(type_len - 2, std::ios::cur);
            }
            frame_data_len = type_len;
        }

        std::cout << "  Frame Size:      " << sizeof(EthernetHeader) + frame_data_len << " bytes" << std::endl;
    }

    // --- Вывод итоговой статистики ---
    std::cout << "\n========================================\n";
    std::cout << "           Analysis Summary\n";
    std::cout << "========================================\n";
    std::cout << "Total frames processed: " << frame_counter << std::endl;
    std::cout << "\n--- Ethernet II (DIX) Frames ---\n";
    std::cout << "  IP Frames:            " << ip_frames << std::endl;
    std::cout << "  ARP Frames:           " << arp_frames << std::endl;
    std::cout << "\n--- IEEE 802.3 Frames ---\n";
    std::cout << "  LLC Frames:           " << llc_frames << std::endl;
    std::cout << "  Novell RAW Frames:    " << novell_raw_frames << std::endl;
    std::cout << "  SNAP Frames:          " << snap_frames << std::endl;
    std::cout << "========================================\n";

    file.close();

    return 0;
}