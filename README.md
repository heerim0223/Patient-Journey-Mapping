# Patient-Journey-Mapping

<img width="1005" height="697" alt="Image" src="https://github.com/user-attachments/assets/980afaaa-e5e8-460c-9498-8211e7a48f70" />

---

# Functional necessities

### 1. Time-Based Event Sequence
> A chronological list of patient events along the hospitalization timeline:
> ```
> ER (Start)
> ├── Discharge / Death / Transfer (Final)
> ├── ICU
> │    ├── Discharge / Death / Transfer (Final)
> │    └── Ward
> │         ├── Discharge / Death / Transfer (Final)
> │         └── **ICU (Readmission)**
> │              └── Discharge / Death (Final)
> └── Ward
>      ├── Discharge / Death / Transfer (Final)
>      └── ICU (Transfer)
>           ├── Discharge / Death / Transfer (Final)
>           └── Ward (Back to Ward)
>                └── Discharge / Death (Final)
> ```

This sequence represents the progression of a patient through different clinical locations and outcomes during a single hospital stay.

### 2. Sankey / Flow Visualization
> Visualization of patient flow across hospital units and outcomes.
> 
> Flow Scenarios (All Patients)
> 
> ER → ICU → Ward → Discharge
> 
> ER → Ward → Death
> 
> Visualization Details
> 
> Metric: Number of patients
> 
> Chart Type: Sankey diagram
> 
> Libraries:matplotlib (with Sankey module), or plotly (recommended for interactive visualization)
> 
> GUI Integration: Can be embedded into a Tkinter application

These visualizations help illustrate patient movement patterns and outcome distributions across care units.

### 3. Automated Clinical Summary Generation
> Automatically generated summary for each patient:
> ```
> Total Length of Stay: 12.4 days
> ICU Stay: Yes (3.2 days)
> Primary Diagnosis: Sepsis
> Key Laboratory Trends:
> WBC ↑ (Day 1–2)
> CRP ↓ (After Day 4)
> Outcome: Discharged Alive
> ```

This summary provides a concise overview of the patient’s clinical course, key laboratory changes, and final outcome.

[SQL 테이블](https://www.notion.so/SQL-2ebb67426ab180a892fcf3356d6c67ce?source=copy_link)
