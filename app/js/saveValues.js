$(document).ready(function () {

    $(document).on("click","#next_btn",function(e) {
       
        let inputs = document.getElementsByTagName("input");
        console.log(inputs);

        let obj = {};
        obj["fall_id"] =  window.location.hash.substring(1).split("-")[0];
        obj["result_id"] =  window.location.hash.substring(1).split("-")[1];
        for (let i = 0; i <inputs.length; i++) {
            let input = inputs[i];
            console.log(input.value);
            console.log(input.id);
            obj[input.id] = input.value;
        }
        console.log(obj);
        let post_data = JSON.stringify(obj);
        console.log(post_data);

        // $.ajax({
        //     type: "POST",
        //     url: 'saveValues.php',
        //     contentType: "application/json; charset=utf-8",
        //     dataType: "json",
        //     data: post_data,
        //     type: "POST",
        //     success: function (result) {
        //         console.log(result);
        //         if(result === "Updated"){
        //             let href = $(e.target).attr("data-href") + "#" + window.location.hash.substring(1)
        //             window.location.href = href;
        //         }else{
        //             alert("Leider ist ein Fehler aufgetreten, bitte Seite neu laden.")
        //         }
        //     },
        //     error: function (xhr, ajaxOptions, thrownError) {
        //         console.log(xhr.status);
        //         console.log(thrownError);
        //       }
        // });

        //window.location.href = $(e.target).attr("data-href");
    
    });

});



