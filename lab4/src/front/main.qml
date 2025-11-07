// Импортируем необходимые модули QML
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import QtQuick.Window

import MyComponents 1.0

// Импортируем наш C++ класс
import CipherDiagram 1.0

// Создаем главный объект - окно
ApplicationWindow {
    id: root
    width: 800
    height: 300
    //minimumWidth: rootLayout.implicitWidth// + 30
    //minimumHeight: rootLayout.implicitHeight
    visible: true
    //Material.theme: Material.Light
    title: "Шифр Плейфера"
    // Создаем экземпляр нашего C++ объекта.
    // Теперь мы можем обращаться к нему по id: coder
    EncryptAlgorithms {
        id: coder
    }

    // Диалоги для выбора файлов
    FileDialog {
        id: openDialog
        title: "Выберите файл для шифрования"
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
    TabBar {
        id: bar
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        TabButton {
            text: "Шифрование"
        }
        TabButton {
            text: "Дешифрование"
        }
    }
    SwipeView {
        id: swipe
        //anchors.fill: parent
        anchors.top: bar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        currentIndex: bar.currentIndex
        Item {
            FileInput {
                id: encryptKey
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                labelText: "Ключ:"
                placeholderText: "Выберите файл с ключом шифра..."
                onButtonClicked: {
                    openDialog.sourceFileInput = encryptKey;
                    openDialog.open();
                }
            }
            Button {
                id: encryptButton
                anchors.top: parent.top
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                text: "Зашифровать собщение"
                onClicked: {
                    encryptOutputText.text = coder.encryptPlayfair(encryptKey.filePath, encryptInputText.text);
                    coder.saveContent(encryptOutputPath.filePath, encryptOutputText.text);
                }
            }
            FileInput {
                id: encryptInputPath
                anchors.top: encryptKey.bottom
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                labelText: "Входной файл:"
                placeholderText: "Выберите файл для шифрования..."
                onButtonClicked: {
                    openDialog.sourceFileInput = encryptInputPath;
                    openDialog.fileContentTA = encryptInputText;
                    openDialog.open();
                }
            }
            FileInput {
                id: encryptOutputPath
                anchors.top: encryptKey.bottom
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                labelText: "Выходной файл:"
                placeholderText: "Выбрать, куда сохранить выходной файл..."
                onButtonClicked: {
                    saveDialog.sourceFileInput = encryptOutputPath;
                    saveDialog.open();
                }
            }
            StyledTextArea {
                id: encryptInputText
                anchors.top: encryptInputPath.bottom
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                readOnly: false
                placeholderText: "Сообщение для шифрования..."
            }
            StyledTextArea {
                id: encryptOutputText
                anchors.top: encryptInputPath.bottom
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                readOnly: true
                placeholderText: "Результат шифрования..."
            }
            Label {
                id: encryptStatusLabel
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.top: encryptOutputText.bottom
                anchors.margins: 15
                horizontalAlignment: Text.AlignHCenter
                font.bold: true
            }
        }
        Item {
            FileInput {
                id: decryptKey
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                labelText: "Ключ:"
                placeholderText: "Выберите файл с ключом шифра..."
                onButtonClicked: {
                    openDialog.sourceFileInput = decryptKey;
                    openDialog.open();
                }
            }
            Button {
                id: decryptButton
                anchors.top: parent.top
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                text: "Расшифровать собщение"
                onClicked: {
                    decryptOutputText.text = coder.decryptPlayfair(decryptKey.filePath, decryptInputText.text);
                    coder.saveContent(decryptOutputPath.filePath, decryptOutputText.text);
                }
            }
            FileInput {
                id: decryptInputPath
                anchors.top: decryptKey.bottom
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                labelText: "Входной файл:"
                placeholderText: "Выберите файл для расшифровки..."
                onButtonClicked: {
                    openDialog.sourceFileInput = decryptInputPath;
                    openDialog.fileContentTA = decryptInputText;
                    openDialog.open();
                }
            }
            FileInput {
                id: decryptOutputPath
                anchors.top: decryptKey.bottom
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                labelText: "Выходной файл:"
                placeholderText: "Выбрать, куда сохранить выходной файл..."
                onButtonClicked: {
                    saveDialog.sourceFileInput = decryptOutputPath;
                    saveDialog.open();
                }
            }
            StyledTextArea {
                id: decryptInputText
                anchors.top: decryptInputPath.bottom
                anchors.left: parent.left
                anchors.right: parent.horizontalCenter
                anchors.margins: 15
                readOnly: false
                placeholderText: "Сообщение для расшифровки..."
            }
            StyledTextArea {
                id: decryptOutputText
                anchors.top: decryptInputPath.bottom
                anchors.left: parent.horizontalCenter
                anchors.right: parent.right
                anchors.margins: 15
                readOnly: true
                placeholderText: "Результат расшифровки..."
            }
            Label {
                id: decryptStatusLabel
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.top: decryptOutputText.bottom
                anchors.margins: 15
                horizontalAlignment: Text.AlignHCenter
                font.bold: true
            }
        }
    }
    PageIndicator {
        id: indicator

        count: swipe.count
        currentIndex: swipe.currentIndex

        anchors.bottom: swipe.bottom
        anchors.horizontalCenter: parent.horizontalCenter
    }
}
