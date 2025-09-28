(function(){
  var btn = document.getElementById('btnDistance');
  var drawing = false, clickLine = null, moveLine = null;
  var dots = [], totalOverlay = null;
  var isTouchMode = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

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
    if(isTouchMode){
      var el = map.getNode();
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
      var el = map.getNode();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    } else {
      kakao.maps.event.removeListener(map, 'click', onMouseClick);
      kakao.maps.event.removeListener(map, 'mousemove', onMouseMove);
    }
  }

  // ============ 공통 ============
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

  // 점 + 구간거리 (공통)
  function addDot(position, segDist){
    var circle = new kakao.maps.CustomOverlay({
      position: position, content:'<span class="dot"></span>', zIndex:1
    });
    circle.setMap(map);

    var distOverlay = null;
    if(segDist!=null){
      var content = document.createElement('div');
      content.className='dotOverlay';
      content.innerText=Math.round(segDist)+" m";

      // 모바일 → 클릭 시 종료
      if(isTouchMode){
        content.addEventListener('click', function(e){
          e.stopPropagation();
          finishMeasure(position);
        });
      }

      distOverlay=new kakao.maps.CustomOverlay({
        position:position, yAnchor:1, zIndex:2, content:content
      });
      distOverlay.setMap(map);
    }
    dots.push({circle:circle,distance:distOverlay});
  }

  function finishMeasure(pos){
    if(!clickLine) return;
    var totalLen=Math.round(clickLine.getLength());

    if(totalOverlay) totalOverlay.setMap(null);
    var box=document.createElement('div');
    box.className='distanceInfo';

    if(isTouchMode){
      // 모바일 → “최종거리” 고정 오버레이
      box.innerHTML='최종거리: '+totalLen+'m';
    } else {
      // PC → “총거리” + 엑스버튼
      box.innerHTML='총거리 <span class="number">'+totalLen+'</span>m <span class="closeBtn">X</span>';
      box.querySelector('.closeBtn').onclick=function(e){
        e.stopPropagation();
        resetMeasure();
        drawing=false;
        btn.classList.remove('active');
        map.setCursor('');
        unbindHandlers();
      };
    }

    totalOverlay=new kakao.maps.CustomOverlay({
      map:map, position:pos, content:box,
      xAnchor: isTouchMode?1:0, yAnchor: isTouchMode?1:0,
      pixelOffset: isTouchMode?new kakao.maps.Point(-10,-10):new kakao.maps.Point(10,10)
    });

    drawing=false;
    btn.classList.remove('active');
    map.setCursor('');
    unbindHandlers();
  }

  // ============ PC 모드 ============
  function onMouseClick(e){
    if(!drawing) return;
    confirmPoint(e.latLng);
  }
  function onMouseMove(e){
    if(!drawing || !clickLine) return;
    var path=clickLine.getPath();
    if(!moveLine){
      moveLine=new kakao.maps.Polyline({
        strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5, strokeStyle:'solid'
      });
    }
    moveLine.setPath([path[path.length-1], e.latLng]);
    moveLine.setMap(map);
  }

  // ============ 모바일 모드 ============
  var pointerDown=false;
  function pointToLatLng(x,y){
    var rect=map.getNode().getBoundingClientRect();
    var proj=map.getProjection();
    return proj.coordsFromContainerPoint(new kakao.maps.Point(x-rect.left,y-rect.top));
  }

  function onTouchStart(ev){
    if(!drawing) return;
    ev.preventDefault();
    pointerDown=true;
    var ll=pointToLatLng(ev.touches[0].clientX, ev.touches[0].clientY);
    if(!clickLine) confirmPoint(ll);
  }
  function onTouchMove(ev){
    if(!drawing || !clickLine || !pointerDown) return;
    ev.preventDefault();
    var ll=pointToLatLng(ev.touches[0].clientX, ev.touches[0].clientY);
    updateMoveLine(ll);
  }
  function onTouchEnd(ev){
    if(!drawing || !clickLine) return;
    pointerDown=false;
    ev.preventDefault();
    var ll=pointToLatLng(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY);
    confirmPoint(ll);
  }

  function updateMoveLine(ll){
    if(!moveLine){
      moveLine=new kakao.maps.Polyline({
        strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5, strokeStyle:'solid'
      });
    }
    var path=clickLine.getPath();
    moveLine.setPath([path[path.length-1], ll]);
    moveLine.setMap(map);
  }

  // ============ 공통 점 확정 ============
  function confirmPoint(pos){
    if(!clickLine){
      clickLine=new kakao.maps.Polyline({
        map:map, path:[pos],
        strokeWeight:3, strokeColor:'#db4040', strokeOpacity:1, strokeStyle:'solid'
      });
      addDot(pos,null);
    } else {
      var path=clickLine.getPath();
      var prev=path[path.length-1];
      path.push(pos);
      clickLine.setPath(path);

      if(moveLine){ moveLine.setMap(null); moveLine=null; }

      var segDist=new kakao.maps.Polyline({path:[prev,pos]}).getLength();
      addDot(pos,segDist);
    }
  }
})();
