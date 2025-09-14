
// 로드뷰에서 X버튼을 눌렀을 때 로드뷰를 지도 뒤로 숨기는 함수입니다
function closeRoadview() {
    var position = marker.getPosition();
    toggleMapWrapper(true, position);
}

// 로드뷰에서 X버튼을 눌렀을 때 로드뷰를 지도 뒤로 숨기는 함수입니다
function closeRoadview() {
    var position = marker.getPosition();
    toggleMapWrapper(true, position);
}


function f_m_num(mMPID) {
    var list_id = $('span[value*='+mMPID+']').attr('id');
    list_id = list_id.substr(6);
    return list_id;    
}

function f_m_title(mMPID) {
    var list_title = $('span[value*='+mMPID+']').html();

    return list_title;    
}

function getTimeStamp() {
    var d = new Date();
  
    var s =
      leadingZeros(d.getFullYear().toString().substr(2,4), 2) + '/' +
      leadingZeros(d.getMonth() + 1, 2) + '/' +
      leadingZeros(d.getDate(), 2) + ' ' +
  
      leadingZeros(d.getHours(), 2) + ':' +
      leadingZeros(d.getMinutes(), 2);
  
    return s;
}  
  

function HideAllInfos() {
    for (var i = 0; i < infowindows.length; i++) {
        infowindows[i].close();
    }    
    //$("#MPNP").hide();
}

function HideAllTitle() {
    for (var i = 0; i < customOverlays.length; i++) {
        customOverlays[i].setVisible(false);
    }   
    btnTTShow.className = 'btn';
    btnTTHide.className = 'selected_btn';            
}

function HT(num) {
    HideAllInfos();    
    infowindows[num].open(map, markers[num]);
    for (var i = 0; i < markers.length; i++) {
        markers[i].setZIndex(20);
        customOverlays[i].setZIndex(10);
        infowindows[i].setZIndex(30);
        
    }  
    markers[num].setZIndex(21);
    customOverlays[num].setZIndex(11);    
    infowindows[num].setZIndex(31);
    map.panTo(markers[num].getPosition());
}

// "마커 감추기" 버튼을 클릭하면 호출되어 배열에 추가된 마커를 지도에서 삭제하는 함수입니다
function hideMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
        customOverlays[i].setMap(null);             }
        
}


function hideOderlist() {
    for (var i = 0; i < o_list.length; i++) {
        markers[i].setMap(null);
        customOverlays[i].setMap(null);             }
}


function ShowAllTitle() {
    for (var i = 0; i < customOverlays.length; i++) {
        customOverlays[i].setVisible(true);
    }    
    btnTTShow.className = 'selected_btn';
    btnTTHide.className = 'btn';            
}

function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();
  
    if (n.length < digits) {
      for (i = 0; i < digits - n.length; i++)
        zero += '0';
    }
    return zero + n;
}

function nameMarker(mMarker){    
    mMarker = mMarker.replace('/mm/op/user/done/','');
    mMarker = mMarker.replace('/mm/op/user/','');    

    return mMarker;
}


function makeAllDrag() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setDraggable(true);
    }            

    btnAllDrag.className = 'selected_btn';
    btnLockDrag.className = 'btn';    
}

function makeOverListener(map, marker, infowindow) {
    return function() {
        HideAllInfos();                
        infowindow.open(map, marker);
    };
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다 
function makeOutListener(infowindow) {
    return function() {
        infowindow.close();
    };
}

function makeLockDrag() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setDraggable(false);
    }            
    btnAllDrag.className = 'btn';
    btnLockDrag.className = 'selected_btn';
}


function mapCurrentPosition2() {
    // 내 위치 표시

    navigator.geolocation.getCurrentPosition(function (pos) {

        myPosLat = pos.coords.latitude;
        myPosLng = pos.coords.longitude;

        //			marker.setPosition(LatLng(myPosLat, myPosLng));
        myMarker.setPosition(new kakao.maps.LatLng(myPosLat, myPosLng));
        map.setCenter(new kakao.maps.LatLng(myPosLat, myPosLng));
map.setLevel(4);
        myMarker.setVisible(true);
        btnCurrentMe.className = 'selected_btn';
        btnCurrentHideMe.className = 'btn';

    });
    //--내 위치 표시
}


