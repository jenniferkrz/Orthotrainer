$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0]

    let src = "orthoruler/public/index"+fall+".html";
    console.log(src);
    document.getElementById('orthoruler_frame').setAttribute("src", src);


});



