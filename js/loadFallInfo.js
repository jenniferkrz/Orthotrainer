$(document).ready(function () {

    let fall = window.location.hash.substring(1).split("-")[0];
    let res = window.location.hash.substring(1).split("-")[1];
    let group = window.location.hash.substring(1).split("-")[2];
    let identifier = window.location.hash.substring(1).split("-")[3] + "-" + window.location.hash.substring(1).split("-")[4] + "-" + window.location.hash.substring(1).split("-")[5];


    $(document).on("click",".step_container",function(e) {

        let link = $(e.target).attr("data-href") + "#" + fall;

        window.location.href = link;
    
    });

    $(document).on("click","#next_btn",function(e) {

        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res + "-" + group + "-" + identifier;

        saveValues(link);
        //window.location.href = link;
    });

    $(document).on("click","#next_btn_end",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res;

        window.location.href = link;
    });




    function saveValues(link){
        let inputs = document.getElementsByTagName("input");
        let textareas = document.getElementsByTagName("textarea");

        console.log(inputs);
        console.log(textareas);

        let obj = {};
        obj["fall_id"] =  window.location.hash.substring(1).split("-")[0];
        obj["result_id"] =  window.location.hash.substring(1).split("-")[1];
        obj["gruppe"] =  window.location.hash.substring(1).split("-")[2];
        obj["identifier"] =  window.location.hash.substring(1).split("-")[3] + "-" + window.location.hash.substring(1).split("-")[4] + "-" + window.location.hash.substring(1).split("-")[5];

        for (let i = 0; i <inputs.length; i++) {
            let input = inputs[i];
            obj[input.id] = input.value;
        }
        for (let i = 0; i <textareas.length; i++) {
            let input = textareas[i];
            obj[input.id] = input.value;
        }
        console.log(obj);
        let post_data = JSON.stringify(obj);
        console.log(post_data);

        $.ajax({
            type: "POST",
            url: 'js/saveValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            type: "POST",
            success: function (result) {
                console.log(result);
                if(result === "Inserted"){
                    window.location.href = link;
                 }else{
                    console.log(result);
                    //alert("Leider ist ein Fehler aufgetreten, bitte Seite neu laden.")
                }
            },
            error:  function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });

    }


});



