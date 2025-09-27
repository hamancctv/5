var btn = document.getElementById('btnDistance');
var drawing = false, moveLine = null, clickLine = null, dots = [], totalOverlay = null;

// 버튼 토글
btn.onclick = function(){
  drawing = !drawing;
  if (drawing) {
    resetMeasure();
    btn.classList.add('active');
    map.setCursor('crosshair');
  } else {
    resetMeasure();
    btn.classList.remove('active');
    map.setCursor('');
  }
};

// 📌 공통 "점 확정" 처리
function confirmPoint(pos) {
  if (!clickLine) {
    // 첫 점
    clickLine = new kakao.maps.Polyline({
      map: map, path: [pos],
      strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid'
    });
    moveLine = new kakao.maps.Polyline({
      strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid'
    });
    addDot(pos, null);
  } else {
    var path = clickLine.getPath();
    var prev = path[path.length - 1];
    path.push(pos);
    clickLine.setPath(path);

    var segDist = new kakao.maps.Polyline({path: [prev, pos]}).getLength();
    addDot(pos, segDist);
  }
}

// 📌 이동 처리
function handleMove(e) {
  if (!drawing || !clickLine) return;
  var path = clickLine.getPath();
  moveLine.setPath([path[path.length-1], e.latLng]);
  moveLine.setMap(map);
}

// 📌 PC: 마우스 이벤트
kakao.maps.event.addListener(map, 'mousemove', handleMove);
kakao.maps.event.addListener(map, 'click', function(e){
  if (!drawing) return;
  confirmPoint(e.latLng);
});

// 📌 모바일: 터치 이벤트
kakao.maps.event.addListener(map, 'touchmove', handleMove);
kakao.maps.event.addListener(map, 'touchend', function(e){
  if (!drawing) return;
  confirmPoint(e.latLng);
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

    // 📌 말풍선 클릭 → 종료
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
  var path = clickLine.getPath();
  if (path.length < 2) return;

  // 마지막 점 제거
  var lastDot = dots[dots.length - 1];
  if (lastDot) {
    if (lastDot.circle) lastDot.circle.setMap(null);
    if (lastDot.distance) lastDot.distance.setMap(null);
    dots.pop();
  }
  path.pop();
  clickLine.setPath(path);

  if (moveLine) { moveLine.setMap(null); moveLine = null; }

  var totalLen = Math.round(clickLine.getLength());

  if (totalOverlay) totalOverlay.setMap(null);
  var box = document.createElement('div');
  box.className = 'distanceInfo';
  box.innerHTML = '총거리 <span class="number">' + totalLen + '</span>m <span class="closeBtn">X</span>';

  box.querySelector('.closeBtn').onclick = function(e){
    e.stopPropagation();
    resetMeasure();
    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
  };

  totalOverlay = new kakao.maps.CustomOverlay({
    map: map, position: pos, content: box,
    xAnchor: 0, yAnchor: 0, pixelOffset: new kakao.maps.Point(10, 10)
  });

  drawing = false;
  btn.classList.remove('active');
  map.setCursor('');
}

// 초기화
function resetMeasure(){
  if (clickLine) { clickLine.setMap(null); clickLine = null; }
  if (moveLine) { moveLine.setMap(null); moveLine = null; }
  if (totalOverlay) { totalOverlay.setMap(null); totalOverlay = null; }
  dots.forEach(function(d){
    if (d.circle) d.circle.setMap(null);
    if (d.distance) d.distance.setMap(null);
  });
  dots = [];
}