function mapCurrentPositionHide() {
    myMarker.setVisible(false);
    btnCurrentMe.className = 'btn';
    btnCurrentHideMe.className = 'selected_btn';
}



function navi2(m_name, p_m_y, p_m_x, type) {


    m_name = regExp(m_name, 1);
    var m_x = parseFloat(p_m_x);
    var m_y = parseFloat(p_m_y);     

    if (type == 0) {  
        Kakao.Navi.start({
        name: m_name,
        x: m_x,
        y: m_y,
        coordType: 'wgs84'
        })
    } else if ((type == 1)) {
        window.open('https://apis.openapi.sk.com/tmap/app/routes?appKey=l7xx07fae618b9604b2680aee9097f5e57a0&name='+m_name+'&lon='+m_x+'&lat='+m_y);
    } else if ((type == 2)) {       window.open('https://map.kakao.com/link/to/'+m_name+','+m_y+','+m_x);        }

}


function regExp(str, type){  
    var reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    
    
    if (type == 1) { reg = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi}
    if (type == 2) { reg = /[\{\}\[\]\/?,;:|*~`!^\+<>@\#$%&\\\=\'\"]/gi}  // . _ - ( ) 포함
    if (type == 3) { reg = /[\{\}\[\]\/?;:|*~`!^\+<>@\#$%&\\\=\'\"]/gi}  // , . _ - ( ) 포함
    if (type == 4) { reg = /[\{\}\[\]\/?;:|*~`!^\+<>@\#$%&\\\=]/gi}  // " ' , . _ - ( ) 포함        
    if (type == 5) { reg = /[\{\}\[\]?;|*~`!^\+<>@\#$%&\\\=]/gi}  // " ' , . _ - ( ) 포함            
    
    //특수문자 검증
    if(reg.test(str)){
        //특수문자 제거후 리턴
        return str.replace(reg, "");    
    } else {
        //특수문자가 없으므로 본래 문자 리턴
        return str;
    }  
}

function setMarkers(map,kind) {
    for (var i = 0; i < markers.length; i++) {
        if (kind == markers[i].getTitle()){
        markers[i].setMap(map);
        customOverlays[i].setMap(map);
        } 

        //console.log(markers[i]); 
        //console.log(markers[i].Fb);         
    }            
}

function showMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        customOverlays[i].setMap(map);             }


}


// 체크 박스를 선택하면 호출되는 함수입니다
function setOverlayMapTypeId() {
    var chkuseDistrict = document.getElementById('chkuseDistrict');
    // 지도 타입을 제거합니다
    for (var type in mapTypes) {
        map.removeOverlayMapTypeId(mapTypes[type]);
    }
    // 지적편집도정보 체크박스가 체크되어있으면 지도에 지적편집도정보 지도타입을 추가합니다
    if (chkuseDistrict.checked) {
        map.addOverlayMapTypeId(mapTypes.useDistrict);
    }

} 

function setOverlayMapTypeId1() {

    var chkuseDistrict = document.getElementById('chkuseDistrict');

    // 지도 타입을 제거합니다
    for (var type in mapTypes) {
        map.removeOverlayMapTypeId(mapTypes[type]);
    }
    // 지적편집도정보 체크박스가 체크되어있으면 지도에 지적편집도정보 지도타입을 추가합니다
    map.addOverlayMapTypeId(mapTypes.useDistrict);
    btnGround.className = 'selected_btn';
    btnGroundHide.className = 'btn';
}

function setOverlayMapTypeId2() {

    var chkuseDistrict = document.getElementById('chkuseDistrict');
    // 지도 타입을 제거합니다
    for (var type in mapTypes) {
        map.removeOverlayMapTypeId(mapTypes[type]);
    }

    btnGround.className = 'btn';
    btnGroundHide.className = 'selected_btn';

}

function setOverlayMapType_m() {
    var control = document.getElementById('overlayMapType_m');
    var chkuseDistrict = document.getElementById('chkuseDistrict');
    // 버튼이 눌린 상태가 아니면
    if (control.className.indexOf('active') === -1) {
        control.className = 'active';
        for (var type in mapTypes) {
            map.removeOverlayMapTypeId(mapTypes[type]);            }
    // 지적편집도정보 체크박스가 체크되어있으면 지도에 지적편집도정보 지도타입을 추가합니다
        map.addOverlayMapTypeId(mapTypes.useDistrict);       
    } else {
        control.className = '';
        for (var type in mapTypes) {
            map.removeOverlayMapTypeId(mapTypes[type]);    
        }        
        // 로드뷰 도로 오버레이를 제거합니다
        //toggleOverlay(false);
    }
}


function setRealPos_m() {
    var control = document.getElementById('realPos_m');
    // 버튼이 눌린 상태가 아니면
    if (control.className.indexOf('active') === -1) {
        control.className = 'active';

        interval = setInterval(function() {                
                     
            mapCurrentPosition2();            
        
        }, 1000);



    } else {
        control.className = '';
        clearInterval(interval);
        
    }
}


function setShowList() {
    if (chkshowlist.checked) {
        menu_wrap.style.visibility = 'visible'
    } else {
        menu_wrap.style.visibility = 'hidden'
    }
}

function setShowList1() {
    menu_wrap.style.visibility = 'visible';
    btnTitleList.className = 'selected_btn';
    btnTitleListHide.className = 'btn';
}

function setShowList2() {
    menu_wrap.style.visibility = 'hidden';
    btnTitleList.className = 'btn';
    btnTitleListHide.className = 'selected_btn';
}

function setShowList3() {
    menu_wrap.style.visibility='visible';
    menu_draw.style.visibility='visible';
    menu_rule.style.visibility='visible';    
    btnTitleList.className = 'selected_btn';
    btnTitleListHide.className = 'btn';      
}  

function setShowList4() {
    menu_wrap.style.visibility='hidden';
    menu_draw.style.visibility='hidden';
    menu_rule.style.visibility='hidden';
    btnTitleList.className = 'btn';
    btnTitleListHide.className = 'selected_btn';      
}      

function setShowList1m() {
    menu_wrap_m.style.visibility='visible';
    btnTitleList.className = 'selected_btn';
    btnTitleListHide.className = 'btn';       
}     

function setShowList2m() {
    menu_wrap_m.style.visibility='hidden';
    btnTitleList.className = 'btn';
    btnTitleListHide.className = 'selected_btn';        
}      

function setRoadviewRoad_m() {
    var control = document.getElementById('roadviewControl_m');
    // 버튼이 눌린 상태가 아니면
    if (control.className.indexOf('active') === -1) {
        control.className = 'active';
        // 로드뷰 도로 오버레이가 보이게 합니다
        toggleOverlay(true);
    } else {
        control.className = '';
        // 로드뷰 도로 오버레이를 제거합니다
        toggleOverlay(false);
    }
}

function setCenter(Lat, Lng) {
    if (Lat == null) { return 0 };
    // 이동할 위도 경도 위치를 생성합니다 

    var moveLatLon = new kakao.maps.LatLng(Lat, Lng);

    // 지도 중심을 이동 시킵니다
    map.panTo(moveLatLon);
    var circle = new kakao.maps.Circle({
        center: new kakao.maps.LatLng(Lat, Lng),  // 원의 중심좌표 입니다 
        radius: 100, // 미터 단위의 원의 반지름입니다 
        strokeWeight: 1, // 선의 두께입니다 
        strokeColor: '#ffa500', // 선의 색깔입니다
        strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
        strokeStyle: 'dashed', // 선의 스타일 입니다
        fillColor: '#FF0000', // 채우기 색깔입니다
        fillOpacity: 0.3  // 채우기 불투명도 입니다   
    });

    // 지도에 원을 표시합니다 
    circle.setMap(map);
    setTimeout(function () {
        circle.setMap(null);;
    }, 2000);

}


function sC(Lat, Lng, num) {            

    $("#MPNP").hide();    

    if (Lat == null) {return 0};
    // 이동할 위도 경도 위치를 생성합니다 

    for (var i = 0; i < markers.length; i++) {
        markers[i].setZIndex(20);
        customOverlays[i].setZIndex(10);
        infowindows[i].setZIndex(30);
        
    }  
    markers[num].setZIndex(21);
    customOverlays[num].setZIndex(11);    
    infowindows[num].setZIndex(31);

    var moveLatLon = new kakao.maps.LatLng(Lat, Lng);

    // 지도 중심을 이동 시킵니다
        map.panTo(moveLatLon);
    var circle = new kakao.maps.Circle({
        center : new kakao.maps.LatLng(Lat,  Lng),  // 원의 중심좌표 입니다 
        radius: 100, // 미터 단위의 원의 반지름입니다 
        strokeWeight: 1, // 선의 두께입니다 
        strokeColor: '#ffa500', // 선의 색깔입니다
        strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
        strokeStyle: 'dashed', // 선의 스타일 입니다
        fillColor: '#FF0000', // 채우기 색깔입니다
        fillOpacity: 0.3  // 채우기 불투명도 입니다   
        }); 

    // 지도에 원을 표시합니다 
    circle.setMap(map);     
    setTimeout(function(){
    circle.setMap(null);    ;
    }, 2000);        
        
}

function setMapType(maptype) { 
    var roadmapControl = document.getElementById('btnRoadmap');
    var skyviewControl = document.getElementById('btnSkyview'); 

    if (maptype === 'roadmap') {
        map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);    
        roadmapControl.className = 'selected_btn';
        skyviewControl.className = 'btn';      
    } 
    if (maptype === 'skyview') {
        map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);    
        skyviewControl.className = 'selected_btn';
        roadmapControl.className = 'btn';        
    }
}


