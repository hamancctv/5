// roadview-handler.js  (최종)

(function(){
  // Kakao SDK와 전역 map이 준비되었는지 확인
  if (typeof kakao === 'undefined' || !window.map) {
    console.error('[roadview-handler] Kakao SDK 또는 map이 없습니다.');
    return;
  }

  var containerEl  = document.getElementById('container');
  var rvContainerEl= document.getElementById('roadview');

  // 로드뷰 객체들
  var rv       = new kakao.maps.Roadview(rvContainerEl);
  var rvClient = new kakao.maps.RoadviewClient();

  // 로드뷰 on/off 상태
  var overlayOn = false;

  // 로드뷰 전용 마커 (다른 마커들과 충돌 피하려고 이름 구분)
  var rvMarker = new kakao.maps.Marker({
    image: new kakao.maps.MarkerImage(
      'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/roadview_minimap_wk_2018.png',
      new kakao.maps.Size(26,46),
      {
        spriteSize: new kakao.maps.Size(1666,168),
        spriteOrigin: new kakao.maps.Point(705,114),
        offset: new kakao.maps.Point(13,46)
      }
    ),
    position: map.getCenter(),
    draggable: true
  });

  // 로드뷰 위치 바뀌면 지도 동기화
  kakao.maps.event.addListener(rv, 'position_changed', function(){
    var p = rv.getPosition();
    map.setCenter(p);
    if (overlayOn) rvMarker.setPosition(p);
  });

  // 마커 드래그 → 로드뷰 이동
  kakao.maps.event.addListener(rvMarker, 'dragend', function(){
    toggleRoadview(rvMarker.getPosition());
  });

  // 지도 클릭 → 로드뷰 이동 (오버레이 켜진 경우에만)
  kakao.maps.event.addListener(map, 'click', function(mouseEvent){
    if (!overlayOn) return;
    var p = mouseEvent.latLng;
    rvMarker.setPosition(p);
    toggleRoadview(p);
  });

  // 좌표 근처 로드뷰 열기/레이아웃 토글
  function toggleRoadview(position){
    rvClient.getNearestPanoId(position, 50, function(panoId){
      if (panoId === null) {
        restoreMapLayout(position);
      } else {
        ensureSplitLayout(position);
        rv.setPanoId(panoId, position);
      }
    });
  }

  // 로드뷰 50:50 분할 활성화
  function ensureSplitLayout(position){
    if (!containerEl.classList.contains('view_roadview')) {
      containerEl.classList.add('view_roadview');
      // 클래스 적용 후 리레이아웃/센터 재설정 (렌더 타이밍 고려)
      setTimeout(function(){
        map.relayout();
        map.setCenter(position);
      }, 0);
    }
  }

  // 분할 해제(지도 100%)
  function restoreMapLayout(position){
    if (containerEl.classList.contains('view_roadview')) {
      containerEl.classList.remove('view_roadview');
      setTimeout(function(){
        map.relayout();
        map.setCenter(position);
      }, 0);
    }
  }

  // 지도 위 로드뷰 오버레이/마커 토글
  function toggleOverlay(active){
    if (active) {
      overlayOn = true;
      map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
      rvMarker.setMap(map);

      // 클릭 마커(marker1)가 있다면 숨김(없으면 무시)
      if (window.marker1) window.marker1.setMap(null);

      rvMarker.setPosition(map.getCenter());
      toggleRoadview(map.getCenter());
    } else {
      overlayOn = false;
      map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
      rvMarker.setMap(null);

      // 클릭 마커 되살리기(있을 때만)
      if (window.marker1) window.marker1.setMap(map);
    }
  }

  // 버튼 핸들러 (HTML의 #roadviewControl)
  function setRoadviewRoad(){
    var ctrl = document.getElementById('roadviewControl');
    var willActivate = !ctrl.classList.contains('active');
    ctrl.classList.toggle('active', willActivate);
    toggleOverlay(willActivate);
  }

  // 닫기 버튼 (HTML의 #close)
  function closeRoadview(){
    var p = rvMarker.getPosition() || map.getCenter();
    restoreMapLayout(p);
  }

  // 전역에 노출 (HTML onclick용)
  window.setRoadviewRoad = setRoadviewRoad;
  window.closeRoadview   = closeRoadview;
})();
