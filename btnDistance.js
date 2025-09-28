(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, lastPoint = null;
  var segOverlay = null, totalOverlay = null;
  var segCount = 0; // 구간 개수

  btn.addEventListener('click', toggleMeasure);

  function toggleMeasure(){
    drawing = !drawing;
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
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
      // 첫 점
      clickLine = new kakao.maps.Polyline({
        map: map, path:[pos],
        strokeWeight: 3, strokeColor:'#db4040',
        strokeOpacity: 1, strokeStyle:'solid'
      });
      addDot(pos);
      lastPoint = pos;
      segCount = 1;
      map.setDraggable(false);
      map.setZoomable(false);

    } else if(segCount === 1){
      // 두번째 점
      var path = clickLine.getPath();
      path.push(pos); clickLine.setPath(path);
      var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
      showSegBox("구간 "+Math.round(segDist)+" m", pos, false);
      addDot(pos);
      lastPoint = pos;
      segCount = 2;
      map.setDraggable(false);
      map.setZoomable(false);

    } else {
      // 세번째 점부터
      var path = clickLine.getPath();
      path.push(pos); clickLine.setPath(path);
      var segDist = new kakao.maps.Polyline({path:[lastPoint,pos]}).getLength();
      showSegBox("구간 "+Math.round(segDist)+" m", pos, true, function(){
        finishMeasure(pos);
      });
      addDot(pos);
      lastPoint = pos;
      segCount++;
      // 지도 자유 이동 허용
      map.setDraggable(true);
      map.setZoomable(true);
    }
  }

  // 점 표시
  function addDot(position){
    var circle = new kakao.maps.CustomOverlay({
      position: position,
      content: '<span style="width:8px;height:8px;background:#db4040;border:2px solid #fff;border-radius:50%;display:block;"></span>',
      zIndex:1
    });
    circle.setMap(map);
  }

  // 구간 박스 (왼쪽 위 고정, 클릭 시 종료 가능)
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

    segOverlay = new kakao.maps.CustomOverlay({
      map: map, position: map.getCenter(),
      content: box, xAnchor:0, yAnchor:0, 
      pixelOffset: new kakao.maps.Point(10,10), zIndex:3
    });
  }

  // 최종 종료
  function finishMeasure(pos){
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
    map.setDraggable(true);
    map.setZoomable(true);
  }

  function resetMeasure(){
    if(clickLine){ clickLine.setMap(null); clickLine=null; }
    if(moveLine){ moveLine.setMap(null); moveLine=null; }
    if(segOverlay){ segOverlay.setMap(null); segOverlay=null; }
    if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
    lastPoint=null; segCount=0;
  }
})();