// 지도 위의 로드뷰 버튼을 눌렀을 때 호출되는 함수입니다
function setRoadviewRoad() {
    var control = document.getElementById('roadviewControl');
    // 버튼이 눌린 상태가 아니면
    if (control.className.indexOf('active') === -1) {
        control.className = 'active';
        // 로드뷰 도로 오버레이가 보이게 합니다
        toggleOverlay(true);
    } else {
        control.className = '';
        // 로드뷰 도로 오버레이를 제거합니다
        toggleOverlay(false);
    }
}



function save_one_PC(num)
{
    mMP_PC = "input_MP_PC["+num+"]";        
    if ((document.getElementById(mMP_PC).value) == '') document.getElementById(mMP_PC).value = "완료(" + getTimeStamp() + ")";
    save_PC(num);
}




// 전달받은 좌표(position)에 가까운 로드뷰의 파노라마 ID를 추출하여
// 로드뷰를 설정하는 함수입니다
function toggleRoadview(position) {
    rvClient.getNearestPanoId(position, 50, function (panoId) {
        // 파노라마 ID가 null 이면 로드뷰를 숨깁니다
        if (panoId === null) {
            toggleMapWrapper(true, position);
        } else {
            toggleMapWrapper(false, position);

            // panoId로 로드뷰를 설정합니다
            rv.setPanoId(panoId, position);
        }
    });
}

