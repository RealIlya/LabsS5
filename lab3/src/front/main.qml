// Импортируем необходимые модули QML
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import QtQuick.Window

import MyComponents 1.0

// Импортируем наш C++ класс
import com.mycompany.coding 1.0

// Создаем главный объект - окно
ApplicationWindow {
    id: root
    //width: 800
    height: 600
    minimumWidth: rootLayout.implicitWidth * 2 + 30
    //minimumHeight: rootLayout.implicitHeight
    visible: true
    //Material.theme: Material.Light
    title: "Кодирование алгоритмом Гильберта-Мура"

    // Создаем экземпляр нашего C++ объекта.
    // Теперь мы можем обращаться к нему по id: coder
    CodingAlgorithms {
        id: coder
    }

    // Диалоги для выбора файлов
    FileDialog {
        id: openDialog
        title: "Выберите файл для кодирования"
        onAccepted: {
            if (selectedFile) {
                // Преобразуем строку URL в локальный путь
                var pathString = selectedFile.toString();
                if (pathString.startsWith("file://")) {
                    pathString = pathString.substring(7); // Удаляем "file://"
                }
                openDialog.sourceFileInput.filePath = pathString;
            }
        }
        // Пользовательское свойство, чтобы диалог "знал", какое поле обновлять
        property FileInput sourceFileInput
    }

    FileDialog {
        id: saveDialog
        title: "Выберите файл для сохранения"
        fileMode: FileDialog.SaveFile // Позволяет вводить новое имя файла
        onAccepted: {
            if (selectedFile) {
                // Преобразуем строку URL в локальный путь
                var pathString = selectedFile.toString();
                if (pathString.startsWith("file://")) {
                    pathString = pathString.substring(7); // Удаляем "file://"
                }
                saveDialog.sourceFileInput.filePath = pathString;
            }
        }
        property FileInput sourceFileInput
    }

    RowLayout {
        anchors.fill: parent
        Layout.topMargin: 15
        ScrollView {
            width: rootLayout.implicitWidth + 20
            Layout.fillHeight: true
            Layout.rightMargin: 10
            Layout.leftMargin: 10
            clip: true
            ColumnLayout {
                id: rootLayout
                GroupBox {
                    title: "Кодирование без проверки"
                    Layout.fillWidth: true
                    GridLayout {
                        columns: 3
                        width: parent.width
                        FileInput {
                            id: encodeInputPath
                            Layout.columnSpan: 3
                            labelText: "Входной файл:"
                            placeholderText: "Выберите файл для кодирования..."
                            onButtonClicked: {
                                openDialog.sourceFileInput = encodeInputPath;
                                openDialog.open();
                            }
                        }
                        FileInput {
                            id: encodeOutputPath
                            Layout.columnSpan: 3
                            labelText: "Выходной файл:"
                            placeholderText: "Выбрать, куда сохранить выходной файл..."
                            onButtonClicked: {
                                saveDialog.sourceFileInput = encodeOutputPath;
                                saveDialog.open();
                            }
                        }
                    }
                }

                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.topMargin: 10
                    Button {
                        text: "Кодировать"
                        onClicked: {
                            var success = coder.encodeGilbertMoore(encodeInputPath.filePath, encodeOutputPath.filePath);
                            statusLabel.text = success ? "Успешно закодировано!" : "Кодирование завершилось с ошибкой. Смотрите консоль вывода для деталей.";
                            statusLabel.color = success ? "green" : "red";
                        }
                    }
                    Button {
                        text: "Декодировать"
                        onClicked: {
                            var success = coder.decodeGilbertMoore(encodeInputPath.filePath, encodeOutputPath.filePath);
                            statusLabel.text = success ? "Успешно декодировано!" : "Декодирование завершилось с ошибкой. Смотрите консоль вывода для деталей.";
                            statusLabel.color = success ? "green" : "red";
                        }
                    }
                }
                GroupBox {
                    title: "Проверка на четность"
                    Layout.fillWidth: true
                    Layout.topMargin: 15 // Небольшой отступ сверху
                    GridLayout {
                        columns: 3
                        width: parent.width

                        FileInput {
                            id: parityInputPath
                            Layout.columnSpan: 3
                            labelText: "Входной файл:"
                            placeholderText: "Выбрать входной файл для чтения..."
                            onButtonClicked: {
                                openDialog.sourceFileInput = parityInputPath;
                                openDialog.open();
                            }
                        }
                        FileInput {
                            id: parityOutputPath
                            Layout.columnSpan: 3
                            labelText: "Выходной файл:"
                            placeholderText: "Выбрать куда сохранить выходной файл..."
                            onButtonClicked: {
                                saveDialog.sourceFileInput = parityOutputPath;
                                saveDialog.open();
                            }
                        }
                        Label {
                            text: "Лог ошибок:"
                            font.bold: true
                            Layout.topMargin: 10
                        }
                        StyledTextArea {
                            id: parityErrorArea
                            Layout.columnSpan: 2
                            readOnly: true
                            placeholderText: "Здесь будут отображаться ошибки декодирования..."
                        }
                    }
                }

                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.topMargin: 10
                    Layout.leftMargin: 10
                    Layout.rightMargin: 10

                    Button {
                        text: "Кодирование с проверкой на четность"
                        onClicked: {
                            var success = coder.encodeParity(parityInputPath.filePath, parityOutputPath.filePath);
                            statusLabel.text = success ? "Кодирование с проверкой на четность прошло успепшно!" : "Кодирование с проверкой на четность завершилось с ошибкой.";
                            statusLabel.color = success ? "green" : "red";
                        }
                    }
                    Button {
                        text: "Декодирование с проверкой на четность"
                        onClicked: {
                            var errorLog = coder.decodeParity(parityInputPath.filePath, parityOutputPath.filePath);
                            parityErrorArea.text = errorLog != "false" ? errorLog : "";
                            statusLabel.text = errorLog != "false" ? "Декодирование с проверкой на четность прошло успешно!" : "Декодирование с проверкой на четность завершилось с ошибкой.";
                            statusLabel.color = errorLog != "false" ? "green" : "red";
                        }
                    }
                }

                GroupBox {
                    title: "Код хэмминга (9, 5)"
                    Layout.fillWidth: true
                    Layout.topMargin: 15 // Небольшой отступ сверху

                    GridLayout {
                        columns: 3
                        width: parent.width

                        FileInput {
                            id: hammingInputPath
                            Layout.columnSpan: 3
                            labelText: "Входной файл:"
                            placeholderText: "Выбрать входной файл для чтения..."
                            onButtonClicked: {
                                openDialog.sourceFileInput = hammingInputPath;
                                openDialog.open();
                            }
                        }
                        FileInput {
                            id: hammingOutputPath
                            Layout.columnSpan: 3
                            labelText: "Выходной файл:"
                            placeholderText: "Выбрать куда сохранить выходной файл..."
                            onButtonClicked: {
                                saveDialog.sourceFileInput = hammingOutputPath;
                                saveDialog.open();
                            }
                        }
                        Label {
                            text: "Лог ошибок:"
                            font.bold: true
                            Layout.topMargin: 10
                        }
                        StyledTextArea {
                            id: hammingErrorArea
                            Layout.columnSpan: 2
                            readOnly: true
                            placeholderText: "Здесь будут отображаться ошибки декодирования..."
                        }
                    }
                }

                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    Layout.topMargin: 10
                    Layout.leftMargin: 10
                    Layout.rightMargin: 10

                    Button {
                        text: "Кодирование с проверкой"
                        onClicked: {
                            var success = coder.encodeHamming(hammingInputPath.filePath, hammingOutputPath.filePath);
                            statusLabel.text = success ? "Кодирование с проверкой прошло успепшно!" : "Кодирование с проверкой завершилось с ошибкой.";
                            statusLabel.color = success ? "green" : "red";
                        }
                    }
                    Button {
                        text: "Декодирование с проверкой"
                        onClicked: {
                            var errorLog = coder.decodeHamming(hammingInputPath.filePath, hammingOutputPath.filePath);
                            hammingErrorArea.text = errorLog != "false" ? errorLog : "";
                            statusLabel.text = errorLog != "false" ? "Декодирование с проверкой прошло успешно!" : "Декодирование с проверкой завершилось с ошибкой.";
                            statusLabel.color = errorLog != "false" ? "green" : "red";
                        }
                    }
                }

                // --- Статус бар ---
                Label {
                    id: statusLabel
                    Layout.fillWidth: true
                    Layout.topMargin: 15
                    Layout.bottomMargin: 15
                    horizontalAlignment: Text.AlignHCenter
                    font.bold: true
                    text: "Готово"
                }
            }
        }
        ColumnLayout {
            id: helplayout
            Layout.leftMargin: 10
            Layout.rightMargin: 10
            width: rootLayout.implicitWidth
            Label {
                text: "Вспомогательные функции"
            }

            GroupBox {
                title: "Закодировать сообщение для кода Хэмминга"
                Layout.topMargin: 15
                Layout.fillWidth: true
                ColumnLayout {
                    Layout.minimumWidth: rwthfhmsg.implicitWidth
                    width: parent.width
                    RowLayout {
                        id: rwthfhmsg
                        Layout.alignment: Qt.AlignHCenter
                        Layout.fillWidth: true
                        Label {
                            text: "Сообщение"
                        }
                        StyledTextArea {
                            id: toHammingFromHumanMsg
                            Layout.preferredHeight: 40
                            placeholderText: "Напишите сообщение для кодирования. Пример: 4 8 15 16 23 4 2"
                        }
                    }
                    FileInput {
                        id: toHammingFromHumanFile
                        Layout.columnSpan: 3
                        labelText: "Выходной файл:"
                        placeholderText: "Выбрать куда сохранить файл с сообщением..."
                        onButtonClicked: {
                            saveDialog.sourceFileInput = toHammingFromHumanFile;
                            saveDialog.open();
                        }
                    }
                    RowLayout {
                        Layout.fillWidth: true
                        ColumnLayout {
                            id: help1butns
                            Layout.fillWidth: true
                            Button {
                                id: help1butns1
                                text: "Результат: "
                                font.bold: true
                                Layout.topMargin: 10
                                onClicked: {
                                    toHammingFromHumanResult.text = coder.humanToHamming(toHammingFromHumanFile.filePath, toHammingFromHumanMsg.text);
                                }
                            }
                            Button {
                                text: "Обратно: "
                                font.bold: true
                                Layout.topMargin: 1
                                Layout.minimumWidth: help1butns1.width
                                onClicked: {
                                    var result = coder.hammingToHuman(toHammingFromHumanFile.filePath);
                                    toHammingFromHumanResult.text = result.file;
                                    toHammingFromHumanMsg.text = result.message;
                                }
                            }
                        }
                        StyledTextArea {
                            id: toHammingFromHumanResult
                            Layout.preferredHeight: help1butns.height
                            readOnly: true
                            placeholderText: "Результат кодирования..."
                        }
                    }
                }
            }
            GroupBox {
                title: "Генерировать помехи в сообщении"
                Layout.fillWidth: true
                Layout.topMargin: 15
                ColumnLayout {
                    width: parent.width
                    FileInput {
                        id: interferenceFile
                        Layout.fillWidth: true
                        labelText: "Входной файл:"
                        placeholderText: "Выбрать входной файл для чтения..."
                        onButtonClicked: {
                            openDialog.sourceFileInput = interferenceFile;
                            openDialog.open();
                        }
                    }
                    Slider {
                        id: interferenceBlock
                        from: 1
                        to: 10
                        stepSize: 1
                        value: 9
                        snapMode: Slider.SnapAlways
                        Layout.fillWidth: true
                        Label {
                            text: "Длина кодового слова: " + interferenceBlock.value
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }
                    Button {
                        Layout.fillWidth: true
                        text: "Сгенерировать помехи"
                        onClicked: {
                            coder.interference(interferenceFile.filePath, interferenceBlock.value);
                        }
                    }
                }
            }
        }
    }
}
