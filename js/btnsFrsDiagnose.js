$(document).ready(function() {

    const fallId = window.location.hash.substring(1).split("-")[0];
    const resultId = window.location.hash.substring(1).split("-")[1];
    const group = window.location.hash.substring(1).split("-")[2];

    // Bessere identifier-Verarbeitung
    const hashParts = window.location.hash.substring(1).split("-");
    let identifier = '';
    if (hashParts.length >= 6) {
        const id_parts = [hashParts[3], hashParts[4], hashParts[5]].filter(part => part && part !== 'undefined');
        identifier = id_parts.join('-');
    } else if (hashParts.length >= 4) {
        identifier = hashParts[3];
    }

    console.log("FallId:", fallId, "ResultId:", resultId, "Gruppe:", group, "Identifier:", identifier);

    // Speichern bei nächster Schritt Button
    $(document).on("click", "#next_btn", function(e) {
        if ($(this).hasClass("inactive")) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        // Sammle Werte
        const midline_ok_dental = $("#midline_ok_dental").val();
        const midline_uk_dental = $("#midline_uk_dental").val();

        // Validierung
        if (!midline_ok_dental || !midline_uk_dental) {
            alert("Bitte füllen Sie beide dentalen Felder aus!");
            return;
        }

        const dataToSave = {
            fall_id: fallId,
            result_id: resultId,
            gruppe: group,
            identifier: identifier,
            midline_ok_dental: midline_ok_dental,
            midline_uk_dental: midline_uk_dental
        };

        console.log("Zu speichernde Werte:", dataToSave);

        // AJAX Request mit verbessertem Error Handling
        $.ajax({
            type: "POST",
            url: 'php/saveValuesStep8.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(dataToSave),
            timeout: 10000, // 10 Sekunden Timeout
            success: function(response) {
                console.log("Speicher-Erfolg:", response);

                if (response.success) {
                    console.log("Erfolgreich gespeichert:", response);

                    // Navigiere zur nächsten Seite
                    const nextHref = $("#next_btn").attr("data-href");
                    if (nextHref) {
                        window.location.href = nextHref + window.location.hash;
                    }
                } else {
                    console.error("Speichern fehlgeschlagen:", response.error);
                    alert("Fehler beim Speichern: " + (response.error || "Unbekannter Fehler"));
                }
            },
            error: function(xhr, status, error) {
                console.log("AJAX Error Details:");
                console.log("Status:", status);
                console.log("Error:", error);
                console.log("XHR Status:", xhr.status);
                console.log("XHR Response:", xhr.responseText);

                let errorMsg = "Fehler beim Speichern:\n";

                if (xhr.status === 0) {
                    errorMsg += "Keine Verbindung zum Server. Prüfen Sie:\n";
                    errorMsg += "- Ist der Pfad 'php/saveValuesStep8.php' korrekt?\n";
                    errorMsg += "- Läuft der Server?\n";
                    errorMsg += "- Gibt es CORS-Probleme?";
                } else if (xhr.status === 404) {
                    errorMsg += "Datei nicht gefunden (404)\n";
                    errorMsg += "Pfad: php/saveValuesStep8.php";
                } else if (xhr.status === 500) {
                    errorMsg += "Server-Fehler (500)\n";
                    errorMsg += "Response: " + xhr.responseText.substring(0, 200);
                } else {
                    errorMsg += "Status: " + xhr.status + "\n";
                    errorMsg += "Error: " + error;
                }

                alert(errorMsg);
                console.error("Speicher-Fehler:", xhr.status, error);
            }
        });
    });

    // Value Button Click Handler (falls vorhanden)
    $(document).on("click", "#value_btn", function(e) {
        e.preventDefault();
        console.log("Value Button geklickt");
        // Hier könnte Code für "Lösungen anzeigen" stehen
    });

});