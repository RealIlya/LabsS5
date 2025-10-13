# Устанавливаем минимальную требуемую версию CMake
cmake_minimum_required(VERSION 3.10)

# Задаем имя проекта
project(ChatApplication LANGUAGES CXX)

# Устанавливаем стандарт C++ (рекомендуется)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- Находим необходимые библиотеки ---

# Для поддержки потоков (std::thread)
find_package(Threads REQUIRED)

# Для Windows Sockets (Winsock)
# CMake сам найдет нужные библиотеки (Ws2_32.lib, Ws2_32.dll)
if(WIN32)
    set(Winsock_LIBRARIES ws2_32)
endif()

# --- Определяем исполняемые файлы (цели) ---

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)


# Создаем исполняемый файл для сервера
add_executable(server server.cpp)

# Создаем исполняемый файл для клиента
add_executable(client client.cpp)

# --- Привязываем библиотеки к целям ---

# Привязываем библиотеки к серверу
target_link_libraries(server PRIVATE 
    ${Winsock_LIBRARIES} 
    Threads::Threads
)

# Привязываем библиотеки к клиенту
target_link_libraries(client PRIVATE 
    ${Winsock_LIBRARIES} 
    Threads::Threads
)

# --- Дополнительные настройки (опционально) ---

# Указываем, чтобы исполняемые файлы создавались в корневой папке проекта, а не в build/Debug
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})

# Выводим сообщение о статусе
message(STATUS "Configuring Chat Application for Windows.")
message(STATUS "Server and Client executables will be created.")
