$(document).ready(function () {

    $(document).on("click", "#value_btn", function (e) {
        let obj = { id: window.location.hash.substring(1).split("-")[0] };
        let post_data = JSON.stringify(obj);

        $.ajax({
            type: "POST",
            url: 'php/getValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function (result) {

                // Zuerst alle Input-Felder vorbereiten
                $('input').each(function () {
                    let input = $(this);
                    // Nur wenn noch kein loesung_cont vorhanden ist
                    if (input.parent('.input_cont').next('.loesung_cont').length === 0) {
                        input.parent('.input_cont').after('<div class="loesung_cont"><div class="loesung"></div></div>');
                    }
                });

                // Jetzt die Lösungen einfüllen
                for (let i = 0; i < result.length; i++) {
                    let res = result[i];
                    let id = "#" + res.input_id;
                    let loesungDiv = $(id).parent(".input_cont").next('.loesung_cont').find('.loesung');
                    loesungDiv.text(res.value);
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
