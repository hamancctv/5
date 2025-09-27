(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null, dots = [], totalOverlay = null;

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

  function bindHandlers(){
    var el = map.getNode(); // 지도 DIV 가져오기
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
  }

  function unbindHandlers(){
    var el = map.getNode();
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
  }

  // 좌표 변환
  function pointToLatLng(clientX, clientY){
    var rect = map.getNode().getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var proj = map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x, y));
  }

  // 포인터 이벤트
  var pointerDown = false;
  function onPointerDown(e){
    if(!drawing) return;
    pointerDown = true;
    var latlng = pointToLatLng(e.clientX, e.clientY);
    if(!clickLine) confirmPoint(latlng); 
    else updateMoveLine(latlng);
  }
  function onPointerMove(e){
    if(!drawing || !clickLine || !pointerDown) return;
    var latlng = pointToLatLng(e.clientX, e.clientY);
    updateMoveLine(latlng);
  }
  function onPointerUp(e){
    if(!drawing || !clickLine) return;
    pointerDown = false;
    var latlng = pointToLatLng(e.clientX, e.clientY);
    confirmPoint(latlng); // 손 뗀 위치 확정
  }

  // 임시선
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

  // 점 확정
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

      if(moveLine){ moveLine.setMap(null); moveLine = null; }

      var segDist = new kakao.maps.Polyline({path:[prev,pos]}).getLength();
      addDot(pos, segDist);
    }
  }

  // 점 + 말풍선
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

      // 흰박스(X) 클릭 → 종료
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

  // 종료
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
