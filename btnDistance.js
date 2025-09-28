(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, lastPos = null;
  var segOverlay = null, totalOverlay = null;

  // 지도 초기화
  var map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(35.2723, 128.4065), // 함안군 중심
    level: 6
  });

  btn.addEventListener('click', toggleMeasure);

  function toggleMeasure(){
    drawing = !drawing;
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      bindHandlers();
    } else {
      resetMeasure();
      btn.classList.remove('active');
      map.setCursor('');
      unbindHandlers();
    }
  }

  function bindHandlers(){
    var el = map.getNode();
    el.addEventListener('touchstart', onTouchStart, {passive:false});
    el.addEventListener('touchmove',  onTouchMove,  {passive:false});
    el.addEventListener('touchend',   onTouchEnd,   {passive:false});
  }
  function unbindHandlers(){
    var el = map.getNode();
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove',  onTouchMove);
    el.removeEventListener('touchend',   onTouchEnd);
  }

  function pointToLatLng(x,y){
    var rect = map.getNode().getBoundingClientRect();
    var proj = map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x-rect.left, y-rect.top));
  }

  var dragging = false;
  function onTouchStart(e){
    if(!drawing) return;
    e.preventDefault();
    dragging = true;
    var t = e.touches[0];
    var pos = pointToLatLng(t.clientX, t.clientY);

    if(!clickLine){
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1
      });
    }
    lastPos = pos;
  }

  function onTouchMove(e){
    if(!drawing || !clickLine || !dragging) return;
    e.preventDefault();
    var t = e.touches[0];
    var pos = pointToLatLng(t.clientX, t.clientY);

    if(!moveLine){
      moveLine = new kakao.maps.Polyline({
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5
      });
    }
    moveLine.setPath([lastPos, pos]);
    moveLine.setMap(map);

    var dist = Math.round(new kakao.maps.Polyline({path:[lastPos,pos]}).getLength());

    // 세그먼트 오버레이 갱신
    if(segOverlay) segOverlay.setMap(null);
    segOverlay = new kakao.maps.CustomOverlay({
      content: '<div class="dotOverlay">세그먼트: '+dist+'m</div>',
      position: pos,
      xAnchor: 0, yAnchor: 1,  // 왼쪽 위로 치우침
      yAnchor: 1,
      zIndex: 3
    });
    segOverlay.setMap(map);
  }

  function onTouchEnd(e){
    if(!drawing || !clickLine) return;
    e.preventDefault();
    dragging = false;
    var t = e.changedTouches[0];
    var pos = pointToLatLng(t.clientX, t.clientY);

    var path = clickLine.getPath();
    path.push(pos);
    clickLine.setPath(path);

    if(moveLine){ moveLine.setMap(null); moveLine = null; }

    var segDist = Math.round(new kakao.maps.Polyline({path:[lastPos,pos]}).getLength());
    if(segOverlay) segOverlay.setMap(null);

    segOverlay = new kakao.maps.CustomOverlay({
      content: '<div class="dotOverlay">'+segDist+'m</div>',
      position: pos,
      xAnchor: 0, yAnchor: 1,
      zIndex: 3
    });
    segOverlay.setMap(map);

    // 오버레이 클릭 시 종료
    kakao.maps.event.addListener(segOverlay, 'click', function(){
      finishMeasure(pos);
    });

    lastPos = pos;
  }

  function finishMeasure(pos){
    if(!clickLine) return;
    var totalLen = Math.round(clickLine.getLength());

    if(totalOverlay) totalOverlay.setMap(null);
    totalOverlay = new kakao.maps.CustomOverlay({
      content: '<div class="distanceInfo">최종거리: '+totalLen+'m <span class="closeBtn">X</span></div>',
      position: pos,
      xAnchor: 0, yAnchor: 0,
      zIndex: 3,
      map: map
    });

    // X 버튼 클릭 → 초기화
    var closeBtn = totalOverlay.getContent().querySelector('.closeBtn');
    closeBtn.addEventListener('click', function(e){
      e.stopPropagation();
      resetMeasure();
      drawing=false;
      btn.classList.remove('active');
      map.setCursor('');
      unbindHandlers();
    });

    drawing=false;
    btn.classList.remove('active');
    map.setCursor('');
    unbindHandlers();
  }

  function resetMeasure(){
    if(clickLine){ clickLine.setMap(null); clickLine=null; }
    if(moveLine){ moveLine.setMap(null); moveLine=null; }
    if(segOverlay){ segOverlay.setMap(null); segOverlay=null; }
    if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
    lastPos=null;
  }
})();
