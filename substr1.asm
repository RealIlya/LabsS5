.386
.model flat, C

.code

; =============================================================
; ExtractAndToUpper -- cdecl
; Аргументы:
;   [EBP+0]  = сохранённый EBP
;   [EBP+4]  = адрес возврата
;   [EBP+8]  = const char* src - исходная строка
;   [EBP+12] = int pos - позиция
;   [EBP+16] = int len - длина
;   [EBP+20] = char* dst
; Возвращает:
;   EAX = 0 -- успех
;   EAX = -1 -- ошибка (некорректные pos/len)
; =============================================================
ExtractAndToUpper PROC
    push ebp ; сохраняем старое значение EBP (указатель базы стека)
    mov ebp, esp ; EBP теперь указывает на текущую вершину стека

    push esi ; Used for string and memory array copying (откуда копировать)
    push edi ; адрес назначения (куда писать данные)
    push ecx

    ; Загрузка аргументов
    mov esi, [ebp + 8]    ; esi = указатель на исходную строку (src)
    mov eax, [ebp + 12]   ; eax = pos (число начальной позиции)
    mov ecx, [ebp + 16]   ; ecx = len (длина подстроки)

    ; Проверка: pos < 0 или len <= 0
    cmp eax, 0
    jl error              ; pos < 0 -> ошибка
    cmp ecx, 0
    jle error             ; len <= 0 -> ошибка


    add esi, eax          ; esi = &src[pos] — теперь ESI указывает на начало подстроки, отсюда читать символы
    mov edi, [ebp + 20]   ; edi = dst — буфер для результата, куда записывать символы
    ; Destination index register
; =============================================================

    cld      ; задаём обработку слева направо

; цикл обработки символов
convert_loop:
    lodsb                 ; загружает байт из [ESI] в AL, затем ESI++


; =============================================================
    ; --- Латиница: a-z -> A-Z ---
    cmp al, 'a' ; AL < 'a'?
    jb check_cyrillic
    cmp al, 'z' ; AL > 'z'?
    ja check_cyrillic
    sub al, 32 ; иначе: AL = AL - 32 → перевод в верхний регистр
    jmp store_char

check_cyrillic:
    ; Кириллица
    ; ----------------------------------------------------
    ;  В кодировке Windows-1251 строчные кириллические: 0xE0 (а) — 0xFF (я)
    ; ----------------------------------------------------
    cmp al, 0E0h ; AL < 0xE0 ('а')?
    jb store_char
    cmp al, 0FFh ; AL > 0xFF ('я')?
    ja store_char
    sub al, 32   ; иначе: AL = AL - 32 → 'а' (0xE0) -> 'А'
; =============================================================


store_char:
    stosb        ; [EDI] = AL, затем EDI++ 
    loop convert_loop ; ECX--; если ECX != 0 -> повторить цикл

    mov byte ptr [edi], 0 ; завершаем строку

    xor eax, eax          ; EAX = 0 -> успех
    jmp done

error:
    mov eax, -1           ; EAX = -1 -> ошибка

done:
    pop ecx
    pop edi
    pop esi
    pop ebp
    ret
ExtractAndToUpper ENDP

END