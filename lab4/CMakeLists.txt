# Устанавливаем минимальную требуемую версию CMake. 3.10 - хороший стандарт.
cmake_minimum_required(VERSION 3.10)

# Задаем имя проекта и указываем, что он написан на C++.
project(FrameAnalyzer LANGUAGES CXX)

# Рекомендуется явно указывать стандарт C++, чтобы сборка была предсказуемой.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Создаем исполняемый файл с именем "frame_analyzer" из исходного файла main.cpp.
add_executable(frame_analyzer main.cpp)

# --- Обработка платформо-зависимых библиотек ---
# CMake предоставляет встроенную переменную WIN32, которая истинна, если сборка идет под Windows.
if(WIN32)
    # Если мы на Windows, нам нужно подключить библиотеку Windows Sockets (Winsock).
    # target_link_libraries привязывает указанные библиотеки к нашей цели (frame_analyzer).
    target_link_libraries(frame_analyzer PRIVATE ws2_32)
    message(STATUS "Windows detected. Linking with ws2_32.lib.")
else()
    # На Linux и macOS необходимые сетевые функции являются частью стандартной библиотеки,
    # поэтому явно ничего подключать не нужно.
    message(STATUS "Linux/macOS detected. No extra linking needed.")
endif()

# (Опционально) Удобная настройка, чтобы .exe файл появлялся прямо в папке build,
# а не в build/Debug
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})