// 지도를 감싸고 있는 div의 크기를 조정하는 함수입니다
function toggleMapWrapper(active, position) {
    if (active) {
        // 지도를 감싸고 있는 div의 너비가 100%가 되도록 class를 변경합니다 
        container.className = '';
        // 지도의 크기가 변경되었기 때문에 relayout 함수를 호출합니다
        map.relayout();
        // 지도의 너비가 변경될 때 지도중심을 입력받은 위치(position)로 설정합니다
        map.setCenter(position);
    } else {
        // 지도만 보여지고 있는 상태이면 지도의 너비가 50%가 되도록 class를 변경하여
        // 로드뷰가 함께 표시되게 합니다
        if (container.className.indexOf('view_roadview') === -1) {
            container.className = 'view_roadview';
            // 지도의 크기가 변경되었기 때문에 relayout 함수를 호출합니다
            map.relayout();
            // 지도의 너비가 변경될 때 지도중심을 입력받은 위치(position)로 설정합니다
            map.setCenter(position);
        }
    }
}

// 지도 위의 로드뷰 도로 오버레이를 추가,제거하는 함수입니다
function toggleOverlay(active) {
    if (active) {
        overlayOn = true;
        // 지도 위에 로드뷰 도로 오버레이를 추가합니다
        map.addOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        // 지도 위에 마커를 표시합니다
        marker.setMap(map);
        // 마커의 위치를 지도 중심으로 설정합니다 
        marker.setPosition(map.getCenter());
        // 로드뷰의 위치를 지도 중심으로 설정합니다
        toggleRoadview(map.getCenter());
    } else {
        overlayOn = false;
        // 지도 위의 로드뷰 도로 오버레이를 제거합니다
        map.removeOverlayMapTypeId(kakao.maps.MapTypeId.ROADVIEW);
        // 지도 위의 마커를 제거합니다
        marker.setMap(null);
    }
}


