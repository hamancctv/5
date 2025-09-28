(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null;
  var dots = [], totalOverlay = null, segmentOverlay = null;

  // 버튼 클릭 → 거리재기 모드 토글
  btn.addEventListener('click', function(){
    drawing = !drawing;
    if(drawing){
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      bindHandlers();
    } else {
      btn.classList.remove('active');
      map.setCursor('');
      unbindHandlers();
      resetMeasure();
    }
  });

  // 이벤트 바인딩
  function bindHandlers(){
    kakao.maps.event.addListener(map, 'click', onClick);
    kakao.maps.event.addListener(map, 'mousemove', onMove);
    // 모바일은 터치 이벤트를 그대로 지도에서 click/move로 변환하므로 추가 필요 없음
  }
  function unbindHandlers(){
    kakao.maps.event.removeListener(map, 'click', onClick);
    kakao.maps.event.removeListener(map, 'mousemove', onMove);
  }

  // 지도 클릭 → 점 확정
  function onClick(e){
    if(!drawing) return;
    confirmPoint(e.latLng);
  }

  // 마우스 이동 → 임시 선
  function onMove(e){
    if(!drawing || !clickLine) return;
    updateMoveLine(e.latLng);
  }

  // 선 업데이트
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
      // 시작점
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040',
        strokeOpacity: 1, strokeStyle: 'solid'
      });
      addDot(pos);
    } else {
      var path = clickLine.getPath();
      var prev = path[path.length-1];
      path.push(pos);
      clickLine.setPath(path);

      if(moveLine){ moveLine.setMap(null); moveLine = null; }

      var segDist = new kakao.maps.Polyline({path:[prev,pos]}).getLength();
      showSegment(segDist, pos);
      addDot(pos);
    }
  }

  // 점 표시
  function addDot(pos){
    var dot = new kakao.maps.CustomOverlay({
      position: pos, content: '<span class="dot"></span>', zIndex: 1
    });
    dot.setMap(map);
    dots.push(dot);
  }

  // 세그먼트 거리 박스 (왼쪽 위 고정)
  function showSegment(dist, pos){
    if(segmentOverlay) segmentOverlay.setMap(null);

    var content = document.createElement('div');
    content.className = 'dotOverlay';
    content.innerHTML = Math.round(dist) + " m (종료)";
    content.onclick = function(e){
      e.stopPropagation();
      finishMeasure(pos);
    };

    segmentOverlay = new kakao.maps.CustomOverlay({
      map: map, position: map.getCenter(),
      content: content, xAnchor: 0, yAnchor: 0,
      pixelOffset: new kakao.maps.Point(10,10)
    });
  }

  // 최종 거리 박스 (오른쪽 아래 고정)
  function finishMeasure(pos){
    if(!clickLine) return;
    var totalLen = Math.round(clickLine.getLength());

    if(totalOverlay) totalOverlay.setMap(null);

    var box = document.createElement('div');
    box.className = 'distanceInfo';
    box.innerHTML = '최종거리: <span class="number">'+totalLen+'</span> m ' +
                    '<span class="closeBtn">X</span>';

    box.querySelector('.closeBtn').onclick = function(e){
      e.stopPropagation();
      resetMeasure();
      drawing = false;
      btn.classList.remove('active');
      map.setCursor('');
      unbindHandlers();
    };

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: map.getCenter(),
      content: box, xAnchor: 1, yAnchor: 1,
      pixelOffset: new kakao.maps.Point(-10,-10)
    });

    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
    unbindHandlers();
  }

  // 초기화
  function resetMeasure(){
    if(clickLine){ clickLine.setMap(null); clickLine=null; }
    if(moveLine){ moveLine.setMap(null); moveLine=null; }
    if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
    if(segmentOverlay){ segmentOverlay.setMap(null); segmentOverlay=null; }
    dots.forEach(d=>d.setMap(null));
    dots = [];
  }
})();
