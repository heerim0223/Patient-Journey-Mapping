
// 1. 전역 변수 설정
let allPatients = [];
let tooltipData = {};

window.onload = function() {
    // 1. data.js에 정의된 patientData 변수를 전역 변수에 할당
    if (typeof patientData !== 'undefined') {
        allPatients = patientData.allPatients;
        tooltipData = patientData.tooltipData;

        // 2. 화면 그리기
        refreshTable(allPatients);
        
        if (allPatients.length > 0) {
            updateProfileInfo(allPatients[0]);
        }
        console.log("✅ 서버 없이 데이터 로드 성공!");
    } else {
        console.error("❌ data.js 파일을 찾을 수 없거나 형식이 잘못되었습니다.");
        document.getElementById('currentSummary').innerHTML = "데이터 연결 실패 (data.js 확인 필요)";
    }
};

// 5. 환자 선택 리스트 테이블 갱신
function refreshTable(data) {
    const tbody = document.querySelector("#patientTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = ""; // 기존 내용 삭제

    data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.pid}</td>
            <td>${p.dx}</td>
            <td>${p.sex}</td>
            <td>${p.age}</td>
        `;
        
        // 리스트에서 환자 클릭 시 이벤트
        tr.onclick = () => {
            updateProfileInfo(p); // 프로필 정보 변경
            toggleList();         // 리스트 창 닫기
        };
        tbody.appendChild(tr);
    });
}

// 6. 리스트 팝업 열기/닫기
function toggleList() {
    const overlay = document.getElementById('listOverlay');
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// 7. 검색 필터링 함수
function applyFilter() {
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("searchInput").value.toLowerCase();
    
    const filtered = allPatients.filter(p => {
        const target = (field === 'id' ? p.pid : (field === 'dx' ? p.dx : p[field]));
        return String(target).toLowerCase().includes(value);
    });
    
    refreshTable(filtered);
}