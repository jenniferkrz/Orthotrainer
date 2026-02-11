$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0];
    console.log(fall);
    let src = "images/opg"+fall+".jpg";
    console.log(src);

    $('#opg_img').attr("src", src);


});



