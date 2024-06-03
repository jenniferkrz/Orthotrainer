$(document).ready(function () {

    $(document).on("click","#value_btn",function(e) {

        let obj = {id: window.location.hash.substring(1)};
        let post_data = JSON.stringify(obj);
        //Anzahl der Datenbankeinträge abfragen und im Subheader angeben
        $.ajax({
            type: "POST",
            url: 'php/getValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            type: "POST",
            success: function (result) {
                for (let i = 0; i <result.length; i++) {
                    let res = result[i];
                    console.log(res);
                    let id = "#"+res.input_id;
                    $(id).parent(".input_cont").after('<div class="loesung_cont"><div class="loesung">Musterlösung: '+res.value+'</div></div>');
                }
                $("#next_btn").removeClass("inactive");
                $("#value_btn").addClass("inactive");

            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
              }
        });
    });


});



