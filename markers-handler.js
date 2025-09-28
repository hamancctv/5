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
    /* 점프 애니메이션 */
    .marker-bounce {
      animation: bounce 0.35s ease;
    }
    @keyframes bounce {
      0%   { transform: translateY(0); }
      30%  { transform: translateY(-15px); }
      60%  { transform: translateY(0); }
      80%  { transform: translateY(-7px); }
      100% { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  // 상태별 마커 높이
  const markerHeights = {
    normal: 42,
    hover: 50.4,
    click: 50.4
  };

  // 오버레이 content 생성 함수
  function makeOverlayContent(type, text, state = "normal") {
    return `<div class="overlay-${type}" style="transform:translateY(-${markerHeights[state]}px)">
      ${text}
    </div>`;
  }

  // 마커 초기화 함수
  window.initMarkers = function(map, positions) {
    const markers = [];
    const overlays = [];
    const clickOverlays = [];

    // 마커 이미지
    const normalImage = new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
      new kakao.maps.Size(30, 42),
      { offset: new kakao.maps.Point(15, 42) }
    );
    const hoverImage = new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png",
      new kakao.maps.Size(36, 50.4),
      { offset: new kakao.maps.Point(18, 50.4) }
    );
    const clickImage = hoverImage; // 클릭은 hover와 같은 크기로 사용

    let selectedMarker = null;

    for (let i = 0; i < positions.length; i++) {
      (function(i) {
        const marker = new kakao.maps.Marker({
          map: map,
          position: positions[i].latlng,
          image: normalImage,
          clickable: true
        });

        // hover overlay
        const overlay = new kakao.maps.CustomOverlay({
          position: positions[i].latlng,
          content: makeOverlayContent("hover", positions[i].content, "normal"),
          yAnchor: 1,
          map: null
        });

        // click overlay
        const clickOverlay = new kakao.maps.CustomOverlay({
          position: positions[i].latlng,
          content: makeOverlayContent("click", positions[i].content, "normal"),
          yAnchor: 1,
          map: null
        });

        // hover 이벤트
        kakao.maps.event.addListener(marker, "mouseover", function() {
          marker.__isMouseOver = true;
          if (marker !== selectedMarker) marker.setImage(hoverImage);

          overlay.setContent(makeOverlayContent("hover", positions[i].content, "hover"));
          if (map.getLevel() > 3 && !overlay.getMap()) overlay.setMap(map);
        });
        kakao.maps.event.addListener(marker, "mouseout", function() {
          marker.__isMouseOver = false;
          if (marker !== selectedMarker) marker.setImage(normalImage);

          overlay.setContent(makeOverlayContent("hover", positions[i].content, "normal"));
          if (map.getLevel() > 3) setTimeout(() => overlay.setMap(null), 50);
        });

        // click 이벤트
        kakao.maps.event.addListener(marker, "click", function() {
          // 이전 선택 마커 초기화
          if (selectedMarker && selectedMarker !== marker) {
            selectedMarker.setImage(normalImage);
          }

          // 기존 클릭 오버레이 제거
          clickOverlays.forEach(ov => ov.setMap(null));
          clickOverlays.length = 0;

          // 클릭 시 이미지 교체 + 점프 애니메이션
          marker.setImage(clickImage);
          const markerEl = marker.getElement();
          if (markerEl) {
            markerEl.classList.remove("marker-bounce");
            void markerEl.offsetWidth; // 강제로 reflow
            markerEl.classList.add("marker-bounce");
          }

          selectedMarker = marker;

          // 클릭 오버레이 표시
          clickOverlay.setContent(makeOverlayContent("click", positions[i].content, "click"));
          clickOverlay.setMap(map);
          clickOverlays.push(clickOverlay);

          // 좌표 input 업데이트
          const gpsyx = document.getElementById("gpsyx");
          if (gpsyx) {
            gpsyx.value =
              positions[i].latlng.getLat() + ", " + positions[i].latlng.getLng();
          }
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

    // 지도 클릭 → 선택 해제
    kakao.maps.event.addListener(map, "click", function() {
      if (selectedMarker) {
        selectedMarker.setImage(normalImage);
        selectedMarker = null;
      }
      clickOverlays.forEach(ov => ov.setMap(null));
      clickOverlays.length = 0;
    });

    return markers;
  };
})();
