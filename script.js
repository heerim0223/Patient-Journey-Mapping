
// 1. 전역 변수 설정
let allPatients = [];
let tooltipData = {};

// 2. 페이지 로드 시 실행 (서버 없이 변수에서 직접 로드)
window.onload = function() {
    console.log("페이지 로드 시도 중...");

    // data.js 파일 내부에 'const patientData = { ... }' 형식으로 저장되어 있어야 함
    if (typeof patientData !== 'undefined') {
        allPatients = patientData.allPatients;
        tooltipData = patientData.tooltipData;

        // 초기 테이블 생성
        refreshTable(allPatients);
        
        // 첫 번째 환자 기본 표시
        if (allPatients && allPatients.length > 0) {
            updateProfileInfo(allPatients[0]);
        }
        console.log("✅ 데이터 로드 및 초기 화면 렌더링 성공!");
    } else {
        console.error("❌ data.js 파일을 찾을 수 없거나 patientData 변수가 정의되지 않았습니다.");
        const summaryBox = document.getElementById('currentSummary');
        if (summaryBox) {
            summaryBox.innerHTML = "<p style='color:red;'>data.js 연결 실패!</p>";
        }
    }
};

// 3. 리스트 클릭 시 왼쪽 프로필 영역을 업데이트하는 함수
function updateProfileInfo(p) {
    const summaryBox = document.getElementById('currentSummary');
    if (!summaryBox) {
        console.error("❌ 'currentSummary' ID를 가진 요소를 찾을 수 없습니다.");
        return;
    }

    // 왼쪽 패널 내용 업데이트
    summaryBox.innerHTML = `
        <p><strong>ID:</strong> ${p.pid || '-'}</p>
        <p><strong>DX:</strong> ${p.dx || '-'}</p>
        <p><strong>SEX:</strong> ${p.sex || '-'}</p>
        <p><strong>AGE:</strong> ${p.age || '-'}</p>
        <p><strong>POD:</strong> ${p.pod !== undefined ? p.pod + 'd' : '-'}</p>
        <p style="font-size: 11px; color: #888; margin-top: auto;">* Click image to change patient</p>
    `;

    // 상단 타이틀 업데이트
    const detailTitle = document.getElementById('detailTitle');
    if (detailTitle) {
        detailTitle.innerText = `Timeline: Patient ${p.pid || ''}`;
    }
    
    console.log(`선택된 환자: ${p.pid}`);
}

// 4. 환자 선택 리스트 테이블 갱신 (클릭 이벤트 포함)
function refreshTable(data) {
    const tbody = document.querySelector("#patientTable tbody");
    if (!tbody) {
        console.error("❌ '#patientTable tbody'를 찾을 수 없습니다.");
        return;
    }
    
    tbody.innerHTML = ""; // 기존 내용 삭제

    data.forEach(p => {
        const tr = document.createElement("tr");
        // 클릭이 잘 되도록 스타일 추가 (커서 모양)
        tr.style.cursor = "pointer";
        
        tr.innerHTML = `
            <td>${p.pid}</td>
            <td>${p.dx}</td>
            <td>${p.sex}</td>
            <td>${p.age}</td>
        `;
        
        // 행 클릭 시 실행될 이벤트
        tr.onclick = function() {
            updateProfileInfo(p); // 프로필 정보 변경
            toggleList();         // 리스트 창 닫기
        };
        
        tbody.appendChild(tr);
    });
}

// 5. 리스트 팝업 열기/닫기
function toggleList() {
    const overlay = document.getElementById('listOverlay');
    if (overlay) {
        overlay.classList.toggle('active');
    } else {
        console.warn("⚠️ 'listOverlay' 요소를 찾을 수 없습니다.");
    }
}

// 6. 검색 필터링 함수
function applyFilter() {
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("searchInput").value.toLowerCase();
    
    const filtered = allPatients.filter(p => {
        const target = (field === 'id' ? p.pid : (field === 'dx' ? p.dx : p[field]));
        return String(target).toLowerCase().includes(value);
    });
    
    refreshTable(filtered);
}
