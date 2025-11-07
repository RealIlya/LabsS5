// FileInput.qml
import QtQuick.Controls
import QtQuick.Layouts

// Используем GridLayout, чтобы красиво расположить элементы в строку
GridLayout {
    columns: 3
    Layout.fillWidth: true

    // --- Свойства для настройки ---
    property string labelText: "Файл:" // Текст для Label
    property alias filePath: pathField.text
    property alias placeholderText: pathField.placeholderText

    // --- Сигнал ---
    // Компонент будет "сигнализировать" наружу, когда на кнопку нажмут.
    signal buttonClicked

    // --- Внутренние элементы ---
    Label {
        text: labelText
    }

    TextField {
        id: pathField
        Layout.fillWidth: true
    }

    Button {
        text: "Выбрать..."
        onClicked: {
            // Когда на кнопку нажимают, мы испускаем сигнал
            buttonClicked();
        }
    }
}
