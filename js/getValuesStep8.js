$(document).ready(function () {


    $(document).on("click", "#value_btn", function (e) {

        let err = 0;
       let inputs = document.getElementsByTagName("input");
       for (let i = 0; i < inputs.length; i++) {
        if(inputs[i].value.length <= 0){
 
            if($($(inputs[i]).parent(".input_cont")[0]).hasClass("grey") || $($(inputs[i]).is(":disabled"))){
                continue;
            }else{
                alert("Bitte alle Felder ausfüllen!");
                err = 1;
                break;
            }
        }
        }

        if(err === 0){
            let obj = { id: window.location.hash.substring(1).split("-")[0] };
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
                    for (let i = 0; i < result.length; i++) {
                        let res = result[i];
                        let id = "#" + res.input_id;
                        if (res.input_id === "kig") {
                            $(id).parent(".input_cont").after('<div id="'+res.input_id+'" class="loesung_cont loesung_center"><div class="loesung">Musterlösung: ' + res.value + '</div></div>');
                        }else{
                            $(id).parent(".input_cont").after('<div id="'+res.input_id+'" class="loesung_cont"><div class="loesung">Musterlösung: ' + res.value + '</div></div>');
                        }

                    }
                    $("#next_btn").removeClass("inactive");
                    $("#value_btn").addClass("inactive");
    
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log(xhr.status);
                    console.log(thrownError);
                }
            });
        }
    });
});



