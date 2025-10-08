.386
.model flat, stdcall
option casemap :none
 
;-10 и -11 - стандартные идентификаторы (хэндлов) для указателей ввода и 
; вывода Windows
STD_INPUT_HANDLE  equ -10
STD_OUTPUT_HANDLE equ -11
 
; объявляем прототипы внешних функций Windows API
; :DWORD означает, что каждый параметр — 32-битное значение
; GetStdHandle - 1 параметр: какой хэндл нужен: ввод или вывод
GetStdHandle proto :DWORD
; WriteConsoleA
;(5 параметров: куда писать, что писать, сколько байт, куда записать 
; количество реально записанных байт, и зарезервированный параметр)
WriteConsoleA proto :DWORD, :DWORD, :DWORD, :DWORD, :DWORD
; ReadConsoleA (5 параметров: откуда читать, куда писать, сколько 
;максимум, куда положить количество реально считанных байт, и ; зарезервированный параметр)
ReadConsoleA proto :DWORD, :DWORD, :DWORD, :DWORD, :DWORD
; (1 параметр: код завершения программы)
ExitProcess proto :DWORD
 
.data
; DD - Define Doubleword (32 бита) - резервирует память для хэндлов
; для хранения указателей на стандартный ввод и вывод
    hStdIn      dd 0
    hStdOut     dd 0
; DB - Define Byte - создает строку байтов, 0 - конец строки
; строки для вывода
    msgPrompt   db "Enter the number in 8 numeral system: ", 0
    msgDecIn    db "Enetered number in decimal: ", 0
    msgOctRes   db "Result number in 8 n.s.: ", 0
    msgDecRes   db "Result number in 8 n.s.: ", 0
; перевод строки в Windows
    newline     db 13, 10, 0
; место для ввода числа пользователем
    inputBuffer db 32 dup(0)
; здесь ReadConsoleA записывает, сколько байт реально ввели
    bytesRead   dd 0
; переменная для числа
    x           dd 0
; переменная для результата вычислений
    result      dd 0
; буфер для строки хранения данных, выделяем 32 байта, заполняем нулями
    buffer      db 32 dup(0)
 
.code
; Процедура преобразования восьмеричной строки в число
atoi_oct proc
; запихиваем значения в регистрах которые на данный момент есть в стек 
    push ebx
    push ecx
    push edx
; esi указывает на текущий символ строки
    push esi
; Обнуляем eax (тут у нас накапливается значение)
    xor eax, eax
; в esi закидываем то, что ввели
    mov esi, offset inputBuffer
    next_char:
; в cl переносим символ, на который указывает esi
        mov cl, byte ptr [esi]
; проверка не достигли ли мы конца строки (нулевой байт)
; je = jump if equal, то есть cl == 0
        cmp cl, 0
        je done_atoi
; проверяем, что символ в диапозоне ‘0’ до ‘7’ (в восьмеричной с.с.)
; jb = jump if below (cl < ‘0’), ja = jump if above (cl > ‘7’)
        cmp cl, '0'
        jb done_atoi
        cmp cl, '7'
        ja done_atoi
; Переводим символ в число,вычитаем из кода ASCII символа,код ASCII ‘0’ 
        sub cl, '0'
; сдвигаем число на 3 бита влево (2^3 = 8, по логике то же самое, если
; бы мы умножили на 8)
        shl eax, 3
; прибавляем значение цифры из cl
        add eax, ecx
; увеличиваем esi на единицу -> переходим на следующий символ
        inc esi
; продолжаем цикл пока не встретиться конец строки
        jmp next_char
; Например, есть строка "127" -> '1': eax = 0*8 + 1 = 1 ->
;'2': eax = 1*8 + 2 = 10 -> '7': eax = 10*8 + 7 = 87
; восстанавливаем значения регистров, сохранённые в начале
    done_atoi:
    pop esi
    pop edx
    pop ecx
    pop ebx
    ret
atoi_oct endp
 
; Процедура преобразования числа в десятичную строку
;itoa - integer to ascii
itoa_dec proc
;pushad сохраняет все общие регистры (eax, ecx, edx, ebx...) в стек
    pushad
; помещаем в edi указатель на текущую позицию в buffer
    mov edi, offset buffer
    mov ebx, 10
; ecx будет считать количество цифр (счётчик цикла)
    xor ecx, ecx
    test eax, eax
; смотрим знак у eax, если > 0, переходим в positive
; jns = jump if not signed
    jns positive
; иначе сюда,”домножаем” на минус, получаем положительное число
    neg eax
; пишем - в начало буффера
    mov byte ptr [edi], '-'
; сдвигаем на следующий символ, чтобы пошли цифры после минуса
    inc edi
; Цикл деления на 10
    positive:
        xor edx, edx
; делим eax на 10 (ebx),в eax хранится частное,в edx остаток (цифра)
        div ebx
; превращаем цифру в код ASCII и получаем символ, 
; берём младший байт (DL), потому что у нас одна цифра
        add dl, '0'
; кладём цифру в стек
        push edx
        inc ecx
