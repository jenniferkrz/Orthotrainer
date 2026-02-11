$(document).ready(function () {

    // Alle Fälle (Übungspatienten) laden
    $.ajax({
        type: "POST",
        url: 'php/getCases.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            let insert = "";
            console.log("Alle Fälle:", result);

            for (let i = 0; i < result.length; i++) {
                let res = result[i];
                // Teile den Titel in Vorname und Nachname
                let nameParts = res.title.split(' ');
                let firstName = nameParts[0] || '';
                let lastName = nameParts.slice(1).join(' ') || '';
                let nameHTML = firstName + '<br>' + lastName;

                if(result[i].active === "1"){
                    insert += "<div class='blue_case active' data-id=" + res.id + "><div data-id=" + res.id + " class='case_attr title'>" + nameHTML + "</div></div>";
                } else {
                    insert += "<div class='blue_case' data-id=" + res.id + "><div data-id=" + res.id + " class='case_attr title'>" + nameHTML + "</div></div>";
                }
            }

            $("#list_input").html(insert);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("Fehler beim Laden der Fälle:", xhr.status);
            console.log(thrownError);
        }
    });


});