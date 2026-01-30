// 1. 전역 변수 설정
let allPatients = [];
let tooltipData = {};
let myChart = null; // 차트 인스턴스를 저장할 전역 변수

// 2. 페이지 로드 시 실행
window.onload = function() {
    console.log("페이지 로드 시도 중...");

    if (typeof patientData !== 'undefined') {
        allPatients = patientData.allPatients;
        tooltipData = patientData.tooltipData || {};

        // 초기 테이블 생성
        refreshTable(allPatients);
        
        // 첫 번째 환자 기본 표시
        if (allPatients && allPatients.length > 0) {
            updateProfileInfo(allPatients[0]);
        }
        console.log("✅ 데이터 로드 성공!");
    } else {
        console.error("❌ patientData를 찾을 수 없습니다.");
        const summaryBox = document.getElementById('currentSummary');
        if (summaryBox) {
            summaryBox.innerHTML = "<p style='color:red;'>data.js 연결 실패!</p>";
        }
    }
};

// 3. 리스트 클릭 시 상세 영역 업데이트
function updateProfileInfo(p) {
    const summaryBox = document.getElementById('currentSummary');
    if (!summaryBox) return;

    // 데이터 형식에 따른 ID 처리 (stay_id가 없으면 pid 사용)
    const rawId = p.stay_id || p.pid || 'Unknown';
    const displayId = String(rawId).length > 15 ? String(rawId).substring(0, 15) + "..." : rawId;

    // 프로필 정보 레이아웃 (기존 필드와 시계열 정보 통합)
    summaryBox.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; line-height: 1.6;">
            <p><strong>ID:</strong> ${rawId}</p>
            ${p.dx ? `<p><strong>Diagnosis:</strong> ${p.dx}</p>` : ''}
            ${p.age ? `<p><strong>Age/Sex:</strong> ${p.age} (${p.sex || '-'})</p>` : ''}
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
            ${p.time_series ? `
                <p><strong>Data Points:</strong> ${p.time_series.length} slots</p>
                <p><strong>Latest Risk:</strong> ${(p.probabilities[p.probabilities.length - 1] * 100).toFixed(1)}%</p>
            ` : '<p style="color:orange;">시계열 데이터가 없는 환자입니다.</p>'}
        </div>
    `;

    const detailTitle = document.getElementById('detailTitle');
    if (detailTitle) detailTitle.innerText = `Analysis: Patient ${p.pid || 'Detail'}`;

    // 시계열 데이터가 있을 때만 차트 렌더링
    if (p.time_series && p.probabilities) {
        renderTimelineChart(p);
    } else if (myChart) {
        myChart.destroy(); // 데이터 없으면 기존 차트 제거
    }
}

// 4. 리스트 테이블 갱신
function refreshTable(data) {
    const tbody = document.querySelector("#patientTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = ""; 

    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        
        // 1. 데이터 추출 (성별, 나이, 데이터 포인트 등)
        const idToShow = p.stay_id || p.pid || '-';
        const dxToShow = p.dx || 'N/A';
        const sexToShow = p.sex || '-';   // 이 부분이 누락되었을 가능성이 큽니다.
        const ageToShow = p.age || '-';
        const dataCount = p.time_series ? `${p.time_series.length}건` : "정보 없음";
        const status = (p.actual_labels && p.actual_labels.includes(1.0)) ? "⚠️ Event" : "Normal";

        // 2. HTML 헤더(ID | DX | SEX | AGE | Points | Status) 순서에 정확히 맞춤
        // 만약 HTML 헤더 개수가 다르다면 이 부분을 헤더 개수와 동일하게 맞추세요.
        tr.innerHTML = `
            <td>${idToShow}</td>
            <td title="${dxToShow}">${dxToShow.length > 15 ? dxToShow.substring(0, 15) + '...' : dxToShow}</td>
            <td>${sexToShow}</td>
            <td>${ageToShow}</td>
        `;
        
        tr.onclick = function() {
            updateProfileInfo(p);
            toggleList();
        };
        tbody.appendChild(tr);
    });
}

// 5. 리스트 팝업 제어
function toggleList() {
    const overlay = document.getElementById('listOverlay');
    if (overlay) overlay.classList.toggle('active');
}

// 6. 검색 필터링 (필드명 대응 수정)
function applyFilter() {
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("searchInput").value.toLowerCase();
    
    const filtered = allPatients.filter(p => {
        // field가 id일 경우 stay_id와 pid 둘 다 검색 허용
        let target;
        if (field === 'id') {
            target = p.stay_id || p.pid;
        } else {
            target = p[field];
        }
        return String(target || '').toLowerCase().includes(value);
    });
    
    refreshTable(filtered);
}

// 7. Chart.js 시계열 렌더링
function renderTimelineChart(p) {
    const canvas = document.getElementById('predictionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: p.time_series.map(t => t.includes(' ') ? t.split(' ')[1] : t),
            datasets: [
                {
                    label: 'Risk Probability',
                    data: p.probabilities,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y'
                },
                {
                    label: 'Actual Event',
                    data: p.actual_labels,
                    borderColor: '#e74a3b',
                    pointBackgroundColor: '#e74a3b',
                    pointStyle: 'rectRot',
                    radius: 6,
                    showLine: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    title: { display: true, text: 'Probability' }
                }
            }
        }
    });
}
