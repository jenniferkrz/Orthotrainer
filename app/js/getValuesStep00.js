$(document).ready(function () {

    $(document).on("click", "#value_btn", function (e) {

        let err = 0;

        // Prüfe Radio-Button-Gruppen
        const radioGroups = ['gebisstyp', 'durchbruch_anomalien', 'zahn_anomalien', 'dental_entwicklung', 'skelettal_entwicklung'];

        for (let groupName of radioGroups) {
            const radioButtons = document.querySelectorAll(`input[name="${groupName}"]`);
            let isChecked = false;

            radioButtons.forEach(radio => {
                if (radio.checked) {
                    isChecked = true;
                }
            });

        }

        if(err === 0){
            // Parse Hash: nur Fallnummer, ohne Identifier
            const hash = window.location.hash.substring(1);
            const fallId = hash.split("-")[0];

            let obj = { id: fallId };
            let post_data = JSON.stringify(obj);

            $.ajax({
                type: "POST",
                url: 'php/getValues.php',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: post_data,
                success: function (result) {
                    console.log("Musterlösungen geladen:", result);

                    for (let i = 0; i < result.length; i++) {
                        let res = result[i];

                        // Prüfe ob es eine Radio-Button-Gruppe ist
                        let radioGroup = $('input[type="radio"][name="' + res.input_id + '"]');

                        if (radioGroup.length > 0) {
                            // Es ist eine Radio-Button-Gruppe
                            const fieldGroup = radioGroup.first().closest('.field_group, .subsection');

                            // Entferne alte Lösung falls vorhanden
                            fieldGroup.find('.loesung_cont').remove();

                            // Finde das Label für den Wert
                            const selectedRadio = radioGroup.filter('[value="' + res.value + '"]');
                            let valueLabel = res.value;

                            if (selectedRadio.length > 0) {
                                const label = $('label[for="' + selectedRadio.attr('id') + '"]');
                                if (label.length > 0) {
                                    valueLabel = label.text();
                                }
                            }

                            // Füge Musterlösung hinzu
                            fieldGroup.after('<div class="loesung_cont"><div class="loesung">Musterlösung: ' + valueLabel + '</div></div>');
                        } else {
                            // Normales Input-Feld (falls vorhanden)
                            let id = "#" + res.input_id;
                            if ($(id).length) {
                                $(id).parent(".input_cont").after('<div class="loesung_cont"><div class="loesung">Musterlösung: ' + res.value + '</div></div>');
                            }
                        }
                    }

                    $("#next_btn").removeClass("inactive");
                    $("#value_btn").addClass("inactive");
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("Fehler beim Laden der Musterlösungen:");
                    console.log(xhr.status);
                    console.log(thrownError);
                }
            });
        }
    });
});