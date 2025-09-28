(function(){
    var btn = document.getElementById('btnDistance');
    var drawing = false, clickLine = null, moveLine = null, lastPoint = null;
    var segOverlay = null, totalOverlay = null;
    var segCount = 0; // 구간 개수
    var isMobileDevice = isMobile(); // 환경 감지
    var mobileBtn = null; // 모바일에서 사용할 '점 찍기' 버튼

    // ----------------------------------------------------
    // 1. 환경 감지 함수
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
            
            // PC/모바일 이벤트 분기 처리
            if(isMobileDevice){
                setupMobileMeasure(); // 모바일 측정 설정
            } else {
                kakao.maps.event.addListener(map, 'click', onMapClick);
                kakao.maps.event.addListener(map, 'mousemove', onMapMove); // PC: 마우스 오버 이벤트
            }

            // 공통 설정: 모바일에서는 드래그/줌 계속 허용 (버튼으로 점 찍기)
            map.setDraggable(true); 
            map.setZoomable(true);

        } else {
            // 종료 시 공통 처리
            kakao.maps.event.removeListener(map, 'click', onMapClick);
            kakao.maps.event.removeListener(map, 'mousemove', onMapMove);
            btn.classList.remove('active');
            map.setCursor('');
            resetMeasure();
            removeMobileUI(); // 모바일 UI 제거
        }
    }

    // ----------------------------------------------------
    // PC 전용: 마우스 이동 이벤트
    function onMapMove(mouseEvent){
        if(!drawing || !clickLine) return; // 첫 번째 점이 찍히지 않았다면 무시
        
        var pos = mouseEvent.latLng;
        var path = [lastPoint, pos];
        
        // 이동 라인 생성 및 업데이트
        if(!moveLine){
            moveLine = new kakao.maps.Polyline({
                map: map, path: path,
                strokeWeight: 3, strokeColor:'#555',
                strokeOpacity: 0.8, strokeStyle:'dash'
            });
        } else {
            moveLine.setPath(path);
        }
        
        // 실시간 예상 구간 거리 표시 (화면 중앙에 표시)
        var segDist = moveLine.getLength();
        showSegBox("예상구간 "+Math.round(segDist)+" m", map.getCenter(), false);
    }
    // ----------------------------------------------------


    // ----------------------------------------------------
    // 모바일 전용: UI 설정
    function setupMobileMeasure() {
        // 지도 중앙에 임시 마커 표시 (점 찍을 위치 안내)
        addCenterMarker(); 
        
        // '점 찍기' 버튼 생성 및 추가
        mobileBtn = document.createElement('button');
        mobileBtn.innerText = "점 찍기 (확정)";
        mobileBtn.style.cssText = "position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:10; padding:10px 20px; font-weight:bold; background:#db4040; color:#fff; border:none; border-radius:5px;";
        
        // 버튼 클릭 이벤트: 지도 중앙 좌표를 클릭 좌표로 사용
        mobileBtn.onclick = function() {
            onMapClick({ latLng: map.getCenter() });
        };
        
        document.body.appendChild(mobileBtn);
    }
    
    // 모바일 전용 UI 제거
    function removeMobileUI() {
        if (mobileBtn && mobileBtn.parentNode) {
            mobileBtn.parentNode.removeChild(mobileBtn);
            mobileBtn = null;
        }
        // 지도 중앙 마커 제거 (CustomOverlay가 지도에 직접 추가되었다고 가정)
        if (mapCenterOverlay) {
            mapCenterOverlay.setMap(null);
            mapCenterOverlay = null;
        }
    }
    
    var mapCenterOverlay = null;
    // 모바일 지도 중앙에 안내 마커 추가
    function addCenterMarker() {
        if(mapCenterOverlay) return;
        
        var content = '<div style="position:relative; width:20px; height:20px;"><div style="position:absolute; top:-10px; left:-10px; width:20px; height:20px; background:rgba(219, 64, 64, 0.5); border:2px solid #db4040; border-radius:50%;"></div></div>';
        
        mapCenterOverlay = new kakao.maps.CustomOverlay({
            map: map,
            position: map.getCenter(), // 지도 중앙에 고정
            content: content,
            zIndex: 9
        });
        
        // 지도가 움직일 때마다 중앙 오버레이 위치 업데이트
        kakao.maps.event.addListener(map, 'center_changed', function() {
            if (mapCenterOverlay) {
                mapCenterOverlay.setPosition(map.getCenter());
            }
        });
    }
    // ----------------------------------------------------


    // PC/모바일 공통: 클릭 지점 처리 (모바일에서는 '점 찍기' 버튼 클릭 시 호출됨)
    function onMapClick(mouseEvent){
        if(!drawing) return;
        var pos = mouseEvent.latLng;

        if(!clickLine){
            // 첫 점
            // ... (기존 코드와 동일) ...
            clickLine = new kakao.maps.Polyline({
                map: map, path:[pos],
                strokeWeight: 3, strokeColor:'#db4040',
                strokeOpacity: 1, strokeStyle:'solid'
            });
            addDot(pos);
            lastPoint = pos;
            segCount = 1;
            // PC에서는 여기서 지도 드래그/줌 비활성화 로직 제거 (onMapMove 위해)
            // 모바일은 이미 활성화 상태 유지

        } else {
            // 두번째 점부터
            var path = clickLine.getPath();
            path.push(pos); clickLine.setPath(path);
            
            // moveLine이 있다면 제거 (PC: 다음 세그먼트를 위해)
            if(moveLine){ moveLine.setMap(null); moveLine=null; }

            var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
            
            // 세번째 점부터는 종료 가능 버튼 표시
            var clickable = segCount >= 2;
            showSegBox("구간 "+Math.round(segDist)+" m", pos, clickable, function(){
                finishMeasure(pos);
            });
            
            addDot(pos);
            lastPoint = pos;
            segCount++;
        }
    }
    
    // ... (addDot, showSegBox, finishMeasure, resetMeasure 함수는 기존 코드와 동일하게 사용) ...
    // 단, showSegBox는 PC에서는 마우스 좌표 주변, 모바일에서는 지도 중앙에 고정하는 방식으로 수정할 수 있습니다. 

    function finishMeasure(pos){
        // ... (기존 코드와 동일) ...
        // 종료 시 모바일 UI 정리
        if(isMobileDevice) removeMobileUI();
        
        // ... (나머지 종료 로직) ...
        if(!clickLine) return;
        var totalLen = Math.round(clickLine.getLength());

        if(totalOverlay) totalOverlay.setMap(null);
        var box = document.createElement('div');
        box.style.border="1px solid #333";
        box.style.borderRadius="8px";
        box.style.background="#fff";
        box.style.padding="6px 10px";
        box.style.fontSize="13px";
        box.style.fontWeight="bold";
        box.innerText = "최종거리: "+totalLen+" m";

        totalOverlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: box,
            xAnchor:1, yAnchor:1,
            pixelOffset: new kakao.maps.Point(-10,-10), zIndex:3
        });

        drawing = false;
        btn.classList.remove('active');
        map.setCursor('');
        kakao.maps.event.removeListener(map, 'click', onMapClick);
        kakao.maps.event.removeListener(map, 'mousemove', onMapMove); // PC 이벤트 제거
        map.setDraggable(true);
        map.setZoomable(true);
    }
    
    function addDot(position){
        var circle = new kakao.maps.CustomOverlay({
            position: position,
            content: '<span style="width:8px;height:8px;background:#db4040;border:2px solid #fff;border-radius:50%;display:block;"></span>',
            zIndex:1
        });
        circle.setMap(map);
    }
    
    function showSegBox(text, pos, clickable, onClick){
        if(segOverlay) segOverlay.setMap(null);

        var box = document.createElement('div');
        box.style.border="1px solid #333";
        box.style.borderRadius="6px";
        box.style.background="#fffbe6";
        box.style.padding="4px 8px";
        box.style.fontSize="12px";
        box.style.fontWeight="bold";
        box.innerText = text;

        if(clickable && onClick){
            box.style.cursor = "pointer";
            box.onclick = function(e){ e.stopPropagation(); onClick(); };
        }

        // PC: 마우스 커서 위치에 표시 (맵 중앙 고정 해제)
        // 모바일: 지도 중앙에 고정
        var positionToShow = isMobileDevice ? map.getCenter() : pos;
        var anchorX = isMobileDevice ? 0 : 0.5;
        var anchorY = isMobileDevice ? 0 : 1; 
        var pixelOffset = isMobileDevice ? new kakao.maps.Point(10,10) : new kakao.maps.Point(0,-10);


        segOverlay = new kakao.maps.CustomOverlay({
            map: map, position: positionToShow,
            content: box, xAnchor: anchorX, yAnchor: anchorY,
            pixelOffset: pixelOffset, zIndex:3
        });
        
        // 모바일인 경우, 지도 중앙에 고정된 오버레이를 유지하기 위해 위치 업데이트 리스너 추가 (옵션)
        if(isMobileDevice) {
             segOverlay.setPosition(map.getCenter());
        }
    }
    
    function resetMeasure(){
        if(clickLine){ clickLine.setMap(null); clickLine=null; }
        if(moveLine){ moveLine.setMap(null); moveLine=null; }
        if(segOverlay){ segOverlay.setMap(null); segOverlay=null; }
        if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
        lastPoint=null; segCount=0;
    }
    
})();
