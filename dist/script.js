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

        // 적용: 로컬스토리지에 남아있는 노트 병합
        applySavedNotesFromStorage();

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

    // 노트 관련 버튼 바인딩
    const commitBtn = document.getElementById('commitNotesBtn');
    if (commitBtn) commitBtn.addEventListener('click', commitNotes);
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

    // 현재 환자 id를 전역 변수에 저장하고 SVG 툴팁을 갱신합니다.
    currentPatientId = String(p.stay_id || p.pid || rawId);
    setupSVGTooltips();
    highlightSVGPartsForPatient(currentPatientId); // <-- 추가: 강조 적용

    // 시계열 차트 렌더링
    if (p.time_series && p.probabilities) {
        renderTimelineChart(p);
    } else if (myChart) {
        myChart.destroy();
    }

    // 노트 영역 업데이트
    const notesEl = document.getElementById('notesTextarea');
    const statusEl = document.getElementById('notesStatus');
    if (notesEl) notesEl.value = p.notes || '';
    if (statusEl) statusEl.innerText = '';
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


// ...existing code...
// 8. SVG 툴팁 초기화 및 하이라이트 관리
let currentPatientId = null;

function setupSVGTooltips() {
    const tooltipEl = document.getElementById('tooltip');
    const svg = document.querySelector('.svg-wrapper svg');
    if (!tooltipEl || !svg) return;

    svg.querySelectorAll('[id]').forEach(el => {
        // 중복 바인딩 방지
        if (el.dataset.tooltipBound) return;
        el.dataset.tooltipBound = '1';

        // 원래 스타일 보존 (나중에 복원)
        if (!el.dataset.originalFill) el.dataset.originalFill = el.getAttribute('fill') || window.getComputedStyle(el).fill || '';
        if (!el.dataset.originalStroke) el.dataset.originalStroke = el.getAttribute('stroke') || window.getComputedStyle(el).stroke || '';

        el.style.pointerEvents = 'auto';

        el.addEventListener('mouseenter', (e) => {
            const pid = currentPatientId;
            const pidData = tooltipData && tooltipData[pid] ? tooltipData[pid] : null;
            const info = pidData && pidData[el.id] ? pidData[el.id] : null;

            if (info) {
                tooltipEl.innerHTML = `<strong>${info.title || el.id}</strong><br>${info.desc || ''}`;
                tooltipEl.style.display = 'block';
                // 즉시 해당 요소 강조(마우스 오버 시 추가 강조 원하면 사용)
                el.classList.add('svg-highlight');
                el.style.fill = '#e74a3b';
                el.style.stroke = '#b92b2b';
            } else {
                tooltipEl.style.display = 'none';
            }
        });

        el.addEventListener('mousemove', (e) => {
            if (!tooltipEl || tooltipEl.style.display === 'none') return;
            const x = e.pageX + 12;
            const y = e.pageY + 12;
            tooltipEl.style.left = x + 'px';
            tooltipEl.style.top = y + 'px';
        });

        el.addEventListener('mouseleave', (e) => {
            if (tooltipEl) {
                tooltipEl.style.display = 'none';
                tooltipEl.innerHTML = '';
            }
            // 마우스 오프 시 hover 강조는 제거하지만, 환자 데이터가 있으면 global 하이라이트는 유지
            const pid = currentPatientId;
            const pidData = tooltipData && tooltipData[pid] ? tooltipData[pid] : null;
            const stillHasInfo = pidData && pidData[el.id];
            if (!stillHasInfo) {
                el.classList.remove('svg-highlight');
                el.style.fill = el.dataset.originalFill || '';
                el.style.stroke = el.dataset.originalStroke || '';
                el.style.strokeWidth = '';
            } else {
                // 유지할 경우 스타일을 글로벌 하이라이트 스타일로 재적용
                el.style.fill = '#e74a3b';
                el.style.stroke = '#b92b2b';
            }
        });
    });
}

