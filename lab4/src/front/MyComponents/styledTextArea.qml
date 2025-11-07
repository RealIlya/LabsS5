// StyledTextArea.qml
import QtQuick.Controls
import QtQuick.Layouts

// Это наш "контейнер" с фиксированной высотой, который решает проблему прокрутки.
ScrollView {
    // --- Свойства, которые мы можем задавать извне ---

    // 'property alias' - это "ярлык" к свойству внутреннего элемента.
    // Когда мы в main.qml напишем text: "что-то", это значение передастся
    // напрямую в a_textArea.text
    property alias text: a_textArea.text
    property alias placeholderText: a_textArea.placeholderText
    property alias readOnly: a_textArea.readOnly

    // --- Внешний вид и компоновка ---
    Layout.fillWidth: true
    Layout.preferredHeight: 80 // Высота по умолчанию, можно переопределить
    clip: true

    // --- Внутренние элементы ---
    TextArea {
        id: a_textArea
        Layout.fillWidth: true
        Layout.fillHeight: true
        //anchors.fill: parent // Заполняет все пространство Item
        wrapMode: TextArea.Wrap
    }
}
