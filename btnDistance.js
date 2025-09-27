// ===== 모바일 우선 거리재기 (PC도 동작) =====
// map, mapContainer(#map) 전역이 이미 존재해야 합니다.
(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, dots = [], totalOverlay = null;
  var isTouchMode = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  btn.addEventListener('click', toggleMeasure);

  function toggleMeasure(){
    drawing = !drawing;
    window.__distanceMode = drawing; // 다른 핸들러에서 참조(가드용)
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      map.setDraggable(false);
      map.setZoomable(false);
      bindInputHandlers();
    }else{
      unbindInputHandlers();
      btn.classList.remove('active');
      map.setCursor('');
      map.setDraggable(true);
      map.setZoomable(true);
      resetMeasure();
    }
  }

  function bindInputHandlers(){
    if(isTouchMode){
      var el = mapContainer; // document.getElementById('map');
      el.addEventListener('touchstart', onTouchStart, {passive:false});
      el.addEventListener('touchmove',  onTouchMove,  {passive:false});
      el.addEventListener('touchend',   onTouchEnd,   {passive:false});
    }else{
      kakao.maps.event.addListener(map, 'mousemove', onMouseMove);
      kakao.maps.event.addListener(map, 'click', onMouseClick);
    }
  }
  function unbindInputHandlers(){
    if(isTouchMode){
      var el = mapContainer;
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    }else{
      kakao.maps.event.removeListener(map, 'mousemove', onMouseMove);
      kakao.maps.event.removeListener(map, 'click', onMouseClick);
    }
  }

  // 컨테이너 좌표 -> 위경도
  function pointToLatLng(clientX, clientY){
    var rect = mapContainer.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var proj = map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x, y));
  }

  // PC
  function onMouseClick(e){ if(!drawing) return; confirmPoint(e.latLng); }
  function onMouseMove(e){ if(!drawing || !clickLine) return; updateMoveLine(e.latLng); }

  // 모바일
  var touchStartLatLng = null;
  function onTouchStart(ev){
    if(!drawing) return;
    ev.preventDefault();
    var t = ev.touches[0];
    touchStartLatLng = pointToLatLng(t.clientX, t.clientY);
    if(!clickLine) confirmPoint(touchStartLatLng); // 첫 점 즉시 확정
    else updateMoveLine(touchStartLatLng);         // 기존 마지막 점에서 임시선 시작
  }
  function onTouchMove(ev){
    if(!drawing || !clickLine) return;
    ev.preventDefault();
    var t = ev.touches[0];
    var ll = pointToLatLng(t.clientX, t.clientY);
    updateMoveLine(ll);
  }
  function onTouchEnd(ev){
    if(!drawing || !clickLine) return;
    ev.preventDefault();
    var t = (ev.changedTouches && ev.changedTouches[0]) ? ev.changedTouches[0] : (ev.touches[0] || null);
    if(!t) return;
    var ll = pointToLatLng(t.clientX, t.clientY);
    confirmPoint(ll); // 손 뗀 위치 확정 → 구간거리 표시
  }

  function updateMoveLine(latLng){
    if(!moveLine){
      moveLine = new kakao.maps.Polyline({
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid'
      });
    }
    var path = clickLine.getPath();
    moveLine.setPath([path[path.length-1], latLng]);
    moveLine.setMap(map);
  }

  function confirmPoint(pos){
    if (!clickLine) {
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid'
      });
      addDot(pos, null); // 시작점
    } else {
      var path = clickLine.getPath();
      var prev = path[path.length - 1];
      path.push(pos);
      clickLine.setPath(path);

      if (moveLine) { moveLine.setMap(null); moveLine = null; } // 임시선 정리

      var segDist = new kakao.maps.Polyline({path: [prev, pos]}).getLength();
      addDot(pos, segDist); // 구간 거리 말풍선
    }
  }

  // 점/말풍선
  function addDot(position, segDist){
    var circle = new kakao.maps.CustomOverlay({
      position: position, content: '<span class="dot"></span>', zIndex: 1
    });
    circle.setMap(map);

    var distOverlay = null;
    if (segDist != null) {
      var content = document.createElement('div');
      content.className = 'dotOverlay';
      content.innerText = Math.round(segDist) + " m";

      // 말풍선 누르면 종료 (모바일/PC 모두)
      var endFn = function(evt){ evt.stopPropagation(); evt.preventDefault && evt.preventDefault(); finishMeasure(position); };
      content.addEventListener('click', endFn);
      content.addEventListener('touchstart', endFn, {passive:false});

      distOverlay = new kakao.maps.CustomOverlay({
        position: position, yAnchor: 1, zIndex: 2, content: content
      });
      distOverlay.setMap(map);
    }
    dots.push({circle: circle, distance: distOverlay});
  }

  function finishMeasure(pos){
    if (!clickLine) return;
    var totalLen = Math.round(clickLine.getLength());

    if (totalOverlay) totalOverlay.setMap(null);
    var box = document.createElement('div');
    box.className = 'distanceInfo';
    box.innerHTML = '총거리 <span class="number">' + totalLen + '</span>m <span class="closeBtn">X</span>';

    var closeFn = function(e){
      e.stopPropagation();
      resetMeasure();
      drawing = false;
      window.__distanceMode = false;
      btn.classList.remove('active');
      map.setCursor('');
      map.setDraggable(true);
      map.setZoomable(true);
      unbindInputHandlers();
    };
    box.querySelector('.closeBtn').addEventListener('click', closeFn);

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: pos, content: box,
      xAnchor: 0, yAnchor: 0, pixelOffset: new kakao.maps.Point(10, 10)
    });

    // 조작 종료(선/점은 남김)
    drawing = false;
    window.__distanceMode = false;
    btn.classList.remove('active');
    map.setCursor('');
    map.setDraggable(true);
    map.setZoomable(true);
    unbindInputHandlers();
  }

  function resetMeasure(){
    if (clickLine) { clickLine.setMap(null); clickLine = null; }
    if (moveLine)  { moveLine.setMap(null);  moveLine  = null; }
    if (totalOverlay){ totalOverlay.setMap(null); totalOverlay = null; }
    dots.forEach(function(d){
      if (d.circle)   d.circle.setMap(null);
      if (d.distance) d.distance.setMap(null);
    });
    dots = [];
  }
})();
