// Импортируем необходимые модули QML
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import QtQuick.Window

import MyComponents 1.0

// Импортируем наш C++ класс
import AdditiveGenerator 1.0

// Создаем главный объект - окно
ApplicationWindow {
    id: root
    width: 800
    height: 300
    maximumHeight: 800
    //minimumWidth: rootLayout.implicitWidth// + 30
    //minimumHeight: rootLayout.implicitHeight
    visible: true
    //Material.theme: Material.Light
    title: "Аддитивный генератор псевдослучайных чисел"
    // Создаем экземпляр нашего C++ объекта.
    Generator {
        id: generator
    }

    // Диалоги для выбора файлов
    FileDialog {
        id: openDialog
        title: "Выберите файл с входными параметрами"
        onAccepted: {
            if (selectedFile) {
                // Преобразуем строку URL в локальный путь
                var pathString = selectedFile.toString();
                if (pathString.startsWith("file://")) {
                    pathString = pathString.substring(7); // Удаляем "file://"
                }
                openDialog.sourceFileInput.filePath = pathString;
                if (fileContentTA) {
                    fileContentTA.text = coder.readFileContent(pathString);
                    fileContentTA = null;
                }
            }
        }
        // Пользовательское свойство, чтобы диалог "знал", какое поле обновлять
        property FileInput sourceFileInput
        property StyledTextArea fileContentTA: null
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
    Item {
        anchors.fill: parent
        FileInput {
            id: generatorInputPath
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.right: parent.horizontalCenter
            anchors.margins: 15
            labelText: "Входной файл:"
            placeholderText: "Выберите файл с входными параметрами..."
            onButtonClicked: {
                openDialog.sourceFileInput = generatorInputPath;
                openDialog.fileContentTA = encryptInputText;
                openDialog.open();
            }
        }
        FileInput {
            id: generatorOutputPath
            anchors.top: parent.top
            anchors.left: parent.horizontalCenter
            anchors.right: parent.right
            anchors.margins: 15
            labelText: "Выходной файл:"
            placeholderText: "Выбрать, куда сохранить выходной файл..."
            onButtonClicked: {
                saveDialog.sourceFileInput = generatorOutputPath;
                saveDialog.open();
            }
        }
        StyledTextArea {
            id: generatorInputText
            anchors.top: generatorInputPath.bottom
            anchors.left: parent.left
            anchors.right: parent.horizontalCenter
            anchors.bottom: generateButton.top
            anchors.margins: 15
            readOnly: false
            placeholderText: "Параметры последовательности..."
        }
        StyledTextArea {
            id: generatorOutputText
            anchors.top: generatorInputPath.bottom
            anchors.left: parent.horizontalCenter
            anchors.right: parent.right
            anchors.bottom: generateButton.top
            anchors.margins: 15
            readOnly: true
            placeholderText: "Сгенерированная последовательность..."
        }
        Button {
            id: generateButton
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.margins: 15
            text: "Сгенерировать последовательность"
            onClicked: {
                generator.generateSequence(generatorInputText.text);
                generatorOutputText.text = generator.generateString();
                generator.saveContent(generatorOutputPath.filePath, generatorOutputText.text);
            }
        }
    }
}
