// roadview-handler.js

// 전역 변수
var overlayOn = false,
    container = document.getElementById('container'),
    mapWrapper = document.getElementById('mapWrapper'),
    mapContainer = document.getElementById('map'),
    rvContainer = document.getElementById('roadview');

var rv = new kakao.maps.Roadview(rvContainer);
var rvClient = new kakao.maps.RoadviewClient();

// 로드뷰 위치 바뀌었을 때 지도 중심 동기화
kakao.maps.event.addListener(rv, 'position_changed', function () {
    var rvPosition = rv.getPosition();
    map.setCenter(rvPosition);
    if (overlayOn) {
        marker.setPosition(rvPosition);
    }
});

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

var marker = new kakao.maps.Marker({
    image: markImage,
    position: map.getCenter(),
    draggable: true
});

kakao.maps.event.addListener(marker, 'dragend', function (mouseEvent) {
    var position = marker.getPosition();
    toggleRoadview(position);
});

kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
    if (!overlayOn) return;
    var position = mouseEvent.latLng;
    marker.setPosition(position);
    toggleRoadview(position);
});

function toggleRoadview(position) {
    rvClient.getNearestPanoId(position, 50, function (panoId) {
        if (panoId === null) {
            toggleMapWrapper(true, position);
        } else {
            toggleMapWrapper(false, position);
            rv.setPanoId(panoId, position);
        }
    });
}

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

function toggleOverlay(active) {
    if (active) {
        overlayOn = true;
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        marker.setMap(map);
        if (typeof marker1 !== 'undefined') marker1.setMap(null);
        marker.setPosition(map.getCenter());
        toggleRoadview(map.getCenter());
    } else {
        overlayOn = false;
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        marker.setMap(null);
        if (typeof marker1 !== 'undefined') marker1.setMap(map);
    }
}

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

function closeRoadview() {
    var position = marker.getPosition();
    toggleMapWrapper(true, position);
}

// 전역에 등록 (원하면 IIFE로 감쌀 수 있음)
window.setRoadviewRoad = setRoadviewRoad;
window.closeRoadview = closeRoadview;
