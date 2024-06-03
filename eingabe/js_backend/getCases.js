$(document).ready(function () {

    //Anzahl der Datenbankeinträge abfragen und im Subheader angeben
    $.ajax({
        type: "POST",
        url: '../eingabe/php_backend/getCases.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: "POST",
        success: function (result) {
            let insert = "<div class='case_head'><div class='case_attr title'>Fallname</div><div class='case_attr description'>Fallbeschreibung</div><div class='case_attr model'>Dateiname Modell</div></div></div>";
            console.log(result);
             for (let i = 0; i <result.length; i++) {
                let res = result[i];
                insert = insert + "<div class='case' data-id="+res.id+"><div class='case_attr title'>"+res.title+"</div><div class='case_attr description'>"+res.description+"</div><div class='case_attr model'>"+res.model+"</div><div class='case_btns'><i class='fa fa-external-link-alt' aria-hidden='true'></i><a href='edit_orthopantogramm.html#"+res.id+"'><i class='fa fa-edit' aria-hidden='true'></i></a><i class='fa fa-trash-alt' aria-hidden='true'></i></div></div></div>";

            }

            $("#list_input").html(insert); 
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
          }
    });
});



