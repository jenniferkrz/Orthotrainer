$(document).ready(function () {

    //Anzahl der Datenbankeinträge abfragen und im Subheader angeben
    $.ajax({
        type: "POST",
        url: 'php/getCases.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        type: "POST",
        success: function (result) {
            let insert = "";
            console.log(result);
             for (let i = 0; i <result.length; i++) {
                let res = result[i];
                insert = insert + "<div class='blue_case' data-id="+res.id+"><div class='case_attr title'>"+res.title+"</div></div>";

            }

            $("#list_input").html(insert); 
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
          }
    });
});



