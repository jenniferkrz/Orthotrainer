$(document).ready(function () {

    $(document).on("click",".blue_case",function(e) {
       
        let link = "step.html#" + $(e.target).attr("data-id");
        window.location.href = link;

    });
});



