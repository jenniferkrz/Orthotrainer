$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0];
    let src = "frs/aktuell/fall"+fall+"/view/index.html#"+ window.location.hash.substring(1).split("-")[1];

    document.getElementById('frs_iframe').setAttribute("src", src);


});



