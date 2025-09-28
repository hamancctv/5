// markers-handler.js
(function() {
  const style = document.createElement("style");
  style.textContent = `
    .overlay-hover {
      padding:2px 6px;
      background:rgba(255,255,255,0.9);
      border:1px solid #ccc;
      border-radius:5px;
      font-size:12px;
      white-space: nowrap;
      user-select: none;
    }
    .overlay-click {
      padding:5px 8px;
      background:rgba(255,255,255,0.95);
      border:1px solid #666;
      border-radius:5px;
      font-size:13px;
      white-space: nowrap;
      user-select: none;
    }
  `;
  document.head.appendChild(style);

  // 마커 초기화 함수
  window.initMarkers = function(map, positions) {
    const markers = [];
    const overlays = [];
    const clickOverlays = [];
    const markerHeight = 42;

    for (let i = 0; i < positions.length; i++) {
      (function(i) {
        const marker = new kakao.maps.Marker({
          map: map,
          position: positions[i].latlng,
          image: positions[i].markerImage,
          clickable: true
        });

        // hover overlay
        const overlay = new kakao.maps.CustomOverlay({
          position: positions[i].latlng,
          content: `<div class="overlay-hover" style="transform:translateY(-${markerHeight}px)">${positions[i].content}</div>`,
          yAnchor: 1,
          map: null
        });

        // click overlay
        const clickOverlay = new kakao.maps.CustomOverlay({
          position: positions[i].latlng,
          content: `<div class="overlay-click" style="transform:translateY(-${markerHeight}px)">${positions[i].content}</div>`,
          yAnchor: 1,
          map: null
        });

        // hover 이벤트
        kakao.maps.event.addListener(marker, "mouseover", function() {
          if (map.getLevel() > 3 && !overlay.getMap()) overlay.setMap(map);
        });
        kakao.maps.event.addListener(marker, "mouseout", function() {
          if (map.getLevel() > 3) setTimeout(() => overlay.setMap(null), 50);
        });

        // 클릭 이벤트
        kakao.maps.event.addListener(marker, "click", function() {
          // 기존 클릭 오버레이 제거
          clickOverlays.forEach(ov => ov.setMap(null));
          clickOverlays.length = 0;

          // 바운스 애니메이션
          const originalPos = positions[i].latlng;
          let offset = 0, direction = 1;
          const bounceDuration = 400;

          if (marker.bounceInterval) clearInterval(marker.bounceInterval);
          marker.bounceInterval = setInterval(() => {
            offset += direction * 0.5;
            if (offset >= 5 || offset <= -5) direction *= -1;
            marker.setPosition(new kakao.maps.LatLng(
              originalPos.getLat(),
              originalPos.getLng() + offset / 100000
            ));
          }, 10);
          setTimeout(() => {
            clearInterval(marker.bounceInterval);
            marker.setPosition(originalPos);
          }, bounceDuration);

          // 클릭 오버레이 표시
          clickOverlay.setMap(map);
          clickOverlays.push(clickOverlay);

          // 좌표 input 업데이트
          document.getElementById("gpsyx").value = 
            originalPos.getLat() + ", " + originalPos.getLng();
        });

        markers.push(marker);
        overlays.push(overlay);
      })(i);
    }

    // 지도 레벨 이벤트
    kakao.maps.event.addListener(map, "idle", function() {
      const level = map.getLevel();
      overlays.forEach(o => {
        if (level <= 3) o.setMap(map);
        else o.setMap(null);
      });
    });

    return markers;
  };
})();
