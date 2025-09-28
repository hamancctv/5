<script>
// ===== 안전한 인라인 마커 핸들러(호버/클릭 즉시 확인용) =====
(function(){
  if(!(window.kakao && kakao.maps)) { console.error('Kakao SDK not loaded'); return; }

  // 상태별 마커 높이(오버레이 간격)
  const markerHeights = { normal: 42, hover: 50, click: 50 };

  const SPRITE_URL = "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png";
  const normalImage = new kakao.maps.MarkerImage(
    SPRITE_URL, new kakao.maps.Size(30, 42), { offset: new kakao.maps.Point(15, 42) }
  );
  const hoverImage = new kakao.maps.MarkerImage(
    SPRITE_URL, new kakao.maps.Size(36, 50), { offset: new kakao.maps.Point(18, 50) }
  );
  const clickImage = hoverImage; // 클릭시도 hover와 같은 크기

  // 오버레이 HTML
  function ovHTML(cls, text, state){
    return `<div class="${cls}" style="padding:${cls==='overlay-hover'?'2px 6px':'5px 8px'};background:rgba(255,255,255,.95);border:1px solid ${cls==='overlay-hover'?'#ccc':'#666'};border-radius:5px;font-size:${cls==='overlay-hover'?'12px':'13px'};white-space:nowrap;user-select:none;transform:translateY(-${markerHeights[state]}px)">${text}</div>`;
  }

  // 전역 내보내기
  window.initMarkers = function(map, positions){
    if(!Array.isArray(positions) || positions.length===0){
      console.warn('positions가 비었거나 로드 실패했습니다.');
      return [];
    }

    const markers = [];
    const hoverOverlays = [];
    const clickOverlays = [];
    let selected = null;

    positions.forEach((p)=>{
      const m = new kakao.maps.Marker({
        map, position: p.latlng, image: normalImage, clickable: true
      });

      const hov = new kakao.maps.CustomOverlay({
        position: p.latlng,
        content: ovHTML('overlay-hover', p.content ?? '', 'normal'),
        yAnchor: 1
      });

      const clk = new kakao.maps.CustomOverlay({
        position: p.latlng,
        content: ovHTML('overlay-click', p.content ?? '', 'normal'),
        yAnchor: 1
      });

      // hover
      kakao.maps.event.addListener(m, 'mouseover', function(){
        if(m !== selected) m.setImage(hoverImage);
        hov.setContent(ovHTML('overlay-hover', p.content ?? '', m===selected?'click':'hover'));
        hov.setMap(map); // 레벨 조건 없이 즉시 표시
      });
      kakao.maps.event.addListener(m, 'mouseout', function(){
        if(m !== selected) m.setImage(normalImage);
        hov.setMap(null);
      });

      // click
      kakao.maps.event.addListener(m, 'click', function(){
        if(selected && selected !== m) selected.setImage(normalImage);
        clickOverlays.forEach(o=>o.setMap(null)); clickOverlays.length = 0;

        selected = m;
        m.setImage(clickImage);
        clk.setContent(ovHTML('overlay-click', p.content ?? '', 'click'));
        clk.setMap(map);
        clickOverlays.push(clk);

        const input = document.getElementById('gpsyx');
        if(input) input.value = `${p.latlng.getLat()}, ${p.latlng.getLng()}`;
      });

      markers.push(m);
      hoverOverlays.push(hov);
    });

    // 지도 클릭 → 선택/오버레이 정리
    kakao.maps.event.addListener(map, 'click', function(){
      if(selected){ selected.setImage(normalImage); selected = null; }
      hoverOverlays.forEach(o=>o.setMap(null));
      clickOverlays.forEach(o=>o.setMap(null)); clickOverlays.length = 0;
    });

    return markers;
  };
})();
</script>
