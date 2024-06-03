$(document).ready(function () {

    let fall = window.location.hash.substring(1);

    $(document).on("click",".step_container",function(e) {
        let fall = window.location.hash.substring(1);
        let link = $(e.target).attr("data-href") + "#" + fall;

        window.location.href = link;
    
    });

    $(document).on("click","#next_btn",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall;
        window.location.href = link;
    });
});



