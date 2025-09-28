(function(){
    // ----------------------------------------------------
    // 1. 변수 정의 및 환경 감지
    // ----------------------------------------------------
    var btn = document.getElementById('btnDistance');
    var drawing = false, clickLine = null, lastPoint = null;
    var totalOverlay = null; // 최종 거리 오버레이
    var segmentOverlays = []; // 모든 구간 거리 오버레이를 저장할 배열
    var dotOverlays = [];     // 모든 점 오버레이를 저장할 배열
    var segCount = 0; // 구간 개수
    
    var isMobileDevice = isMobile(); // 모바일 환경 감지
    
    // 환경 감지 함수
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    // ----------------------------------------------------

    btn.addEventListener('click', toggleMeasure);

    function toggleMeasure(){
        drawing = !drawing;
        if(drawing){
            resetMeasure();
            btn.classList.add('active');
            map.setCursor(isMobileDevice ? '' : 'crosshair');
            
            // 공통: 지도 클릭 리스너 등록
            kakao.maps.event.addListener(map, 'click', onMapClick);
            
            // 모바일 환경은 측정 중에도 지도 이동 허용 (터치 편의성)
            map.setDraggable(true);
            map.setZoomable(true);
            
        } else {
            // 종료
            kakao.maps.event.removeListener(map, 'click', onMapClick);
            btn.classList.remove('active');
            map.setCursor('');
            resetMeasure();
        }
    }

    function onMapClick(mouseEvent){
        if(!drawing) return;
        var pos = mouseEvent.latLng;

        if(!clickLine){ 
            // 1. 첫 점 (PC/모바일 공통)
            clickLine = new kakao.maps.Polyline({
                map: map, path:[pos],
                strokeWeight: 3, strokeColor:'#db4040',
                strokeOpacity: 1, strokeStyle:'solid'
            });
            addDot(pos);
            lastPoint = pos;
            segCount = 1;

        } else if (isMobileDevice) {
            // 2. 모바일 특화: 두 번째 점부터 구간 계산 및 박스 표시
            var path = clickLine.getPath();
            path.push(pos); clickLine.setPath(path);
            
            // 구간 거리 계산
            var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
            
            // 구간 거리 박스 생성 (흰색, 왼쪽 위, 클릭 시 종료)
            createSegmentBox("구간 "+Math.round(segDist)+" m", pos);
            
            addDot(pos);
            lastPoint = pos;
            segCount++;
            
        } else {
            // 3. PC 환경: 기존 로직 또는 PC 최적화 로직 적용 (여기서는 간소화된 클릭 로직 유지)
            // PC 버전은 mousemove 로직이 없으므로, onMapMove를 추가하여 개선해야 하지만,
            // 모바일 요청에 집중하여 클릭 시 선을 이어나가는 기본 동작만 유지합니다.
            var path = clickLine.getPath();
            path.push(pos); clickLine.setPath(path);
            
            // PC에서는 segment 박스 클릭으로 종료하는 기능은 제외하고, 이전 로직처럼 3번째 점부터 종료 버튼을 넣는 것이 일반적입니다.
            // 여기서는 사용자 요청에 따라 모바일 로직과 동일하게 모든 구간에 클릭 종료 기능을 부여합니다.
            var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
            createSegmentBox("구간 "+Math.round(segDist)+" m", pos);

            addDot(pos);
            lastPoint = pos;
            segCount++;
        }
    }

    // 점 표시 함수
    function addDot(position){
        var circle = new kakao.maps.CustomOverlay({
            position: position,
            content: '<span style="width:8px;height:8px;background:#db4040;border:2px solid #fff;border-radius:50%;display:block;"></span>',
            zIndex:1
        });
        circle.setMap(map);
        dotOverlays.push(circle); // 점 오버레이 저장
    }

    // ----------------------------------------------------
    // 3. 구간 박스 생성 (흰색, 왼쪽 위, 클릭 시 종료 기능 포함)
    // ----------------------------------------------------
    function createSegmentBox(text, pos){
        var box = document.createElement('div');
        box.style.border = "1px solid #333";
        box.style.borderRadius = "6px";
        box.style.background = "#FFFFFF"; // 흰색 배경
        box.style.padding = "4px 8px";
        box.style.fontSize = "12px";
        box.style.fontWeight = "bold";
        box.style.cursor = "pointer";
        box.innerText = text;

        // 클릭 시 최종 종료 함수 호출
        box.onclick = function(e){ 
            e.stopPropagation(); 
            finishMeasure(pos);
        };

        var overlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: box,
            // 왼쪽 위 정렬 (xAnchor:1 -> 앵커를 오른쪽 끝으로 이동, yAnchor:0 -> 앵커를 위쪽 끝으로 이동)
            xAnchor: 1, yAnchor: 0, 
            pixelOffset: new kakao.maps.Point(-10, 10), // 지점에서 약간의 여백
            zIndex: 3
        });
        
        segmentOverlays.push(overlay); // 오버레이를 배열에 저장
    }

    // ----------------------------------------------------
    // 4. 최종 종료 및 결과 표시 (오른쪽 아래, 'X' 표시, 박스 클릭 시 리셋)
    // ----------------------------------------------------
    function finishMeasure(pos){
        if(!clickLine) return;
        var totalLen = Math.round(clickLine.getLength());

        // 측정 종료 시, 모든 구간 박스는 제거합니다.
        segmentOverlays.forEach(function(o){ o.setMap(null); });
        segmentOverlays = [];

        if(totalOverlay) totalOverlay.setMap(null);
        
        // 최종 거리 박스 컨텐츠 생성
        var boxContent = document.createElement('div');
        boxContent.style.cssText = "border:1px solid #333; border-radius:8px; background:#fff; padding:6px 10px; font-size:13px; font-weight:bold; display:flex; align-items:center; cursor:pointer;";
        
        var textSpan = document.createElement('span');
        textSpan.innerText = "최종거리: "+totalLen+" m";
        boxContent.appendChild(textSpan);

        var closeBtn = document.createElement('span');
        closeBtn.innerText = " X"; // 'X' 표시
        closeBtn.style.cssText = "margin-left:8px; color:#db4040;";
        boxContent.appendChild(closeBtn);

        // 최종 거리 오버레이 생성
        totalOverlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: boxContent,
            xAnchor: 1, yAnchor: 1, // 오른쪽 아래 정렬
            pixelOffset: new kakao.maps.Point(-10, -10), 
            zIndex: 5
        });
        
        // 최종 거리 박스 클릭 이벤트: 측정 리셋 및 자신(totalOverlay) 제거
        boxContent.onclick = function(e) {
            e.stopPropagation(); 
            resetMeasure();
            if(totalOverlay) {
                totalOverlay.setMap(null);
                totalOverlay = null;
            }
        };

        // 측정 모드 종료 처리
        drawing = false;
        btn.classList.remove('active');
        map.setCursor('');
        kakao.maps.event.removeListener(map, 'click', onMapClick);
    }

    // ----------------------------------------------------
    // 5. 측정 리셋 함수
    // ----------------------------------------------------
    function resetMeasure(){
        if(clickLine){ clickLine.setMap(null); clickLine=null; }
        
        // 모든 점 오버레이 제거
        dotOverlays.forEach(function(o){ o.setMap(null); });
        dotOverlays = [];
        
        // 모든 구간 오버레이 제거
        segmentOverlays.forEach(function(o){ o.setMap(null); });
        segmentOverlays = [];
        
        // 최종 거리 오버레이 제거
        if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
        
        lastPoint=null; segCount=0;
    }
})();
