var btn = document.getElementById('btnDistance');
var drawing = false, moveLine = null, clickLine = null, dots = [], totalOverlay = null;

// 버튼 클릭
btn.onclick = function(){
  drawing = !drawing;
  if(drawing){
    resetMeasure();
    btn.classList.add('active');
    map.setCursor('crosshair');
    if(isMobile()) disableSingleTouchDrag(); // 모바일: 한 손 드래그 제한
  }else{
    resetMeasure();
    btn.classList.remove('active');
    map.setCursor('');
    if(isMobile()) enableAllDrag(); // 모바일: 초기화
  }
};

// 지도 클릭 → 점 추가
kakao.maps.event.addListener(map,'click',function(e){
  if (!drawing) return;
  var pos = e.latLng;

  if (!clickLine) {
    clickLine = new kakao.maps.Polyline({
      map: map, path: [pos],
      strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid'
    });
    moveLine = new kakao.maps.Polyline({
      strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid'
    });
    addDot(pos, null); // 첫 점
  } else {
    var path = clickLine.getPath();
    var prev = path[path.length - 1];
    path.push(pos);
    clickLine.setPath(path);

    var segDist = new kakao.maps.Polyline({path: [prev, pos]}).getLength();
    addDot(pos, segDist);
  }
});

// 마우스 이동 → 임시선
kakao.maps.event.addListener(map,'mousemove',function(e){
  if (!drawing || !clickLine) return;
  var path = clickLine.getPath();
  moveLine.setPath([path[path.length - 1], e.latLng]);
  moveLine.setMap(map);
});

// 점 + 세그먼트 오버레이
function addDot(position, segDist){
  var circle = new kakao.maps.CustomOverlay({
    position: position, content: '<span class="dot"></span>', zIndex: 1
  });
  circle.setMap(map);

  var distOverlay = null;
  if (segDist) {
    var content = document.createElement('div');
    content.className = 'dotOverlay';
    content.innerText = Math.round(segDist) + " m";

    distOverlay = new kakao.maps.CustomOverlay({
      position: position, yAnchor: 1, zIndex: 2, content: content
    });
    distOverlay.setMap(map);

    // 클릭 → 종료
    content.addEventListener('click', function(evt){
      evt.stopPropagation();
      finishMeasure(position);
    });
  }
  dots.push({circle: circle, distance: distOverlay});
}

// 종료 처리
function finishMeasure(pos){
  if (!clickLine) return;
  var totalLen = Math.round(clickLine.getLength());

  if (totalOverlay) totalOverlay.setMap(null);
  var box = document.createElement('div');
  box.className = 'distanceInfo';
  box.innerHTML = '총거리 <span class="number">' + totalLen + '</span> m <span class="closeBtn">X</span>';

  box.querySelector('.closeBtn').onclick = function(e){
    e.stopPropagation();
    resetMeasure();
    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
    if(isMobile()) enableAllDrag();
  };

  totalOverlay = new kakao.maps.CustomOverlay({
    map: map, position: pos, content: box,
    xAnchor: 0, yAnchor: 0, pixelOffset: new kakao.maps.Point(10, 10)
  });

  if(moveLine){ moveLine.setMap(null); moveLine = null; }
}

// 초기화
function resetMeasure(){
  if(clickLine){ clickLine.setMap(null); clickLine=null; }
  if(moveLine){ moveLine.setMap(null); moveLine=null; }
  if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
  dots.forEach(function(d){
    if(d.circle) d.circle.setMap(null);
    if(d.distance) d.distance.setMap(null);
  });
  dots=[];
}

// ===== 모바일 제어 =====
function isMobile(){
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// 모바일: 한 손 드래그 제한 (핀치/두 손 허용)
function disableSingleTouchDrag(){
  map.setDraggable(false); 
  map.setZoomable(false);
  document.getElementById('map').addEventListener('touchmove', allowMultiTouch, {passive:false});
}

function allowMultiTouch(e){
  if(e.touches.length >= 2){
    map.setDraggable(true);
    map.setZoomable(true);
  } else {
    map.setDraggable(false);
    map.setZoomable(false);
  }
}

function enableAllDrag(){
  map.setDraggable(true);
  map.setZoomable(true);
  document.getElementById('map').removeEventListener('touchmove', allowMultiTouch);
}
