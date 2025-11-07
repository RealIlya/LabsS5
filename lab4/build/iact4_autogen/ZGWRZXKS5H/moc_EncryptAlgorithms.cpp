/****************************************************************************
** Meta object code from reading C++ file 'EncryptAlgorithms.hpp'
**
** Created by: The Qt Meta Object Compiler version 68 (Qt 6.4.2)
**
** WARNING! All changes made in this file will be lost!
*****************************************************************************/

#include <memory>
#include "../../../src/back/EncryptAlgorithms.hpp"
#include <QtCore/qmetatype.h>
#if !defined(Q_MOC_OUTPUT_REVISION)
#error "The header file 'EncryptAlgorithms.hpp' doesn't include <QObject>."
#elif Q_MOC_OUTPUT_REVISION != 68
#error "This file was generated using the moc from 6.4.2. It"
#error "cannot be used with the include files from this version of Qt."
#error "(The moc has changed too much.)"
#endif

#ifndef Q_CONSTINIT
#define Q_CONSTINIT
#endif

QT_BEGIN_MOC_NAMESPACE
QT_WARNING_PUSH
QT_WARNING_DISABLE_DEPRECATED
namespace {
struct qt_meta_stringdata_EncryptAlgorithms_t {
    uint offsetsAndSizes[20];
    char stringdata0[18];
    char stringdata1[16];
    char stringdata2[1];
    char stringdata3[9];
    char stringdata4[12];
    char stringdata5[5];
    char stringdata6[16];
    char stringdata7[8];
    char stringdata8[6];
    char stringdata9[16];
};
#define QT_MOC_LITERAL(ofs, len) \
    uint(sizeof(qt_meta_stringdata_EncryptAlgorithms_t::offsetsAndSizes) + ofs), len 
Q_CONSTINIT static const qt_meta_stringdata_EncryptAlgorithms_t qt_meta_stringdata_EncryptAlgorithms = {
    {
        QT_MOC_LITERAL(0, 17),  // "EncryptAlgorithms"
        QT_MOC_LITERAL(18, 15),  // "readFileContent"
        QT_MOC_LITERAL(34, 0),  // ""
        QT_MOC_LITERAL(35, 8),  // "filePath"
        QT_MOC_LITERAL(44, 11),  // "saveContent"
        QT_MOC_LITERAL(56, 4),  // "text"
        QT_MOC_LITERAL(61, 15),  // "encryptPlayfair"
        QT_MOC_LITERAL(77, 7),  // "keyPath"
        QT_MOC_LITERAL(85, 5),  // "input"
        QT_MOC_LITERAL(91, 15)   // "decryptPlayfair"
    },
    "EncryptAlgorithms",
    "readFileContent",
    "",
    "filePath",
    "saveContent",
    "text",
    "encryptPlayfair",
    "keyPath",
    "input",
    "decryptPlayfair"
};
#undef QT_MOC_LITERAL
} // unnamed namespace

Q_CONSTINIT static const uint qt_meta_data_EncryptAlgorithms[] = {

 // content:
      10,       // revision
       0,       // classname
       0,    0, // classinfo
       4,   14, // methods
       0,    0, // properties
       0,    0, // enums/sets
       0,    0, // constructors
       0,       // flags
       0,       // signalCount

 // methods: name, argc, parameters, tag, flags, initial metatype offsets
       1,    1,   38,    2, 0x102,    1 /* Public | MethodIsConst  */,
       4,    2,   41,    2, 0x102,    3 /* Public | MethodIsConst  */,
       6,    2,   46,    2, 0x02,    6 /* Public */,
       9,    2,   51,    2, 0x02,    9 /* Public */,

 // methods: parameters
    QMetaType::QString, QMetaType::QString,    3,
    QMetaType::Bool, QMetaType::QString, QMetaType::QString,    3,    5,
    QMetaType::QString, QMetaType::QString, QMetaType::QString,    7,    8,
    QMetaType::QString, QMetaType::QString, QMetaType::QString,    7,    8,

       0        // eod
};

Q_CONSTINIT const QMetaObject EncryptAlgorithms::staticMetaObject = { {
    QMetaObject::SuperData::link<QObject::staticMetaObject>(),
    qt_meta_stringdata_EncryptAlgorithms.offsetsAndSizes,
    qt_meta_data_EncryptAlgorithms,
    qt_static_metacall,
    nullptr,
    qt_incomplete_metaTypeArray<qt_meta_stringdata_EncryptAlgorithms_t,
        // Q_OBJECT / Q_GADGET
        QtPrivate::TypeAndForceComplete<EncryptAlgorithms, std::true_type>,
        // method 'readFileContent'
        QtPrivate::TypeAndForceComplete<QString, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        // method 'saveContent'
        QtPrivate::TypeAndForceComplete<bool, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        // method 'encryptPlayfair'
        QtPrivate::TypeAndForceComplete<QString, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        // method 'decryptPlayfair'
        QtPrivate::TypeAndForceComplete<QString, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>,
        QtPrivate::TypeAndForceComplete<const QString &, std::false_type>
    >,
    nullptr
} };

void EncryptAlgorithms::qt_static_metacall(QObject *_o, QMetaObject::Call _c, int _id, void **_a)
{
    if (_c == QMetaObject::InvokeMetaMethod) {
        auto *_t = static_cast<EncryptAlgorithms *>(_o);
        (void)_t;
        switch (_id) {
        case 0: { QString _r = _t->readFileContent((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1])));
            if (_a[0]) *reinterpret_cast< QString*>(_a[0]) = std::move(_r); }  break;
        case 1: { bool _r = _t->saveContent((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1])),(*reinterpret_cast< std::add_pointer_t<QString>>(_a[2])));
            if (_a[0]) *reinterpret_cast< bool*>(_a[0]) = std::move(_r); }  break;
        case 2: { QString _r = _t->encryptPlayfair((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1])),(*reinterpret_cast< std::add_pointer_t<QString>>(_a[2])));
            if (_a[0]) *reinterpret_cast< QString*>(_a[0]) = std::move(_r); }  break;
        case 3: { QString _r = _t->decryptPlayfair((*reinterpret_cast< std::add_pointer_t<QString>>(_a[1])),(*reinterpret_cast< std::add_pointer_t<QString>>(_a[2])));
            if (_a[0]) *reinterpret_cast< QString*>(_a[0]) = std::move(_r); }  break;
        default: ;
        }
    }
}

const QMetaObject *EncryptAlgorithms::metaObject() const
{
    return QObject::d_ptr->metaObject ? QObject::d_ptr->dynamicMetaObject() : &staticMetaObject;
}

void *EncryptAlgorithms::qt_metacast(const char *_clname)
{
    if (!_clname) return nullptr;
    if (!strcmp(_clname, qt_meta_stringdata_EncryptAlgorithms.stringdata0))
        return static_cast<void*>(this);
    return QObject::qt_metacast(_clname);
}

int EncryptAlgorithms::qt_metacall(QMetaObject::Call _c, int _id, void **_a)
{
    _id = QObject::qt_metacall(_c, _id, _a);
    if (_id < 0)
        return _id;
    if (_c == QMetaObject::InvokeMetaMethod) {
        if (_id < 4)
            qt_static_metacall(this, _c, _id, _a);
        _id -= 4;
    } else if (_c == QMetaObject::RegisterMethodArgumentMetaType) {
        if (_id < 4)
            *reinterpret_cast<QMetaType *>(_a[0]) = QMetaType();
        _id -= 4;
    }
    return _id;
}
QT_WARNING_POP
QT_END_MOC_NAMESPACE
