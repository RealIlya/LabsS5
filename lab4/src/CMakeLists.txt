# Минимальная требуемая версия CMake
cmake_minimum_required(VERSION 3.16)

# Название проекта
project(IaCT4 VERSION 1.0 LANGUAGES CXX)

# Устанавливаем стандарт C++
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Включаем "магию" Qt для автоматической обработки MOC, UIC, и RCC файлов
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

set(QT_QML_GENERATE_QMLLS_INI ON)

# Говорим CMake добавлять пути к библиотекам, с которыми мы линкуемся, в RPATH.
# Это позволит исполняемому файлу находить .so файлы Qt без LD_LIBRARY_PATH.
set(CMAKE_BUILD_WITH_INSTALL_RPATH TRUE)
set(CMAKE_INSTALL_RPATH_USE_LINK_PATH TRUE)

# Ищем установленный Qt6
# Мы будем использовать модули Core (основа), Gui (для окна) и Quick (для QML)
find_package(Qt6 COMPONENTS Core Gui Quick QuickControls2 QuickDialogs2 REQUIRED)

include_directories("/home/thundergod/cpp_matrix/src/")

# Создаем исполняемый файл (наше приложение)
qt_add_executable(iact4
    main.cpp
    back/EncryptAlgorithms.hpp
    back/EncryptAlgorithms.cpp
    front/resources.qrc
)

# Связываем (линкуем) наше приложение с библиотеками Qt, которые мы нашли
target_link_libraries(iact4 PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::QuickDialogs2
)