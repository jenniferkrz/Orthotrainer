$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0];
    console.log(fall);
    let src_front = "../images/frs"+fall+".png";

    console.log(src_front);

    $('#linien_img1').attr("src", src_front);



});



