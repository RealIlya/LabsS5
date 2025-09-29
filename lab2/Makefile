# Компилятор и флаги
CXX = g++
CXXFLAGS = -std=c++17 -O2 -Wall

# Исполняемые файлы
ENCODER = encoder
DECODER = decoder

# Исходники
ENCODER_SRC = encoder.cpp
DECODER_SRC = decoder.cpp

# Все цели по умолчанию
.PHONY: all clean run-p3 run-p4 test-decoder

# Сборка всех программ
all: $(ENCODER) $(DECODER)

# Компиляция encoder
$(ENCODER): $(ENCODER_SRC)
	$(CXX) $(CXXFLAGS) -o $@ $<

# Компиляция decoder
$(DECODER): $(DECODER_SRC)
	$(CXX) $(CXXFLAGS) -o $@ $<

# Очистка
clean:
	rm -f $(ENCODER) $(DECODER) encoded_output.txt decoded_output.txt log_*.txt

# === Пункт 3: Анализ трёх распределений ===
run-p3: all
	@echo "=== Пункт 3: Равномерное распределение ==="
	./$(ENCODER) prob_uniform.txt input_uniform.txt | tee log_uniform.txt
	@echo -e "\n=== Пункт 3: Распределение P1 ==="
	./$(ENCODER) prob_P1.txt input_P1.txt | tee log_P1.txt
	@echo -e "\n=== Пункт 3: Распределение P2 ==="
	./$(ENCODER) prob_P2.txt input_P2.txt | tee log_P2.txt
	@echo -e "\n✅ Результаты сохранены в log_uniform.txt, log_P1.txt, log_P2.txt"

# === Пункт 4: 9 экспериментов ===
run-p4: all
	@echo "=== Пункт 4: Запуск 9 экспериментов ==="
	@rm -f results_p4.txt

	@echo "1. Равномерный вход:" >> results_p4.txt
	./$(ENCODER) prob_uniform.txt input_uniform.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P1.txt input_uniform.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P2.txt input_uniform.txt | grep "Длина закодированной последовательности" >> results_p4.txt

	@echo "2. P1-вход:" >> results_p4.txt
	./$(ENCODER) prob_uniform.txt input_P1.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P1.txt input_P1.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P2.txt input_P1.txt | grep "Длина закодированной последовательности" >> results_p4.txt

	@echo "3. P2-вход:" >> results_p4.txt
	./$(ENCODER) prob_uniform.txt input_P2.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P1.txt input_P2.txt | grep "Длина закодированной последовательности" >> results_p4.txt
	./$(ENCODER) prob_P2.txt input_P2.txt | grep "Длина закодированной последовательности" >> results_p4.txt

	@echo -e "\n✅ Результаты пункта 4 сохранены в results_p4.txt"
	@cat results_p4.txt

# Тест декодера (на примере P1)
test-decoder: all
	@echo "=== Тест декодера (P1) ==="
	./$(ENCODER) prob_P1.txt input_P1.txt > /dev/null
	./$(DECODER) prob_P1.txt encoded_output.txt
	@echo "Проверка: сравнение input_P1.txt и decoded_output.txt"
	@# Убираем лишние пробелы и сравниваем
	@if tr -s ' ' '\n' < input_P1.txt | sort > /tmp/input_sorted.txt && \
	   tr -s ' ' '\n' < decoded_output.txt | sort > /tmp/decoded_sorted.txt && \
	   cmp -s /tmp/input_sorted.txt /tmp/decoded_sorted.txt; then \
		echo "✅ Декодирование прошло успешно: данные совпадают."; \
	else \
		echo "❌ Ошибка: данные не совпадают!"; \
	fi
	@rm -f /tmp/input_sorted.txt /tmp/decoded_sorted.txt