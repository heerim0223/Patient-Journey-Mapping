# Patient-Journey-Mapping

필요한 것:
```
1. 시간축 기반 이벤트 리스트
    ADMISSION → TRANSFER → ICU → WARD → DISCHARGE/DEATH

2. Sankey / flow 시각화
    전체 환자 기준
    ER → ICU → Ward → Discharge
    ER → Ward → Death
    환자 수 기준 Sankey
    matplotlib + sankey 또는 plotly (Tkinter에 embed)

3. summary 자동 생성
    총 입원 기간: 12.4 days
    ICU 체류: Yes (3.2 days)
    주요 진단: Sepsis
    주요 검사 변화:
    WBC ↑ (Day 1–2)
    CRP ↓ (Day 4 이후)
    Outcome: Discharged Alive
```

[SQL 테이블](https://www.notion.so/SQL-2ebb67426ab180a892fcf3356d6c67ce?source=copy_link)
