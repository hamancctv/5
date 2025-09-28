(function(){
    // ----------------------------------------------------
    // 1. 변수 정의 및 환경 감지
    // ----------------------------------------------------
    var btn = document.getElementById('btnDistance');
    var drawing = false, clickLine = null, lastPoint = null;
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
            
            kakao.maps.event.addListener(map, 'click', onMapClick);
            
            map.setDraggable(true);
            map.setZoomable(true);
            
        } else {
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
            // 1. 첫 점
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
            
            var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
            
            // 구간 거리 박스 생성 (흰색, 왼쪽 위, 클릭 시 종료)
            createSegmentBox("구간 "+Math.round(segDist)+" m", pos);
            
            addDot(pos);
            lastPoint = pos;
            segCount++;
        }
    }

    function addDot(position){
        var circle = new kakao.maps.CustomOverlay({
            position: position,
            content: '<span style="width:8px;height:8px;background:#db4040;border:2px solid #fff;border-radius:50%;display:block;"></span>',
            zIndex:1
        });
        circle.setMap(map);
        dotOverlays.push(circle);
    }

    // ----------------------------------------------------
    // 3. 구간 박스 생성
    // ----------------------------------------------------
    function createSegmentBox(text, pos){
        var box = document.createElement('div');
        box.style.border = "1px solid #333";
        box.style.borderRadius = "6px";
        box.style.background = "#FFFFFF"; 
        box.style.padding = "4px 8px";
        box.style.fontSize = "12px";
        box.style.fontWeight = "bold";
        box.style.cursor = "pointer";
        box.innerText = text;

        // 클릭 시 최종 종료 함수 호출
        box.onclick = function(e){ 
            e.stopPropagation(); // 이벤트 버블링 차단 (추가 안전 장치)
            finishMeasure(pos);
        };

        var overlay = new kakao.maps.CustomOverlay({
            map: map, position: pos, content: box,
            xAnchor: 1, yAnchor: 0, 
            pixelOffset: new kakao.maps.Point(-10, 10), 
            zIndex: 3
        });
        
        segmentOverlays.push(overlay);
    }

    // ----------------------------------------------------
    // 4. 최종 종료 및 결과 표시 (수정됨)
    // ----------------------------------------------------
    function finishMeasure(pos){
        // *** 문제 해결 핵심: 리스너 즉시 제거 ***
        kakao.maps.event.removeListener(map, 'click', onMapClick); 
        drawing = false; 
        btn.classList.remove('active');

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
        
        dotOverlays.forEach(function(o){ o.setMap(null); });
        dotOverlays = [];
        
        segmentOverlays.forEach(function(o){ o.setMap(null); });
        segmentOverlays = [];
        
        if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
        
        lastPoint=null; segCount=0;
    }
})();
