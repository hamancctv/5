// roadview-handler.js

// 로드뷰 상태
var overlayOn = false;

// 엘리먼트 참조
var container   = container   || document.getElementById('container');
var rvContainer = rvContainer || document.getElementById('roadview');

// 로드뷰 객체 & 클라이언트
var rv = new kakao.maps.Roadview(rvContainer);
var rvClient = new kakao.maps.RoadviewClient();

// 로드뷰 마커 이미지
var markImage = new kakao.maps.MarkerImage(
  'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/roadview_minimap_wk_2018.png',
  new kakao.maps.Size(26, 46),
  {
    spriteSize: new kakao.maps.Size(1666, 168),
    spriteOrigin: new kakao.maps.Point(705, 114),
    offset: new kakao.maps.Point(13, 46)
  }
);

// 로드뷰 마커
var rvMarker = new kakao.maps.Marker({
  image: markImage,
  position: map.getCenter(),
  draggable: true
});

// 로드뷰 위치 바뀔 때 지도 동기화
kakao.maps.event.addListener(rv, 'position_changed', function () {
  var rvPosition = rv.getPosition();
  map.setCenter(rvPosition);
  if (overlayOn) rvMarker.setPosition(rvPosition);
});

// 로드뷰 마커 드래그 → 로드뷰 이동
kakao.maps.event.addListener(rvMarker, 'dragend', function () {
  toggleRoadview(rvMarker.getPosition());
});

// 지도 클릭 → 로드뷰 이동 (오버레이 켜진 경우에만)
kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
  if (!overlayOn) return;
  var position = mouseEvent.latLng;
  rvMarker.setPosition(position);
  toggleRoadview(position);
});

// 좌표 근처 로드뷰 열기
function toggleRoadview(position){
  rvClient.getNearestPanoId(position, 50, function(panoId) {
    if (panoId === null) {
      toggleMapWrapper(true, position);
    } else {
      toggleMapWrapper(false, position);
      rv.setPanoId(panoId, position);
    }
  });
}

// 레이아웃 토글 (지도/로드뷰 50:50)
function toggleMapWrapper(active, position) {
  if (active) {
    container.className = '';
    map.relayout();
    map.setCenter(position);
  } else {
    if (container.className.indexOf('view_roadview') === -1) {
      container.className = 'view_roadview';
      map.relayout();
      map.setCenter(position);
    }
  }
}

// 지도 위 로드뷰 오버레이 / 마커 토글
function toggleOverlay(active) {
  if (active) {
    overlayOn = true;
    map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);

    // 로드뷰 마커 표시
    rvMarker.setMap(map);

    // 클릭 마커(marker1) 사용 중이면 감춤(없는 경우 안전 가드)
    if (typeof marker1 !== 'undefined' && marker1) marker1.setMap(null);

    rvMarker.setPosition(map.getCenter());
    toggleRoadview(map.getCenter());
  } else {
    overlayOn = false;
    map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);

    rvMarker.setMap(null);
    if (typeof marker1 !== 'undefined' && marker1) marker1.setMap(map);
  }
}

// 로드뷰 버튼
function setRoadviewRoad() {
  var control = document.getElementById('roadviewControl');
  if (control.className.indexOf('active') === -1) {
    control.className = 'active';
    toggleOverlay(true);
  } else {
    control.className = '';
    toggleOverlay(false);
  }
}

// 로드뷰 닫기 버튼
function closeRoadview() {
  var position = rvMarker.getPosition();
  toggleMapWrapper(true, position);
}

// 전역 등록 (HTML의 onclick과 연결)
window.setRoadviewRoad = setRoadviewRoad;
window.closeRoadview = closeRoadview;