// 현재 환자에 대해 tooltip 데이터가 존재하는 모든 SVG 부위를 강조/복원
function highlightSVGPartsForPatient(pid) {
    const svg = document.querySelector('.svg-wrapper svg');
    if (!svg) return;
    const pidKey = String(pid || currentPatientId || '');
    const pidData = tooltipData && (tooltipData[pidKey] || tooltipData[String(pid)]) ? (tooltipData[pidKey] || tooltipData[String(pid)]) : {};

    svg.querySelectorAll('[id]').forEach(el => {
        // 원래 스타일 보존 (필요시 사용)
        if (!el.dataset.originalFill) el.dataset.originalFill = el.getAttribute('fill') || window.getComputedStyle(el).fill || '';
        if (!el.dataset.originalStroke) el.dataset.originalStroke = el.getAttribute('stroke') || window.getComputedStyle(el).stroke || '';

        const hasInfo = !!(pidData && pidData[el.id]);
        if (hasInfo) {
            el.classList.add('svg-highlight');
            // 강제 적용: inline style에 !important로 우선권 확보
            el.style.setProperty('fill', '#e74a3b', 'important');
            el.style.setProperty('stroke', '#b92b2b', 'important');
            el.style.setProperty('stroke-width', '1px', 'important');
        } else {
            el.classList.remove('svg-highlight');
            // 원상복구: inline 속성 제거
            el.style.removeProperty('fill');
            el.style.removeProperty('stroke');
            el.style.removeProperty('stroke-width');
        }
    });
}

// helper: find patient index by pid or stay_id
function findPatientIndexById(id) {
    return allPatients.findIndex(pt => (pt.pid && pt.pid === id) || (pt.stay_id && pt.stay_id === id));
}

// 저장: 로컬스토리지에서 병합 적용
function applySavedNotesFromStorage() {
    try {
        const raw = localStorage.getItem('pjm_patient_notes_v1');
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (!saved || !saved.patients) return;
        // saved.patients is expected to be an array of patients with .pid/.stay_id and .notes
        saved.patients.forEach(sp => {
            const idx = findPatientIndexById(sp.pid || sp.stay_id);
            if (idx !== -1 && sp.notes) {
                allPatients[idx].notes = sp.notes;
            }
        });
    } catch (e) {
        console.warn("applySavedNotesFromStorage failed", e);
    }
}

// Commit 버튼 동작: 현재 환자 notes 업데이트, 로컬 저장, 및 data.js 형태로 다운로드 제공
function commitNotes() {
    const notesEl = document.getElementById('notesTextarea');
    const statusEl = document.getElementById('notesStatus');
    if (!notesEl) return;
    if (!currentPatientId) {
        alert('선택된 환자가 없습니다.');
        return;
    }
    const notes = notesEl.value;
    const idx = findPatientIndexById(currentPatientId);
    if (idx === -1) {
        alert('환자를 찾을 수 없습니다.');
        return;
    }

    // 적용 (메모는 allPatients 배열의 해당 환자에 추가)
    allPatients[idx].notes = notes;

    // 로컬스토리지에 저장 (버전 v1)
    try {
        const payload = { timestamp: Date.now(), patients: allPatients.map(p => ({ pid: p.pid, stay_id: p.stay_id, notes: p.notes })) };
        localStorage.setItem('pjm_patient_notes_v1', JSON.stringify(payload));
    } catch (e) {
        console.warn("localStorage save failed", e);
    }

    // 변경된 patientData 객체로 data.js 파일 내용 생성해서 다운로드 제공
    try {
        const updatedPatientData = Object.assign({}, (typeof patientData !== 'undefined' ? patientData : {}));
        updatedPatientData.allPatients = allPatients;

        const dataJsContent = 'const patientData = ' + JSON.stringify(updatedPatientData, null, 4) + ';';
        const blob = new Blob([dataJsContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'patientData.updated.js';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        if (statusEl) {
            statusEl.innerText = 'Saved & download ready';
            setTimeout(() => { if (statusEl) statusEl.innerText = ''; }, 3000);
        }
    } catch (e) {
        console.error("download generation failed", e);
        if (statusEl) statusEl.innerText = 'Save failed';
        setTimeout(() => { if (statusEl) statusEl.innerText = ''; }, 3000);
    }
}