<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>카카오맵 거리재기 (PC+모바일)</title>
  <style>
    html, body, #map {width:100%; height:100%; margin:0; padding:0;}
    #btnDistance {
      position:absolute; top:10px; left:10px; z-index:1000;
      padding:6px 12px; background:#fff; border:1px solid #666; border-radius:4px;
      cursor:pointer; font-size:14px; font-weight:bold;
    }
    #btnDistance.active { background:#db4040; color:#fff; }

    .dot {
      overflow:hidden; float:left; width:8px; height:8px;
      background:#db4040; border-radius:50%; border:2px solid #fff;
    }
    .dotOverlay {
      position: relative;
      bottom: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
      background: #fffbe6;
      padding: 4px 8px;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .dotOverlay:after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -6px;
      margin-left: -6px;
      border-width: 6px 6px 0;
      border-style: solid;
      border-color: #fffbe6 transparent;
    }
    .dotOverlay:before {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -7px;
      margin-left: -7px;
      border-width: 7px 7px 0;
      border-style: solid;
      border-color: #ccc transparent;
    }
    .distanceInfo {
      border-radius: 6px;
      border: 1px solid #333;
      background: #fff;
      padding: 6px 10px;
      font-size: 13px;
      font-weight: bold;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .distanceInfo .closeBtn {
      margin-left: 8px;
      color: #db4040;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
  <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APPKEY"></script>
</head>
<body>
  <button id="btnDistance">거리재기</button>
  <div id="map"></div>

<script>
var map = new kakao.maps.Map(document.getElementById('map'), {
  center: new kakao.maps.LatLng(37.5665, 126.9780),
  level: 5
});

var btn = document.getElementById('btnDistance');
var drawing = false, moveLine = null, clickLine = null, dots = [], totalOverlay = null;
var isTouchMode = 'ontouchstart' in window;

// ---------------- 거리 버튼 ----------------
btn.onclick = function(){
  drawing = !drawing;
  if(drawing){
    resetMeasure();
    btn.classList.add('active');
    map.setCursor('crosshair');
    bindInputHandlers();
  }else{
    unbindInputHandlers();
    btn.classList.remove('active');
    map.setCursor('');
    resetMeasure();
  }
};

// ---------------- PC 모드 ----------------
function onMapClick(e){
  if(!drawing) return;
  var pos = e.latLng;
  if(!clickLine){
    clickLine=new kakao.maps.Polyline({
      map:map, path:[pos],
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:1, strokeStyle:'solid'
    });
    moveLine=new kakao.maps.Polyline({
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5, strokeStyle:'solid'
    });
    addDot(pos,null);
  }else{
    var path=clickLine.getPath();
    var prev=path[path.length-1];
    path.push(pos);
    clickLine.setPath(path);
    var segDist=new kakao.maps.Polyline({path:[prev,pos]}).getLength();
    addDot(pos,segDist);
  }
}
function onMapMove(e){
  if(!drawing||!clickLine) return;
  var path=clickLine.getPath();
  moveLine.setPath([path[path.length-1],e.latLng]);
  moveLine.setMap(map);
}

// ---------------- 모바일 모드 ----------------
function pointToLatLng(x,y){
  var proj = map.getProjection();
  return proj.coordsFromContainerPoint(new kakao.maps.Point(x,y));
}
function onTouchStart(ev){
  if(!drawing) return;
  if(ev.touches.length>1) return; // 두 손가락 → 지도 이동/줌 허용
  ev.preventDefault();
  var t=ev.touches[0];
  var ll=pointToLatLng(t.clientX,t.clientY);
  if(!clickLine){
    clickLine=new kakao.maps.Polyline({
      map:map, path:[ll],
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:1, strokeStyle:'solid'
    });
    moveLine=new kakao.maps.Polyline({
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5, strokeStyle:'solid'
    });
    addDot(ll,null);
  }else{
    updateMoveLine(ll);
  }
}
function onTouchMove(ev){
  if(!drawing||!clickLine) return;
  if(ev.touches.length>1) return;
  ev.preventDefault();
  var t=ev.touches[0];
  var ll=pointToLatLng(t.clientX,t.clientY);
  updateMoveLine(ll);
}
function onTouchEnd(ev){
  if(!drawing||!clickLine) return;
  if(ev.changedTouches.length>1) return;
  ev.preventDefault();
  var t=ev.changedTouches[0];
  var ll=pointToLatLng(t.clientX,t.clientY);

  var path=clickLine.getPath();
  var prev=path[path.length-1];
  path.push(ll);
  clickLine.setPath(path);
  var segDist=new kakao.maps.Polyline({path:[prev,ll]}).getLength();
  addDot(ll,segDist);
}

function updateMoveLine(ll){
  var path=clickLine.getPath();
  moveLine.setPath([path[path.length-1],ll]);
  moveLine.setMap(map);
}

// ---------------- 공통 함수 ----------------
function addDot(position,segDist){
  var circle=new kakao.maps.CustomOverlay({
    position:position, content:'<span class="dot"></span>', zIndex:1
  });
  circle.setMap(map);

  var distOverlay=null;
  if(segDist){
    var content=document.createElement('div');
    content.className='dotOverlay';
    content.innerText=Math.round(segDist)+" m";
    distOverlay=new kakao.maps.CustomOverlay({
      position:position, yAnchor:1, zIndex:2, content:content
    });
    distOverlay.setMap(map);

    content.addEventListener('click',function(evt){
      evt.stopPropagation();
      finishMeasure(position);
    });
  }
  dots.push({circle:circle,distance:distOverlay});
}

function finishMeasure(pos){
  if(!clickLine) return;
  var path=clickLine.getPath();
  if(path.length<2) return;

  var lastDot=dots[dots.length-1];
  if(lastDot){
    if(lastDot.circle) lastDot.circle.setMap(null);
    if(lastDot.distance) lastDot.distance.setMap(null);
    dots.pop();
  }
  path.pop();
  clickLine.setPath(path);
  if(moveLine){moveLine.setMap(null);moveLine=null;}

  var totalLen=Math.round(clickLine.getLength());
  if(totalOverlay) totalOverlay.setMap(null);

  var box=document.createElement('div');
  box.className='distanceInfo';
  box.innerHTML='총거리 <span class="number">'+totalLen+'</span>m <span class="closeBtn">X</span>';
  box.querySelector('.closeBtn').onclick=function(e){
    e.stopPropagation();
    resetMeasure();
    drawing=false;
    btn.classList.remove('active');
    map.setCursor('');
  };

  totalOverlay=new kakao.maps.CustomOverlay({
    map:map, position:pos, content:box,
    xAnchor:0, yAnchor:0, pixelOffset:new kakao.maps.Point(10,10)
  });

  drawing=false;
  btn.classList.remove('active');
  map.setCursor('');
}

function resetMeasure(){
  if(clickLine){clickLine.setMap(null);clickLine=null;}
  if(moveLine){moveLine.setMap(null);moveLine=null;}
  if(totalOverlay){totalOverlay.setMap(null);totalOverlay=null;}
  dots.forEach(function(d){
    if(d.circle) d.circle.setMap(null);
    if(d.distance) d.distance.setMap(null);
  });
  dots=[];
}

// ---------------- 이벤트 바인딩 ----------------
function bindInputHandlers(){
  if(isTouchMode){
    map.setDraggable(true);
    map.setZoomable(true);
    mapContainer.addEventListener('touchstart',onTouchStart,{passive:false});
    mapContainer.addEventListener('touchmove',onTouchMove,{passive:false});
    mapContainer.addEventListener('touchend',onTouchEnd,{passive:false});
  }else{
    kakao.maps.event.addListener(map,'click',onMapClick);
    kakao.maps.event.addListener(map,'mousemove',onMapMove);
  }
}
function unbindInputHandlers(){
  if(isTouchMode){
    mapContainer.removeEventListener('touchstart',onTouchStart);
    mapContainer.removeEventListener('touchmove',onTouchMove);
    mapContainer.removeEventListener('touchend',onTouchEnd);
  }else{
    kakao.maps.event.removeListener(map,'click',onMapClick);
    kakao.maps.event.removeListener(map,'mousemove',onMapMove);
  }
}

var mapContainer=document.getElementById('map');
</script>
</body>
</html>
