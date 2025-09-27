
var btn=document.getElementById('btnDistance');
var totalBox=document.getElementById('totalDistanceBox');
var drawing=false, moveLine=null, clickLine=null, dots=[];

btn.onclick=function(){
  drawing=!drawing;
  if(drawing){
    resetMeasure();
    btn.classList.add('active');
    map.setCursor('crosshair');
  }else{
    resetMeasure();
    btn.classList.remove('active');
    map.setCursor('');
  }
};

// 지도 클릭 → 점 추가
kakao.maps.event.addListener(map,'click',function(e){
  if(!drawing) return;
  var pos=e.latLng;

  if(!clickLine){
    clickLine=new kakao.maps.Polyline({
      map:map, path:[pos],
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:1, strokeStyle:'solid'
    });
    moveLine=new kakao.maps.Polyline({
      strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5, strokeStyle:'solid'
    });
    addDot(pos,null); // 첫 점
  }else{
    var path=clickLine.getPath();
    var prev=path[path.length-1];
    path.push(pos);
    clickLine.setPath(path);

    var segDist=new kakao.maps.Polyline({path:[prev,pos]}).getLength();
    addDot(pos,segDist);
    showTotalDistance();
  }
});

// 마우스 이동 → 임시선
kakao.maps.event.addListener(map,'mousemove',function(e){
  if(!drawing||!clickLine) return;
  var path=clickLine.getPath();
  moveLine.setPath([path[path.length-1],e.latLng]);
  moveLine.setMap(map);
});

// 점 + 세그먼트 오버레이
function addDot(position,segDist){
  var circle=new kakao.maps.CustomOverlay({
    position:position, content:'<span class="dot"></span>', zIndex:1
  });
  circle.setMap(map);

  if(segDist){
    var content=document.createElement('div');
    content.className='dotOverlay';
    content.innerText=Math.round(segDist)+" m";

    var distOverlay=new kakao.maps.CustomOverlay({
      position:position, yAnchor:1, xAnchor:0, zIndex:2, content:content,
      map:map
    });
    dots.push({circle:circle,distance:distOverlay});
  }else{
    dots.push({circle:circle,distance:null});
  }
}

// 총거리 박스 (화면 오른쪽 아래 고정)
function showTotalDistance(){
  var totalLen=Math.round(clickLine.getLength());
  totalBox.style.display="block";
  totalBox.querySelector(".number") 
    ? totalBox.querySelector(".number").innerText=totalLen
    : totalBox.innerHTML='총거리: <span class="number">'+totalLen+'</span> m <span class="closeBtn">X</span>';

  totalBox.querySelector(".closeBtn").onclick=function(e){
    e.stopPropagation();
    resetMeasure();
    drawing=false;
    btn.classList.remove('active');
    map.setCursor('');
  };
}

// 초기화
function resetMeasure(){
  if(clickLine){clickLine.setMap(null); clickLine=null;}
  if(moveLine){moveLine.setMap(null); moveLine=null;}
  dots.forEach(function(d){
    if(d.circle) d.circle.setMap(null);
    if(d.distance) d.distance.setMap(null);
  });
  dots=[];
  totalBox.style.display="none";
}
