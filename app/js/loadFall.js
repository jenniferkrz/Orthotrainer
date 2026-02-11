$(document).ready(function () {

    // Fallnummer aus URL-Hash auslesen und Identifier entfernen
    const hash = window.location.hash.substring(1);
    const hashParts = hash.split("-");
    const fall = hashParts[0]; // Nur die Fallnummer, ohne Identifier

    // Patientenname laden
    let obj = { id: fall };
    let post_data = JSON.stringify(obj);

    $.ajax({
        type: "POST",
        url: 'php/getCaseInfo.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: post_data,
        success: function (result) {
            if (result.title) {
                // Teile den Namen in Vor- und Nachname
                let nameParts = result.title.split(' ');
                let firstName = nameParts[0] || '';
                let lastName = nameParts.slice(1).join(' ') || '';
                let age_str = result.age.split(":")[1];

                $('#patientName').html(firstName + ' ' + lastName + " (" + age_str + ")");
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("Fehler beim Laden des Patientennamens:", thrownError);
        }
    });


});



