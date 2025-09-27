(function () {
  'use strict';

  var btn = document.getElementById('btnDistance');
  var container = document.getElementById('map');

  if (!btn || !container || !window.kakao || !window.map) {
    console.warn('btnDistance.js: btn/map/kakao를 찾을 수 없습니다.');
    return;
  }

  var drawing = false;
  var gestureMode = false;            // 두 손가락 제스처 중인지
  var clickLine = null;               // 확정된 폴리라인
  var moveLine = null;                // 미리보기 폴리라인
  var dots = [];                      // [{circle: CustomOverlay, distance: CustomOverlay|null}, ...]
  var totalOverlay = null;
  var isTouch = ('ontouchstart' in window);

  // ====== 유틸: 터치 client 좌표 -> 컨테이너 좌표 -> LatLng 변환 ======
  function clientToContainerXY(clientX, clientY) {
    var r = container.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }
  function latLngFromClientXY(clientX, clientY) {
    var p = clientToContainerXY(clientX, clientY);
    return map.getProjection().coordsFromContainerPoint(new kakao.maps.Point(p.x, p.y));
  }

  // ====== 버튼 토글 ======
  btn.addEventListener('click', function () {
    drawing = !drawing;
    if (drawing) {
      resetMeasure();
      btn.classList.add('active');
      map.setCursor('crosshair');
      bind();
    } else {
      unbind();
      btn.classList.remove('active');
      map.setCursor('');
      resetMeasure();
    }
  });

  // ====== PC: 마우스 ======
  function onMapClick(e) {
    if (!drawing) return;
    addOrExtend(e.latLng);
  }
  function onMapMove(e) {
    if (!drawing || !clickLine) return;
    var path = clickLine.getPath();
    moveLine.setPath([path[path.length - 1], e.latLng]);
    moveLine.setMap(map);
  }

  // ====== 모바일: 터치 ======
  function onTouchStart(ev) {
    if (!drawing) return;

    if (ev.touches.length >= 2) {
      // 두 손가락 제스처(핀치/두손 드래그) → 지도 조작 허용
      gestureMode = true;
      map.setDraggable(true);
      return;
    }

    // 한 손가락 측정 시작/연장
    gestureMode = false;
    map.setDraggable(false);          // 한 손가락 드래그로 지도 이동 방지
    ev.preventDefault();

    var t = ev.touches[0];
    var pos = latLngFromClientXY(t.clientX, t.clientY);

    if (!clickLine) {
      clickLine = new kakao.maps.Polyline({
        map: map, path: [pos],
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid'
      });
      moveLine = new kakao.maps.Polyline({
        strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid'
      });
      addDot(pos, null);
    } else {
      previewTo(pos);
    }
  }

  function onTouchMove(ev) {
    if (!drawing || !clickLine) return;

    if (gestureMode) {
      // 핀치/두손 드래그 중에는 지도 조작만
      return;
    }

    if (ev.touches.length !== 1) return;

    ev.preventDefault();
    var t = ev.touches[0];
    var pos = latLngFromClientXY(t.clientX, t.clientY);
    previewTo(pos);
  }

  function onTouchEnd(ev) {
    if (!drawing || !clickLine) return;

    if (gestureMode) {
      // 제스처가 끝났다면 한 손가락 모드로 복귀
      if (ev.touches.length === 0) {
        gestureMode = false;
        map.setDraggable(false);
      }
      return;
    }

    ev.preventDefault();
    var t = ev.changedTouches[0];
    var pos = latLngFromClientXY(t.clientX, t.clientY);
    addOrExtend(pos);
  }

  // ====== 공통 로직 ======
  function previewTo(pos) {
    var path = clickLine.getPath();
    moveLine.setPath([path[path.length - 1], pos]);
    moveLine.setMap(map);
  }

  function addOrExtend(pos) {
    if (!clickLine) {
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

      var segDist = new kakao.maps.Polyline({ path: [prev, pos] }).getLength();
      addDot(pos, segDist);
    }
  }

  function addDot(position, segDist) {
    var circle = new kakao.maps.CustomOverlay({
      position: position, content: '<span class="dot"></span>', zIndex: 3
    });
    circle.setMap(map);

    var distOverlay = null;
    if (segDist) {
      var el = document.createElement('div');
      el.className = 'dotOverlay';
      el.innerText = Math.round(segDist) + ' m';

      distOverlay = new kakao.maps.CustomOverlay({
        position: position, yAnchor: 1, zIndex: 4, content: el
      });
      distOverlay.setMap(map);

      var finish = function (evt) {
        evt.stopPropagation();
        finishMeasure(position);
      };
      el.addEventListener('click', finish);
      el.addEventListener('touchend', finish, { passive: false });
    }
    dots.push({ circle: circle, distance: distOverlay });
  }

  function finishMeasure(pos) {
    if (!clickLine) return;

    var path = clickLine.getPath();
    if (path.length < 2) return;

    // 진행 중 라벨 제거(마지막 점/세그먼트는 총거리에서 제외)
    var last = dots[dots.length - 1];
    if (last) {
      if (last.circle) last.circle.setMap(null);
      if (last.distance) last.distance.setMap(null);
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

    box.querySelector('.closeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      resetMeasure();
      drawing = false;
      btn.classList.remove('active');
      map.setCursor('');
      map.setDraggable(true);
      unbind();
    });

    totalOverlay = new kakao.maps.CustomOverlay({
      map: map, position: pos, content: box,
      xAnchor: 0, yAnchor: 0, pixelOffset: new kakao.maps.Point(10, 10), zIndex: 5
    });

    // 종료 상태로 전환
    drawing = false;
    btn.classList.remove('active');
    map.setCursor('');
    map.setDraggable(true);
    unbind();
  }

  function resetMeasure() {
    if (clickLine) { clickLine.setMap(null); clickLine = null; }
    if (moveLine) { moveLine.setMap(null); moveLine = null; }
    if (totalOverlay) { totalOverlay.setMap(null); totalOverlay = null; }
    dots.forEach(function (d) {
      if (d.circle) d.circle.setMap(null);
      if (d.distance) d.distance.setMap(null);
    });
    dots = [];
  }

  function bind() {
    if (isTouch) {
      container.addEventListener('touchstart', onTouchStart, { passive: false });
      container.addEventListener('touchmove', onTouchMove, { passive: false });
      container.addEventListener('touchend', onTouchEnd, { passive: false });
    } else {
      kakao.maps.event.addListener(map, 'click', onMapClick);
      kakao.maps.event.addListener(map, 'mousemove', onMapMove);
    }
  }

  function unbind() {
    if (isTouch) {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    } else {
      kakao.maps.event.removeListener(map, 'click', onMapClick);
      kakao.maps.event.removeListener(map, 'mousemove', onMapMove);
    }
  }
})();
