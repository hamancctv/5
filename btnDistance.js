// btnDistance.js (drop-in)
(function(){
  'use strict';

  // ---------- tiny helpers ----------
  function ready(fn){ 
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function waitFor(cond, done, opts){
    var n=0, int=opts?.interval||100, max=opts?.max||150; // ~15s
    var t=setInterval(function(){
      try{ if(cond()){ clearInterval(t); done(); } else if(++n>max){ clearInterval(t); console.error('[btnDistance] prerequisites not found'); } }
      catch(e){ clearInterval(t); console.error('[btnDistance]', e); }
    }, int);
  }

  // ---------- boot ----------
  ready(function(){
    waitFor(function(){
      return window.kakao && kakao.maps && document.getElementById('map') && document.getElementById('btnDistance') && window.map;
    }, init, {interval:100, max:200});
  });

  function init(){
    var mapObj = window.map;                       // 반드시 전역 map이 있어야 합니다.
    var mapEl  = document.getElementById('map');   // 컨테이너
    var btn    = document.getElementById('btnDistance');

    // state
    var drawing=false, clickLine=null, moveLine=null, dots=[], totalOverlay=null;
    var listeners = []; // kakao listener refs

    // bind
    btn.addEventListener('click', toggleMeasure);

    function toggleMeasure(){
      drawing = !drawing;
      if(drawing){
        btn.classList.add('active');
        mapObj.setCursor('crosshair');
        bindEvents();
      }else{
        btn.classList.remove('active');
        mapObj.setCursor('');
        unbindEvents();
        resetMeasure();           // 버튼 끄면 완전 초기화
      }
    }

    function bindEvents(){
      // PC: kakao 이벤트
      listeners.push(addKEvent(mapObj,'click', onMapClick));
      listeners.push(addKEvent(mapObj,'mousemove', onMapMouseMove));

      // 모바일/터치: 포인터 이벤트(PC도 동작, 지도 제스처 방해 안 함)
      mapEl.addEventListener('pointerdown', onPointerDown);
      mapEl.addEventListener('pointermove', onPointerMove);
      mapEl.addEventListener('pointerup',   onPointerUp);
    }
    function unbindEvents(){
      // kakao
      listeners.forEach(function(l){ kakao.maps.event.removeListener(l.target, l.type, l.handler); });
      listeners = [];
      // pointer
      mapEl.removeEventListener('pointerdown', onPointerDown);
      mapEl.removeEventListener('pointermove', onPointerMove);
      mapEl.removeEventListener('pointerup',   onPointerUp);
    }
    function addKEvent(target, type, handler){
      kakao.maps.event.addListener(target, type, handler);
      return {target, type, handler};
    }

    // ---------- coords helper ----------
    function pointToLatLng(clientX, clientY){
      var rect = mapEl.getBoundingClientRect();
      var p = new kakao.maps.Point(clientX - rect.left, clientY - rect.top);
      return mapObj.getProjection().coordsFromContainerPoint(p);
    }

    // ---------- PC (kakao) ----------
    function onMapClick(e){
      if(!drawing) return;
      confirmPoint(e.latLng);
    }
    function onMapMouseMove(e){
      if(!drawing || !clickLine) return;
      updateMoveLine(e.latLng);
    }

    // ---------- Pointer (모바일/PC 공통) ----------
    var isPointerDown = false;
    function onPointerDown(ev){
      if(!drawing) return;
      isPointerDown = true;
      var ll = pointToLatLng(ev.clientX, ev.clientY);
      if(!clickLine) confirmPoint(ll);       // 첫 점 확정
      else           updateMoveLine(ll);     // 임시선 끌기 시작
    }
    function onPointerMove(ev){
      if(!drawing || !clickLine || !isPointerDown) return;
      var ll = pointToLatLng(ev.clientX, ev.clientY);
      updateMoveLine(ll);
    }
    function onPointerUp(ev){
      if(!drawing || !clickLine) return;
      isPointerDown = false;
      var ll = pointToLatLng(ev.clientX, ev.clientY);
      confirmPoint(ll);                      // 손 뗀 위치 확정(세그먼트 표시)
    }

    // ---------- core drawing ----------
    function updateMoveLine(latLng){
      if(!moveLine){
        moveLine = new kakao.maps.Polyline({
          strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 0.5, strokeStyle: 'solid'
        });
      }
      var path = clickLine.getPath();
      moveLine.setPath([path[path.length-1], latLng]);
      moveLine.setMap(mapObj);
    }

    function confirmPoint(pos){
      if(!clickLine){
        clickLine = new kakao.maps.Polyline({
          map: mapObj, path: [pos],
          strokeWeight: 3, strokeColor: '#db4040', strokeOpacity: 1, strokeStyle: 'solid'
        });
        addDot(pos, null); // 시작점
      }else{
        var path = clickLine.getPath();
        var prev = path[path.length-1];
        path.push(pos);
        clickLine.setPath(path);

        if(moveLine){ moveLine.setMap(null); moveLine=null; }

        var segDist = new kakao.maps.Polyline({path:[prev,pos]}).getLength();
        addDot(pos, segDist); // 구간거리 말풍선
      }
    }

    // 점 + 세그먼트 말풍선
    function addDot(position, segDist){
      var circle = new kakao.maps.CustomOverlay({
        position: position,
        content: '<span class="dot" style="display:inline-block;width:8px;height:8px;background:#db4040;border-radius:50%;border:2px solid #fff;"></span>',
        zIndex: 2
      });
      circle.setMap(mapObj);

      var distOverlay = null;
      if(segDist != null){
        var el = document.createElement('div');
        el.className = 'dotOverlay';
        el.style.cssText = 'position:relative;background:#fffbe6;border:1px solid #999;border-radius:6px;font-size:12px;padding:3px 6px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,.2);';
        el.textContent = Math.round(segDist) + ' m';

        // 흰박스 클릭 → 측정 종료
        el.addEventListener('click', function(e){ e.stopPropagation(); finishMeasure(position); }, {passive:true});
        el.addEventListener('pointerdown', function(e){ e.stopPropagation(); }, {passive:true});

        distOverlay = new kakao.maps.CustomOverlay({
          position: position,
          yAnchor: 1,
          xAnchor: 0,                         // 왼쪽 위 느낌
          content: el,
          map: mapObj,
          // 화면 왼쪽 위 쪽으로 살짝
          pixelOffset: new kakao.maps.Point(-10, -10)
        });
      }

      dots.push({circle, distance: distOverlay});
    }

    function finishMeasure(pos){
      if(!clickLine) return;
      var totalLen = Math.round(clickLine.getLength());

      if(totalOverlay) totalOverlay.setMap(null);

      var box = document.createElement('div');
      box.className = 'distanceInfo';
      box.style.cssText = 'background:#fff;border:1px solid #333;border-radius:6px;font-size:13px;font-weight:bold;padding:5px 10px;white-space:nowrap;';
      box.innerHTML = '총거리 <span class="number">' + totalLen + '</span> m <span class="closeBtn" style="margin-left:6px;cursor:pointer;color:#db4040;font-weight:bold;">×</span>';

      box.querySelector('.closeBtn').addEventListener('click', function(e){
        e.stopPropagation();
        resetMeasure();          // 완전 초기화
        drawing = false;
        btn.classList.remove('active');
        mapObj.setCursor('');
        unbindEvents();
      });

      totalOverlay = new kakao.maps.CustomOverlay({
        map: mapObj, position: pos, content: box,
        xAnchor: 1, yAnchor: 1,                    // 오른쪽 아래
        pixelOffset: new kakao.maps.Point(10, 10)
      });

      // 종료: 선/점은 남기고(총거리 박스만 표시), 더 그리지는 않음
      drawing = false;
      btn.classList.remove('active');
      mapObj.setCursor('');
      unbindEvents();
    }

    function resetMeasure(){
      if(clickLine){ clickLine.setMap(null); clickLine=null; }
      if(moveLine){  moveLine.setMap(null);  moveLine=null; }
      if(totalOverlay){ totalOverlay.setMap(null); totalOverlay=null; }
      dots.forEach(function(d){
        if(d.circle)   d.circle.setMap(null);
        if(d.distance) d.distance.setMap(null);
      });
      dots = [];
    }
  }
})();