function viewKind(mKind) { 

    setMarkers(map,mKind);    
}



/////////거리 면적 반경 측정/////////

let drawMode = null; // "line", "poly", "circle"
let mapClickListener, mapMoveListener, mapRightClickListener;

// ---------------- 도형 저장 ----------------
let lineData = { clickLine:null, moveLine:null, dots:[] };
let polyData = { polygon:null, drawingPolygon:null, areaOverlay:null };
let circleData = { drawingCircle:null, drawingLine:null, drawingOverlay:null, circles:[], center:null };

// ---------------- 공통 초기화 ----------------
function clearAll() {
    // 이벤트 제거
    if (mapClickListener) kakao.maps.event.removeListener(map, 'click', mapClickListener);
    if (mapMoveListener) kakao.maps.event.removeListener(map, 'mousemove', mapMoveListener);
    if (mapRightClickListener) kakao.maps.event.removeListener(map, 'rightclick', mapRightClickListener);

    // 거리
    if (lineData.clickLine) lineData.clickLine.setMap(null);
    if (lineData.moveLine) lineData.moveLine.setMap(null);
    lineData.dots.forEach(d => { if(d.circle) d.circle.setMap(null); if(d.distance) d.distance.setMap(null); });
    lineData = { clickLine:null, moveLine:null, dots:[] };

    // 면적
    if (polyData.polygon) polyData.polygon.setMap(null);
    if (polyData.drawingPolygon) polyData.drawingPolygon.setMap(null);
    if (polyData.areaOverlay) polyData.areaOverlay.setMap(null);
    polyData = { polygon:null, drawingPolygon:null, areaOverlay:null };

    // 원
    if (circleData.drawingCircle) circleData.drawingCircle.setMap(null);
    if (circleData.drawingLine) circleData.drawingLine.setMap(null);
    if (circleData.drawingOverlay) circleData.drawingOverlay.setMap(null);
    circleData.circles.forEach(c => { c.circle.setMap(null); c.polyline.setMap(null); c.overlay.setMap(null); });
    circleData = { drawingCircle:null, drawingLine:null, drawingOverlay:null, circles:[], center:null };

    drawMode = null;
}

