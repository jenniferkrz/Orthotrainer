$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0];
    console.log(fall);
    let src_front = "images/front"+fall+".png";
    let src_side = "images/side"+fall+".png";

    console.log(src_front);
    console.log(src_side);


    $('#linien_img1').attr("src", src_front);
    $('#linien_img3').attr("src", src_side);

});



