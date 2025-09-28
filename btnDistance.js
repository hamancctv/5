(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, dots = [], totalOverlay = null;
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

  // ===== 모바일 전용 이벤트 =====
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

  // 터치 시작 (두 손가락 이상이면 무시)
  function onTouchStart(ev){
    if(!drawing) return;
    if(ev.touches.length > 1) return; // 핀치/드래그 → 거리재기 안함

    var latlng = pointToLatLng(ev.touches[0].clientX, ev.touches[0].clientY);
    confirmPoint(latlng);
  }

  // 터치 끝 (동작 없음, 점 확정은 touchstart에서)
  function onTouchEnd(ev){
    if(!drawing) return;
    if(ev.changedTouches.length !== 1) return;
  }

  // ========= 공통 로직 =========
  function confirmPoint(pos){
    if(!clickLine){
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040',
        strokeOpacity: 1, strokeStyle: 'solid'
      });
    } else {
      var path = clickLine.getPath();
      var prev = path[path.length-1];
      path.push(pos);
      clickLine.setPath(path);

      var segDist = new kakao.maps.Polyline({path:[prev,pos]}).getLength();
      addDot(pos, segDist);
    }
  }

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

      // 이 세그먼트를 클릭하면 종료
      content.addEventListener('click', function(e){
        e.stopPropagation();
        finishMeasure(position);
      });

      distOverlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        xAnchor: 0, yAnchor: 0, // 좌상단 고정
        pixelOffset: new kakao.maps.Point(10, -10), // 선과 겹치지 않게
        zIndex: 2
      });
      distOverlay.setMap(map);
    }
    dots.push({circle:circle, distance:distOverlay});
  }

  function finishMeasure(pos){
    if(!clickLine) return;
    var totalLen = Math.round(clickLine.getLength());

    if(totalOverlay) totalOverlay.setMap(null);
    var box = document.createElement('div');
    box.className = 'totalBox';
    box.innerHTML = '총거리 ' + totalLen + ' m';

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: pos, content: box,
      xAnchor: 1, yAnchor: 1, // 오른쪽 아래
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
    if(moveLine){ moveLine.setMap(null); moveLine=null; }
    if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
    dots.forEach(d=>{
      if(d.circle) d.circle.setMap(null);
      if(d.distance) d.distance.setMap(null);
    });
    dots=[];
  }
})();