// ---------------- 거리 ----------------
function startLineMode() {
    drawMode = 'line';
    let drawing = false;

    mapClickListener = function(mouseEvent) {
        const pos = mouseEvent.latLng;
        if (!drawing) {
            drawing = true;
            clearAll();
            lineData.clickLine = new kakao.maps.Polyline({ map, path:[pos], strokeWeight:3, strokeColor:'#db4040', strokeOpacity:1, strokeStyle:'solid' });
            lineData.moveLine = new kakao.maps.Polyline({ strokeWeight:3, strokeColor:'#db4040', strokeOpacity:0.5 });
            addDot(pos, 0);
        } else {
            let path = lineData.clickLine.getPath(); path.push(pos); lineData.clickLine.setPath(path);
            addDot(pos, Math.round(lineData.clickLine.getLength()));
        }
    };

    mapMoveListener = function(mouseEvent) {
        if (!drawing) return;
        const pos = mouseEvent.latLng;
        let path = lineData.clickLine.getPath();
        lineData.moveLine.setPath([path[path.length-1], pos]); lineData.moveLine.setMap(map);
        showDistance(Math.round(lineData.clickLine.getLength() + lineData.moveLine.getLength()), pos);
    };

    mapRightClickListener = function() { drawing=false; if(lineData.moveLine){lineData.moveLine.setMap(null); lineData.moveLine=null;} };

    kakao.maps.event.addListener(map, 'click', mapClickListener);
    kakao.maps.event.addListener(map, 'mousemove', mapMoveListener);
    kakao.maps.event.addListener(map, 'rightclick', mapRightClickListener);

    function addDot(position, distance) {
        const circle = new kakao.maps.CustomOverlay({ content:'<span class="dot"></span>', position, zIndex:1 }); circle.setMap(map);
        let distanceOverlay = null;
        if(distance>0){ distanceOverlay = new kakao.maps.CustomOverlay({ content:`<div class="dotOverlay">거리 <span class="number">${distance}</span>m</div>`, position, yAnchor:1, zIndex:2 }); distanceOverlay.setMap(map); }
        lineData.dots.push({circle, distance:distanceOverlay});
    }

    function showDistance(distance, position) {
        const content = `<div class="dotOverlay distanceInfo">총거리 <span class="number">${distance}</span>m</div>`;
        if (!lineData.distanceOverlay) lineData.distanceOverlay = new kakao.maps.CustomOverlay({ map, content, position, xAnchor:0, yAnchor:0, zIndex:3 });
        else { lineData.distanceOverlay.setContent(content); lineData.distanceOverlay.setPosition(position); }
    }
}

// ---------------- 면적 ----------------
function startPolyMode() {
    drawMode = 'poly';
    let drawing=false;

    mapClickListener = function(mouseEvent) {
        const pos = mouseEvent.latLng;
        if(!drawing){
            drawing=true; clearAll();
            polyData.drawingPolygon = new kakao.maps.Polygon({ map, path:[pos], strokeWeight:3, strokeColor:'#00a0e9', strokeOpacity:1, strokeStyle:'solid', fillColor:'#00a0e9', fillOpacity:0.2 });
            polyData.polygon = new kakao.maps.Polygon({ path:[pos], strokeWeight:3, strokeColor:'#00a0e9', strokeOpacity:1, strokeStyle:'solid', fillColor:'#00a0e9', fillOpacity:0.2 });
        } else {
            let path = polyData.drawingPolygon.getPath(); path.push(pos); polyData.drawingPolygon.setPath(path);
            let path2 = polyData.polygon.getPath(); path2.push(pos); polyData.polygon.setPath(path2);
        }
    };

    mapMoveListener = function(mouseEvent){
        if(!drawing) return;
        const pos = mouseEvent.latLng;
        let path = polyData.drawingPolygon.getPath(); if(path.length>1) path.pop(); path.push(pos); polyData.drawingPolygon.setPath(path);
    };

    mapRightClickListener = function() {
        if(!drawing) return;
        if(polyData.drawingPolygon){ polyData.drawingPolygon.setMap(null); polyData.drawingPolygon=null; }
        let path = polyData.polygon.getPath();
        if(path.length>2){
            polyData.polygon.setMap(map);
            polyData.areaOverlay = new kakao.maps.CustomOverlay({ map, content:`<div class="info">총면적 <span class="number">${Math.round(polyData.polygon.getArea())}</span> m<sup>2</sup></div>`, xAnchor:0, yAnchor:0, position:path[path.length-1] });
        } else polyData.polygon=null;
        drawing=false;
    };

    kakao.maps.event.addListener(map, 'click', mapClickListener);
    kakao.maps.event.addListener(map, 'mousemove', mapMoveListener);
    kakao.maps.event.addListener(map, 'rightclick', mapRightClickListener);
}

