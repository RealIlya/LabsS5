# gui.py
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import subprocess
import os

class GilbertMooreGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Кодирование по Гильберту–Муру")
        self.root.geometry("600x500")

        # Пути к файлам
        self.prob_file = tk.StringVar()
        self.input_file = tk.StringVar()
        self.encoded_file = tk.StringVar(value="encoded_output.txt")

        # === Кодирование ===
        tk.Label(root, text="Кодирование", font=("Arial", 12, "bold")).pack(pady=(10, 5))
        
        tk.Button(root, text="Выбрать файл вероятностей", command=self.select_prob).pack()
        tk.Label(root, textvariable=self.prob_file, fg="blue").pack()

        tk.Button(root, text="Выбрать входной файл", command=self.select_input).pack()
        tk.Label(root, textvariable=self.input_file, fg="blue").pack()

        tk.Button(root, text="Запустить кодирование", command=self.run_encoder, bg="lightgreen").pack(pady=5)

        # === Декодирование ===
        tk.Label(root, text="Декодирование", font=("Arial", 12, "bold")).pack(pady=(20, 5))
        
        tk.Button(root, text="Выбрать файл вероятностей", command=self.select_prob_dec).pack()
        tk.Label(root, textvariable=self.prob_file, fg="blue").pack()

        tk.Button(root, text="Выбрать закодированный файл", command=self.select_encoded).pack()
        tk.Label(root, textvariable=self.encoded_file, fg="blue").pack()

        tk.Button(root, text="Запустить декодирование", command=self.run_decoder, bg="lightcoral").pack(pady=5)

        # === Вывод результата ===
        tk.Label(root, text="Результат:", font=("Arial", 10, "bold")).pack(pady=(10, 0))
        self.output = scrolledtext.ScrolledText(root, height=10, state='disabled')
        self.output.pack(padx=10, pady=5, fill=tk.BOTH, expand=True)

    def select_prob(self):
        file = filedialog.askopenfilename(title="Файл вероятностей", filetypes=[("Text files", "*.txt")])
        if file:
            self.prob_file.set(os.path.abspath(file))

    def select_input(self):
        file = filedialog.askopenfilename(title="Входной файл", filetypes=[("Text files", "*.txt")])
        if file:
            self.input_file.set(os.path.abspath(file))

    def select_encoded(self):
        file = filedialog.askopenfilename(title="Закодированный файл", filetypes=[("Text files", "*.txt")])
        if file:
            self.encoded_file.set(os.path.abspath(file))

    def select_prob_dec(self):
        self.select_prob()  # тот же выбор

    def run_encoder(self):
        if not self.prob_file.get() or not self.input_file.get():
            messagebox.showerror("Ошибка", "Выберите оба файла!")
            return
        try:
            result = subprocess.run(
                ["./encoder", self.prob_file.get(), self.input_file.get()],
                capture_output=True, text=True, check=True
            )
            self.show_output(result.stdout + "\n" + result.stderr)
            messagebox.showinfo("Успех", "Кодирование завершено!")
        except subprocess.CalledProcessError as e:
            self.show_output(e.stderr)
            messagebox.showerror("Ошибка", f"Кодирование не удалось:\n{e.stderr}")
        except FileNotFoundError:
            messagebox.showerror("Ошибка", "Файл 'encoder' не найден! Скомпилируйте C++ код.")

    def run_decoder(self):
        if not self.prob_file.get() or not self.encoded_file.get():
            messagebox.showerror("Ошибка", "Выберите оба файла!")
            return
        try:
            result = subprocess.run(
                ["./decoder", self.prob_file.get(), self.encoded_file.get()],
                capture_output=True, text=True, check=True
            )
            self.show_output(result.stdout + "\n" + result.stderr)
            messagebox.showinfo("Успех", "Декодирование завершено!")
        except subprocess.CalledProcessError as e:
            self.show_output(e.stderr)
            messagebox.showerror("Ошибка", f"Декодирование не удалось:\n{e.stderr}")
        except FileNotFoundError:
            messagebox.showerror("Ошибка", "Файл 'decoder' не найден! Скомпилируйте C++ код.")

    def show_output(self, text):
        self.output.config(state='normal')
        self.output.delete(1.0, tk.END)
        self.output.insert(tk.END, text)
        self.output.config(state='disabled')

if __name__ == "__main__":
    root = tk.Tk()
    app = GilbertMooreGUI(root)
    root.mainloop()