; смотрим осталось что-то в eax или 0, если не ноль, то заново всё делаем
        test eax, eax
        jnz positive
; достаём цифры из стека в обратном порядке, 
    pop_digits:
        pop eax
; al - потому al потому что символ — это 1 байт
; и он хранится в младшем байте регистра
        mov [edi]
        inc edi
; пока acx != 0, мы вычитаем из него 1 и продолжаем цикл
        loop pop_digits
;ставим символ конца строки
    mov byte ptr [edi], 0
; восстанавливаем все регистры, которые мы сохранили в начале
    popad
    ret
itoa_dec endp
 
; Процедура преобразования числа в восьмеричную строку
itoa_oct proc
    pushad
    mov edi, offset buffer
    mov ebx, 8
    xor ecx, ecx
    test eax, eax
    jnz convert
;если eax не ноль, то переходим в convert
;иначе просто записываем '0'
    mov word ptr [edi], '0'
    jmp done_itoa_oct
    convert:
        xor edx, edx
        div ebx
        add dl, '0'
        push edx
        inc ecx
        test eax, eax
        jnz convert
    pop_digits_oct:
        pop eax
        mov [edi], al
; смещаем указатель в буфере
        inc edi
        loop pop_digits_oct
    done_itoa_oct:
; ставим символ конца строки
    mov byte ptr [edi], 0
    popad
    ret
itoa_oct endp
 
start:
    ; Получение хэндлов ввода/вывода
    push STD_INPUT_HANDLE
    call GetStdHandle
    mov hStdIn, eax
 
    push STD_OUTPUT_HANDLE
    call GetStdHandle
    mov hStdOut, eax
 
    ; Приглашение к вводу
; в этот параметр мы кладём ноль, потому что Windows его игнорирует
    push 0
; в стек кладётся адрес bytesRead, указатель, куда записать сколько 
; символов вывели
    push offset bytesRead
; возвращает размер переменной (массива) в байтах / длина строки
    push sizeof msgPrompt
; адрес строки
    push offset msgPrompt
; хэндлер консоли вывода
    push hStdOut
    call WriteConsoleA
 
    ; Ввод числа
    push 0
    push offset bytesRead
    push sizeof inputBuffer
    push offset inputBuffer
    push hStdIn
    call ReadConsoleA
 
; В bytesRead хранится количество введённых символов (вместе с 
; Enter).
; Enter = два символа: CR и LF
; в eax кладём количество считанных символов
    mov eax, bytesRead
; убираем последние два (CR+LF)
    sub eax, 2
; ставим конец строки вместо него
    mov inputBuffer[eax], 0
 
; Преобразуем введённую восьмеричную строку в число
; в eax теперь лежит это число
    call atoi_oct
; сохраняем число в переменную x
    mov x, eax
 
; Выводим сообщение "Введенное число в десятичной системе: "
    push 0
    push offset bytesRead
    push sizeof msgDecIn
    push offset msgDecIn
    push hStdOut
    call WriteConsoleA

; Преобразуем число x в строку (десятичный формат).
    mov eax, x
; строка окажется в buffer
    call itoa_dec


; Выводим строку с числом (из buffer) 
    push 0
    push offset bytesRead
    push sizeof buffer
    push offset buffer
    push hStdOut
    call WriteConsoleA
 ; Печатаем перевод строки (новая строка)
    push 0
    push offset bytesRead
    push sizeof newline
    push offset newline
    push hStdOut
    call WriteConsoleA
 
    ; Вычисление полинома: 6*x^2 - 3*x + 15
    mov eax, x
    imul eax, eax        ; eax = x * x = x^2
    mov ebx, 6
    imul ebx             ; eax = eax * ebx = 6 * x^2
    mov ecx, eax
 
    mov eax, x
    mov ebx, -3
    imul ebx             ; eax = x * (-3) = -3*x
    add ecx, eax         ; ecx = (6*x^2) + (-3*x)
 
    add ecx, 15          ; ecx = 6*x^2 - 3*x + 15
    mov result, ecx
 
    ; Вывод результата в восьмеричной системе
    push 0
    push offset bytesRead
    push sizeof msgOctRes
    push offset msgOctRes
    push hStdOut
    call WriteConsoleA
 
    mov eax, result
    call itoa_oct
 
    push 0
    push offset bytesRead
    push sizeof buffer
    push offset buffer
    push hStdOut
    call WriteConsoleA
 
    push 0
    push offset bytesRead
    push sizeof newline
    push offset newline
    push hStdOut
    call WriteConsoleA
 
    ; Вывод результата в десятичной системе
    push 0
    push offset bytesRead
    push sizeof msgDecRes
    push offset msgDecRes
    push hStdOut
    call WriteConsoleA
 
    mov eax, result
    call itoa_dec
 
    push 0
    push offset bytesRead
    push sizeof buffer
    push offset buffer
    push hStdOut
    call WriteConsoleA
 
    push 0
    push offset bytesRead
    push sizeof newline
    push offset newline
    push hStdOut
    call WriteConsoleA
 
    ; Завершение программы
    push 0
    call ExitProcess
end start