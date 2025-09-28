(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, dots = [], totalOverlay = null;
  var el = map.getNode();

  btn.addEventListener('click', toggleMeasure);

  function toggleMeasure(){
    drawing = !drawing;
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      bindTouchHandlers();
    } else {
      unbindTouchHandlers();
      btn.classList.remove('active');
      map.setCursor('');
      resetMeasure();
    }
  }

  // ===== 모바일 이벤트 바인딩 =====
  function bindTouchHandlers(){
    el.addEventListener('touchstart', onTouchStart, {passive:false});
    el.addEventListener('touchend',   onTouchEnd,   {passive:false});
  }
  function unbindTouchHandlers(){
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchend',   onTouchEnd);
  }

  // 좌표 변환
  function pointToLatLng(clientX, clientY){
    var rect = el.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var proj = map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x, y));
  }

  // === 터치 상태 관리 ===
  var touchStart = null;
  function onTouchStart(ev){
    if(!drawing) return;
    if(ev.touches.length > 1) return; // 두 손가락 이상 → 무시

    touchStart = {x:ev.touches[0].clientX, y:ev.touches[0].clientY};
  }

  function onTouchEnd(ev){
    if(!drawing || !touchStart) return;
    if(ev.changedTouches.length !== 1) return;

    var endX = ev.changedTouches[0].clientX;
    var endY = ev.changedTouches[0].clientY;

    // === 이동거리 계산 (드래그 방지) ===
    var dx = endX - touchStart.x;
    var dy = endY - touchStart.y;
    var dist = Math.sqrt(dx*dx + dy*dy);

    if(dist > 5){ // 5px 이상 움직였으면 드래그로 간주 → 무시
      touchStart = null;
      return;
    }

    // === 실제 클릭으로 인정 ===
    var latlng = pointToLatLng(endX, endY);
    confirmPoint(latlng);
    touchStart = null;
  }

  // ========= 공통 로직 =========
  function confirmPoint(pos){
    if(!clickLine){
      // 첫 점
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040',
        strokeOpacity: 1, strokeStyle: 'solid'
      });
      addDot(pos, null); // 시작점에도 점 찍기
    } else {
      var path = clickLine.getPath();
      var prev = path[path.length-1];
      path.push(pos);
      clickLine.setPath(path);

      var segDist = new kakao.maps.Polyline({path:[prev,pos]}).getLength();
      addDot(pos, segDist);
    }
  }

  // 점 + 세그먼트 거리
  function addDot(position, segDist){
    var circle = new kakao.maps.CustomOverlay({
      position: position, content: '<span class="dot"></span>', zIndex: 1
    });
    circle.setMap(map);

    var distOverlay = null;
    if(segDist != null){
      var content = document.createElement('div');
      content.className = 'segBox';
      content.innerText = Math.round(segDist) + " m";

      // 클릭하면 종료
      content.addEventListener('click', function(e){
        e.stopPropagation();
        finishMeasure(position);
      });

      distOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        xAnchor: 0, yAnchor: 0,
        pixelOffset: new kakao.maps.Point(10, -10),
        zIndex: 2
      });
      distOverlay.setMap(map);
    }
    dots.push({circle:circle, distance:distOverlay});
  }

  // 종료
  function finishMeasure(pos){
    if(!clickLine) return;
    var totalLen = Math.round(clickLine.getLength());

    if(totalOverlay) totalOverlay.setMap(null);
    var box = document.createElement('div');
    box.className = 'totalBox';
    box.innerHTML = '총거리 ' + totalLen + ' m';

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: pos, content: box,
      xAnchor: 1, yAnchor: 1,
      pixelOffset: new kakao.maps.Point(-10, 10),
      zIndex: 3
    });

    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
    unbindTouchHandlers();
  }

  function resetMeasure(){
    if(clickLine){ clickLine.setMap(null); clickLine=null; }
    if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
    dots.forEach(d=>{
      if(d.circle) d.circle.setMap(null);
      if(d.distance) d.distance.setMap(null);
    });
    dots=[];
  }
})();
