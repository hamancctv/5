(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, dots = [], totalOverlay = null;

  var isTouchMode = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var el = map.getNode();

  btn.addEventListener('click', toggleMeasure);

  function toggleMeasure(){
    drawing = !drawing;
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      bindHandlers();
    } else {
      unbindHandlers();
      btn.classList.remove('active');
      map.setCursor('');
      resetMeasure();
    }
  }

  // 이벤트 바인딩
  function bindHandlers(){
    if(isTouchMode){
      el.addEventListener('touchstart', onTouchStart, {passive:false});
      el.addEventListener('touchmove',  onTouchMove,  {passive:false});
      el.addEventListener('touchend',   onTouchEnd,   {passive:false});
    } else {
      kakao.maps.event.addListener(map, 'click', onMouseClick);
      kakao.maps.event.addListener(map, 'mousemove', onMouseMove);
    }
  }

  function unbindHandlers(){
    if(isTouchMode){
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    } else {
      kakao.maps.event.removeListener(map, 'click', onMouseClick);
      kakao.maps.event.removeListener(map, 'mousemove', onMouseMove);
    }
  }

  // ========= PC =========
  function onMouseClick(e){
    if(!drawing) return;
    confirmPoint(e.latLng);
  }
  function onMouseMove(e){
    if(!drawing || !clickLine) return;
    updateMoveLine(e.latLng);
  }

  // ========= 모바일 =========
  var pointerDown = false;
  function onTouchStart(ev){
    if(!drawing) return;
    if(ev.touches.length > 1) return; // 두 손가락 이상 → 지도 동작만
    pointerDown = true;
    var latlng = pointToLatLng(ev.touches[0].clientX, ev.touches[0].clientY);
    if(!clickLine) confirmPoint(latlng);
    else updateMoveLine(latlng);
  }
  function onTouchMove(ev){
    if(!drawing || !clickLine || ev.touches.length > 1 || !pointerDown) return;
    var latlng = pointToLatLng(ev.touches[0].clientX, ev.touches[0].clientY);
    updateMoveLine(latlng);
  }
  function onTouchEnd(ev){
    if(!drawing || !clickLine) return;
    pointerDown = false;
    if(ev.changedTouches.length !== 1) return;
    var latlng = pointToLatLng(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY);
    confirmPoint(latlng);
  }

  // ========= 공통 로직 =========

  function pointToLatLng(clientX, clientY){
    var rect = el.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var proj = map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x, y));
  }

  function updateMoveLine(latlng){
    if(!moveLine){
      moveLine = new kakao.maps.Polyline({
        strokeWeight: 3, strokeColor: '#db4040',
        strokeOpacity: 0.5, strokeStyle: 'solid'
      });
    }
    var path = clickLine.getPath();
    moveLine.setPath([path[path.length-1], latlng]);
    moveLine.setMap(map);
  }

  function confirmPoint(pos){
    if(!clickLine){
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040',
        strokeOpacity: 1, strokeStyle: 'solid'
      });
      addDot(pos, null);
    } else {
      var path = clickLine.getPath();
      var prev = path[path.length-1];
      path.push(pos);
      clickLine.setPath(path);

      if(moveLine){ moveLine.setMap(null); moveLine=null; }

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
      content.className = 'dotOverlay';
      content.innerHTML = Math.round(segDist) + " m <span style='color:red;cursor:pointer'>✖</span>";

      // 종료 버튼
      content.querySelector('span').onclick = function(e){
        e.stopPropagation();
        finishMeasure(position);
      };

      distOverlay = new kakao.maps.CustomOverlay({
        position: position, yAnchor: 1, zIndex: 2, content: content
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
    box.className = 'distanceInfo';
    box.innerHTML = '총거리 <span class="number">'+totalLen+'</span>m <span class="closeBtn">X</span>';

    box.querySelector('.closeBtn').onclick = function(e){
      e.stopPropagation();
      resetMeasure();
      drawing = false;
      btn.classList.remove('active');
      map.setCursor('');
      unbindHandlers();
    };

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: pos, content: box,
      xAnchor: 0, yAnchor: 0, pixelOffset: new kakao.maps.Point(10,10)
    });

    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
    unbindHandlers();
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
