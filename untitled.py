# -*- coding: utf-8 -*-
"""
Created on Fri Jan 16 09:13:45 2026
@author: heerim223
v1.1.1
"""

from tkinter import *
from tkinter import ttk
from tkinter import filedialog
import csv

class PatientJourneyApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Patient Journey Mapping")
        self.root.geometry("950x600")
        self.root.resizable(True, True)

        style = ttk.Style()
        style.configure("Treeview", font=("Arial", 10))
        style.configure("Treeview.Heading", font=("Arial", 11, "bold"))

        # 프레임 생성
        self.create_frame0()
        self.create_frame1()
        self.create_frame2()

    # ================= 상단 프레임 =================
    def create_frame0(self):
        frame0 = Frame(self.root, bg="#4A6FA5", height=40)
        frame0.grid(row=0, column=0, columnspan=2, sticky="we")
        frame0.grid_columnconfigure(0, weight=1)

        Label(frame0, text="Patient Journey Mapping", bg="#4A6FA5", fg="white",
              font=("Arial", 14, "bold"), anchor="w").grid(row=0, column=0, padx=10, sticky="we")

        for i, text in enumerate(["Load CSV", "Export", "Settings"], start=1):
            Button(frame0, text=text, width=10, bg="#4A6FA5", fg="white",
                   command=lambda t=text: self.button_event(t)).grid(row=0, column=i, padx=5)

    # ================= 좌측 프레임 =================
    def create_frame1(self):
        frame1 = Frame(self.root, bg="#D9E3F0")
        frame1.grid(row=1, column=0, sticky="nsew")
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=1)

        # 필터 콤보박스
        self.filter_field = ttk.Combobox(frame1, width=10, values=["id","dx","gender","age"])
        self.filter_field.set("dx")  # 기본값
        self.filter_field.grid(row=0, column=0, padx=(5,0), pady=5, sticky="w")

        # 검색창
        self.entry = Entry(frame1, width=15)
        self.entry.insert(0, "Search...")
        self.entry.bind("<FocusIn>", lambda e: self.entry.delete(0, END) if self.entry.get()=="Search..." else None)
        self.entry.grid(row=0, column=1, padx=5, pady=5, sticky="w")
        self.entry.bind("<Return>", self.apply_filter)

        # 검색 버튼
        Button(frame1, text="Search", width=8, command=self.apply_filter).grid(row=0, column=2, padx=5, pady=5, sticky="w")

        # Treeview + 스크롤바
        self.tree = ttk.Treeview(frame1, columns=("id","dx","gender","age"), show="headings", height=15)
        for col in ("id","dx","gender","age"):
            self.tree.heading(col, text=col.upper())
            self.tree.column(col, width=80, anchor="center")
        self.tree.grid(row=1, column=0, columnspan=3, sticky="nsew", padx=5, pady=5)

        scrollbar = ttk.Scrollbar(frame1, orient="vertical", command=self.tree.yview)
        scrollbar.grid(row=1, column=3, sticky="ns", padx=(0,5))
        self.tree.configure(yscrollcommand=scrollbar.set)

        frame1.grid_rowconfigure(1, weight=1)
        frame1.grid_columnconfigure(0, weight=1)

        # 샘플 데이터 100명
        import random
        diagnoses = ["Sepsis", "Pneumonia", "UTI", "Stroke", "Myocardial Inf.", "COPD", "Diabetes", "Hypertension", "AKI", "Heart Failure"]
        self.all_patients = []
        for i in range(1, 101):
            pid = str(i).zfill(3)
            dx = random.choice(diagnoses)
            gender = random.choice(["M","F"])
            age = random.randint(20,90)
            self.all_patients.append((pid, dx, gender, age))
        self.refresh_treeview(self.all_patients)

        self.tree.bind("<<TreeviewSelect>>", self.on_select)

    # ================= 필터 함수 =================
    def apply_filter(self, event=None):
        field = self.filter_field.get()      # id, dx, gender, age
        value = self.entry.get().strip()

        if not value or value=="Search...":
            filtered = self.all_patients
        else:
            filtered = []
            for p in self.all_patients:
                pid, dx, gender, age = p
                if field=="id" and pid.startswith(value):
                    filtered.append(p)
                elif field=="dx" and dx.lower().startswith(value.lower()):
                    filtered.append(p)
                elif field=="gender" and gender.lower()==value.lower():
                    filtered.append(p)
                elif field=="age":
                    try:
                        if int(value) == age:
                            filtered.append(p)
                    except:
                        pass
        self.refresh_treeview(filtered)

    # ================= Treeview 갱신 함수 =================
    def refresh_treeview(self, data):
        for item in self.tree.get_children():
            self.tree.delete(item)
        for p in data:
            self.tree.insert("", "end", values=p)


    # ================= 우측 프레임 =================
    def create_frame2(self):
        frame2 = Frame(self.root, bg="white", padx=5, pady=5)
        frame2.grid(row=1, column=1, sticky="nsew")
        self.root.grid_columnconfigure(1, weight=2)

        # 환자 정보 표시
        self.info_label = Label(frame2, text="Patient Info: -", bg="white", font=("Arial",12))
        self.info_label.grid(row=0, column=0, columnspan=2, sticky="w", pady=5)

        # Combobox
        self.combobox = ttk.Combobox(frame2, width=10, values=[str(i+1) for i in range(100)])
        self.combobox.grid(row=0, column=1, sticky="e")
        self.combobox.set("Select")

        # 여정 시각화(placeholder)
        self.flow_label = Label(frame2, text="Patient Journey Flow Visualization", bg="#F0F0F0",
                                width=60, height=10, anchor="nw", justify="left")
        self.flow_label.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=10)

        # 상세 메모
        Label(frame2, text="Treatment & Recovery Notes", bg="white").grid(row=2, column=0, columnspan=2, sticky="w")
        self.text_box = Text(frame2, width=60, height=5)
        self.text_box.grid(row=3, column=0, columnspan=2, sticky="nsew", pady=5)

    # ================= 이벤트 =================
    def btn_click(self):
        print("Search:", self.entry.get())

    def on_select(self, event):
        selected = self.tree.focus()
        if not selected:
            return
        pid, dx, gender, age = self.tree.item(selected, "values")
        self.info_label.config(text=f"Patient Info: {pid}, {dx}, {gender}, {age}")
        self.flow_label.config(text=f"Patient Journey for {pid} (placeholder)")

    def button_event(self, btn_name):
        if btn_name == "Load CSV":
            file_path = filedialog.askopenfilename(
                title="Select CSV File",
                filetypes=(("CSV files", "*.csv"), ("All files", "*.*"))
            )
            if file_path:
                self.load_csv(file_path)
        else:
            print(btn_name, "pressed")

    def load_csv(self, file_path):
        loaded_patients = []
        try:
            with open(file_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    pid = row.get('id', '').zfill(3)
                    dx = row.get('dx', '')
                    gender = row.get('gender', '')
                    age = int(row.get('age', 0))
                    loaded_patients.append((pid, dx, gender, age))
            self.all_patients = loaded_patients
            self.refresh_treeview(self.all_patients)
            print(f"{len(loaded_patients)} patients loaded from CSV.")
        except Exception as e:
            print("Failed to load CSV:", e)

if __name__ == "__main__":
    root = Tk()
    app = PatientJourneyApp(root)
    root.mainloop()
