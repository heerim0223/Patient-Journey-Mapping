
// 더미 데이터 생성 (ID, DX, SEX, Age 포함)
const diagnoses = ["Sepsis", "Pneumonia", "UTI", "Stroke", "Diabetes", "Myocardial I", "Heart Failure"];
const allPatients = Array.from({length: 25}, (_, i) => ({
    pid: '109' + String(i + 20115).padStart(5, '0'),
    dx: diagnoses[Math.floor(Math.random() * diagnoses.length)],
    sex: Math.random() < 0.5 ? "M" : "F",
    age: Math.floor(Math.random() * 60) + 20
}));

function toggleList() {
    document.getElementById('listOverlay').classList.toggle('active');
}

function refreshTable(data) {
    const tbody = document.querySelector("#patientTable tbody");
    tbody.innerHTML = "";
    data.forEach(p => {
        const tr = document.createElement("tr");
        // 4개의 컬럼(ID, DX, SEX, AGE) 모두 추가
        tr.innerHTML = `
            <td>${p.pid}</td>
            <td>${p.dx}</td>
            <td>${p.sex}</td>
            <td>${p.age}</td>
        `;
        tr.onclick = () => {
            document.getElementById('currentSummary').innerHTML = `
                <p><strong>ID:</strong> ${p.pid}</p>
                <p><strong>DX:</strong> ${p.dx}</p>
                <p><strong>SEX:</strong> ${p.sex}</p>
                <p><strong>AGE:</strong> ${p.age}</p>
            `;
            document.getElementById('detailTitle').innerText = `Timeline: Patient ${p.pid}`;
            toggleList();
        };
        tbody.appendChild(tr);
    });
}

function applyFilter() {
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allPatients.filter(p => {
        const targetValue = (field === 'id' ? p.pid : p[field]);
        return String(targetValue).toLowerCase().includes(value);
    });
    refreshTable(filtered);
}

// 초기 테이블 로드
refreshTable(allPatients);