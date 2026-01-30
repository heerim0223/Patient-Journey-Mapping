// 1. 전역 변수 설정
let allPatients = [];
let tooltipData = {};
let myChart = null; 

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

    const rawId = p.stay_id || p.pid || 'Unknown';
    const latestProb = (p.probabilities && p.probabilities.length > 0) 
        ? (p.probabilities[p.probabilities.length - 1] * 100).toFixed(1) 
        : '0.0';

    // 프로필 정보 레이아웃 (HTML 구조 개선)
    summaryBox.innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; line-height: 1.6; border-left: 5px solid #4e73df;">
            <p style="margin-bottom: 5px;"><strong>ID:</strong> ${rawId}</p>
            <p style="margin-bottom: 5px;"><strong>Diagnosis:</strong> ${p.dx || 'N/A'}</p>
            <p style="margin-bottom: 5px;"><strong>Age/Sex:</strong> ${p.age || '-'} (${p.sex || '-'})</p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 10px 0;">
            ${p.time_series ? `
                <p><strong>Data Points:</strong> ${p.time_series.length} slots</p>
                <p><strong>Latest Risk Score:</strong> <span style="color: ${latestProb > 50 ? '#e74a3b' : '#4e73df'}; font-weight: bold;">${latestProb}%</span></p>
            ` : '<p style="color:orange;">시계열 데이터가 없는 환자입니다.</p>'}
        </div>
    `;

    const detailTitle = document.getElementById('detailTitle');
    if (detailTitle) detailTitle.innerText = `Analysis: Patient ${p.pid || rawId}`;

    // 시계열 차트 렌더링
    if (p.time_series && p.probabilities) {
        renderTimelineChart(p);
    } else if (myChart) {
        myChart.destroy();
    }
}

// 4. 리스트 테이블 갱신 (헤더 개수: ID | Diagnosis | Sex | Age | Status)
function refreshTable(data) {
    const tbody = document.querySelector("#patientTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = ""; 

    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        
        const idToShow = p.stay_id || p.pid || '-';
        const dxToShow = p.dx || 'N/A';
        const sexToShow = p.sex || '-';
        const ageToShow = p.age || '-';
        const isEvent = (p.actual_labels && p.actual_labels.includes(1.0));
        const statusTag = isEvent 
            ? '<span style="color: #e74a3b; font-weight: bold;">⚠️ Event</span>' 
            : '<span style="color: #1cc88a;">Normal</span>';

        tr.innerHTML = `
            <td>${idToShow}</td>
            <td title="${dxToShow}">${dxToShow.length > 15 ? dxToShow.substring(0, 15) + '...' : dxToShow}</td>
            <td>${sexToShow}</td>
            <td>${ageToShow}</td>
            <td>${statusTag}</td>
        `;
        
        tr.onclick = function() {
            updateProfileInfo(p);
            // 모바일 환경 등에서 리스트 팝업을 닫는 기능
            if (typeof toggleList === "function") toggleList(); 
        };
        tbody.appendChild(tr);
    });
}

// 5. 리스트 팝업 제어
function toggleList() {
    const overlay = document.getElementById('listOverlay');
    if (overlay) overlay.classList.toggle('active');
}

// 6. 검색 필터링 (안전한 문자열 비교)
function applyFilter() {
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("searchInput").value.toLowerCase();
    
    const filtered = allPatients.filter(p => {
        let targetValue = "";
        if (field === 'id') {
            targetValue = String(p.stay_id || p.pid || "");
        } else {
            targetValue = String(p[field] || "");
        }
        return targetValue.toLowerCase().includes(value);
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
                    radius: 8,
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
                    max: 1.1, // 이벤트 마커가 잘리지 않게 약간 여유를 줌
                    title: { display: true, text: 'Probability' }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}