// ---------------- 원 ----------------
function startCircleMode() {
    drawMode = 'circle';
    let drawing=false;

    mapClickListener = function(mouseEvent){
        if(!drawing){
            drawing=true; clearAll();
            circleData.center = mouseEvent.latLng;
            circleData.drawingLine = new kakao.maps.Polyline({ strokeWeight:3, strokeColor:'#00a0e9', strokeOpacity:1, strokeStyle:'solid' });
            circleData.drawingCircle = new kakao.maps.Circle({ strokeWeight:1, strokeColor:'#00a0e9', strokeOpacity:0.1, strokeStyle:'solid', fillColor:'#00a0e9', fillOpacity:0.2 });
            circleData.drawingOverlay = new kakao.maps.CustomOverlay({ xAnchor:0, yAnchor:0, zIndex:1 });
        }
    };

    mapMoveListener = function(mouseEvent){
        if(!drawing) return;
        const pos = mouseEvent.latLng;
        circleData.drawingLine.setPath([circleData.center, pos]);
        const radius = circleData.drawingLine.getLength();
        if(radius>0){ circleData.drawingCircle.setOptions({ center:circleData.center, radius }); circleData.drawingOverlay.setContent(`<div class="info">반경 <span class="number">${Math.round(radius)}</span>m</div>`); circleData.drawingOverlay.setPosition(pos); circleData.drawingCircle.setMap(map); circleData.drawingLine.setMap(map); circleData.drawingOverlay.setMap(map); }
        else { circleData.drawingCircle.setMap(null); circleData.drawingLine.setMap(null); circleData.drawingOverlay.setMap(null); }
    };

    mapRightClickListener = function(mouseEvent){
        if(!drawing) return;
        const pos = mouseEvent.latLng;
        const polyline = new kakao.maps.Polyline({ path:[circleData.center,pos], strokeWeight:3, strokeColor:'#00a0e9', strokeOpacity:1, strokeStyle:'solid' });
        const circle = new kakao.maps.Circle({ center:circleData.center, radius:polyline.getLength(), strokeWeight:1, strokeColor:'#00a0e9', strokeOpacity:0.1, strokeStyle:'solid', fillColor:'#00a0e9', fillOpacity:0.2 });
        const overlay = new kakao.maps.CustomOverlay({ content:`<div class="info">반경 <span class="number">${Math.round(circle.getRadius())}</span>m</div>`, position:pos, xAnchor:0, yAnchor:0, zIndex:1 });
        polyline.setMap(map); circle.setMap(map); overlay.setMap(map);
        circleData.circles.push({polyline, circle, overlay});
        circleData.drawingCircle.setMap(null); circleData.drawingLine.setMap(null); circleData.drawingOverlay.setMap(null); circleData.center=null; drawing=false;
    };

    kakao.maps.event.addListener(map, 'click', mapClickListener);
    kakao.maps.event.addListener(map, 'mousemove', mapMoveListener);
    kakao.maps.event.addListener(map, 'rightclick', mapRightClickListener);
}

// ---------------- 버튼 ----------------
document.getElementById('btnMARKER').addEventListener('click', startLineMode);
document.getElementById('btnPOLYLINE').addEventListener('click', startPolyMode);
document.getElementById('btnARROW').addEventListener('click', startCircleMode);
document.getElementById('btnReset').addEventListener('click', clearAll);
