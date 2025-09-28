(function(){
    // ----------------------------------------------------
    // 1. 변수 정의 및 환경 감지
    // ----------------------------------------------------
    var btn = document.getElementById('btnDistance');
    var drawing = false, clickLine = null, moveLine = null, lastPoint = null; // moveLine 변수 추가
    var totalOverlay = null; 
    var segmentOverlays = []; 
    var dotOverlays = [];     
    var segCount = 0; 
    
    var isMobileDevice = isMobile(); 
    
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
            
            if (!isMobileDevice) {
                // PC 전용: 마우스 이동 및 ESC 키 리스너 등록
                kakao.maps.event.addListener(map, 'mousemove', onMapMove);
                document.addEventListener('keyup', onKeyUp);
            }
            
            map.setDraggable(true);
            map.setZoomable(true);
            
        } else {
            // 종료 시 리스너 제거 공통
            kakao.maps.event.removeListener(map, 'click', onMapClick);
            kakao.maps.event.removeListener(map, 'mousemove', onMapMove);
            document.removeEventListener('keyup', onKeyUp);
            
            btn.classList.remove('active');
            map.setCursor('');
            resetMeasure();
        }
    }

    // ----------------------------------------------------
    // PC 전용: 마우스 이동 시 예상 거리 표시
    // ----------------------------------------------------
    function onMapMove(mouseEvent) {
        if (!drawing || !clickLine) return; // 첫 점이 찍혀야 시작

        var pos = mouseEvent.latLng;
        var path = [lastPoint, pos];
        
        // 이동 라인 생성 또는 업데이트
        if (!moveLine) {
            moveLine = new kakao.maps.Polyline({
                map: map, path: path,
                strokeWeight: 3, strokeColor:'#555',
                strokeOpacity: 0.8, strokeStyle:'dash'
            });
        } else {
            moveLine.setPath(path);
        }

        // 예상 구간 거리 표시 (예상 거리는 항상 화면 중앙 근처에 표시)
        var segDist = moveLine.getLength();
        showPredictionBox("예상거리 "+Math.round(segDist)+" m", map.getCenter());
    }

    // PC 전용: ESC 키로 종료
    function onKeyUp(e) {
        if (e.key === 'Escape' && drawing && clickLine) {
            finishMeasure(lastPoint);
        }
    }

    // 예상 거리 오버레이 표시 함수 (PC 전용)
    var predictionOverlay = null;
    function showPredictionBox(text, pos) {
        if (!predictionOverlay) {
            var box = document.createElement('div');
            box.style.cssText = "border:1px solid #333; border-radius:6px; background:#fffbe6; padding:4px 8px; font-size:12px; font-weight:bold; z-index:4;";
            box.innerText = text;
            
            predictionOverlay = new kakao.maps.CustomOverlay({
                map: map, position: pos, content: box,
                xAnchor: 0.5, yAnchor: 1, // 화면 중앙 하단
                pixelOffset: new kakao.maps.Point(0, -10)
            });
        } else {
            predictionOverlay.setContent('<div style="border:1px solid #333; border-radius:6px; background:#fffbe6; padding:4px 8px; font-size:12px; font-weight:bold; z-index:4;">' + text + '</div>');
            predictionOverlay.setPosition(pos); // 위치 업데이트
        }
    }
    
    // ----------------------------------------------------
    // 2. 지도 클릭 이벤트
    // ----------------------------------------------------
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

        } else {
            // 2. 두 번째 점부터
            var path = clickLine.getPath();
            path.push(pos); clickLine.setPath(path);
            
            // 예상 거리 오버레이 및 점선 제거 (PC 전용)
            if (!isMobileDevice) {
                if (moveLine) { moveLine.setMap(null); moveLine = null; }
                if (predictionOverlay) { predictionOverlay.setMap(null); predictionOverlay = null; }
                // PC는 구간 거리 오버레이 표시 안함
            }

            var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
            
            // *** 모바일 전용: 구간 거리 박스 표시 및 클릭 종료 기능 ***
            if (isMobileDevice) {
                 createSegmentBox("구간 "+Math.round(segDist)+" m", pos);
            }
            // *** PC 전용: 구간 거리 표시 안 함 ***
            
            addDot(pos);
            lastPoint = pos;
            segCount++;
        }
    }

    // ----------------------------------------------------
    // 3. 점 표시 및 구간 박스 생성 (모바일 전용)
    // ----------------------------------------------------
    function addDot(position){
        var circle = new kakao.maps.CustomOverlay({
            position: position,
            content: '<span style="width:8px;height:8px;background:#db4040;border:2px solid #fff;border-radius:50%;display:block;"></span>',
            zIndex:1
        });
        circle.setMap(map);
        dotOverlays.push(circle);
    }

    // 모바일 전용: 구간 박스 생성 (왼쪽 위 정렬)
    function createSegmentBox(text, pos){
        var box = document.createElement('div');
        box.style.cssText = "border:1px solid #333; border-radius:6px; background:#FFFFFF; padding:4px 8px; font-size:12px; font-weight:bold; cursor:pointer;";
        box.innerText = text;

        box.onclick = function(e){ 
            e.stopPropagation(); 
            finishMeasure(pos);
        };

        var overlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: box,
            xAnchor: 1, yAnchor: 0, 
            pixelOffset: new kakao.maps.Point(-10, -10), 
            zIndex: 3
        });
        
        segmentOverlays.push(overlay);
    }

    // ----------------------------------------------------
    // 4. 최종 종료 및 결과 표시
    // ----------------------------------------------------
    function finishMeasure(pos){
        // ** 핵심: 모든 이벤트 리스너 제거**
        kakao.maps.event.removeListener(map, 'click', onMapClick); 
        kakao.maps.event.removeListener(map, 'mousemove', onMapMove);
        document.removeEventListener('keyup', onKeyUp);
        
        drawing = false; 
        btn.classList.remove('active');

        if(!clickLine) return;
        var totalLen = Math.round(clickLine.getLength());

        // 측정 종료 시, 모든 구간 박스와 예상 오버레이 제거
        segmentOverlays.forEach(function(o){ o.setMap(null); });
        segmentOverlays = [];
        if (predictionOverlay) { predictionOverlay.setMap(null); predictionOverlay = null; }


        if(totalOverlay) totalOverlay.setMap(null);
        
        // 최종 거리 박스 컨텐츠 생성
        var boxContent = document.createElement('div');
        boxContent.style.cssText = "border:1px solid #333; border-radius:8px; background:#fff; padding:6px 10px; font-size:13px; font-weight:bold; display:flex; align-items:center; cursor:pointer;";
        
        var textSpan = document.createElement('span');
        textSpan.innerText = "최종거리: "+totalLen+" m";
        boxContent.appendChild(textSpan);

        var closeBtn = document.createElement('span');
        closeBtn.innerText = " X"; 
        closeBtn.style.cssText = "margin-left:8px; color:#db4040;";
        boxContent.appendChild(closeBtn);

        // 최종 거리 오버레이 생성
        totalOverlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: boxContent,
            xAnchor: 1, yAnchor: 1, 
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

        map.setCursor('');
    }

    // ----------------------------------------------------
    // 5. 측정 리셋 함수
    // ----------------------------------------------------
    function resetMeasure(){
        if(clickLine){ clickLine.setMap(null); clickLine=null; }
        if(moveLine){ moveLine.setMap(null); moveLine=null; } // 점선 제거
        if(predictionOverlay){ predictionOverlay.setMap(null); predictionOverlay=null; } // 예상 오버레이 제거
        
        dotOverlays.forEach(function(o){ o.setMap(null); });
        dotOverlays = [];
        
        segmentOverlays.forEach(function(o){ o.setMap(null); });
        segmentOverlays = [];
        
        if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
        
        lastPoint=null; segCount=0;
    }
})();
