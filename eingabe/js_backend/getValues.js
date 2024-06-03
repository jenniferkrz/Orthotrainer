$(document).ready(function () {

    let obj = {id: window.location.hash.substring(1)};
        let post_data = JSON.stringify(obj);
    //Anzahl der Datenbankeinträge abfragen und im Subheader angeben
    $.ajax({
        type: "POST",
        url: '../eingabe/php_backend/getValues.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: post_data,
        type: "POST",
        success: function (result) {
            console.log(result);
            for (let i = 0; i <result.length; i++) {
                let res = result[i];
                let id = "#"+res.input_id;
                if( $(id).length ){
                    $(id).val(res.value);
                }
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
          }
    });
});



