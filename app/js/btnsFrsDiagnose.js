$(document).ready(function() {

    const fallId = window.location.hash.substring(1).split("-")[0];
    const resultId = window.location.hash.substring(1).split("-")[1];
    const group = window.location.hash.substring(1).split("-")[2];

    // Identifier NICHT bereinigen - direkt aus URL übernehmen
    const hashParts = window.location.hash.substring(1).split("-");
    let identifier = '';
    if (hashParts.length >= 6) {
        // Nimm Teile 3, 4, 5 direkt wie sie sind
        identifier = hashParts[3] + '-' + hashParts[4] + '-' + hashParts[5];
    } else if (hashParts.length >= 4) {
        identifier = hashParts[3];
    }

    console.log("saveFRSDiagnose.js - FallId:", fallId, "ResultId:", resultId, "Gruppe:", group, "Identifier:", identifier);

    // Speichern bei "Lösungen anzeigen" Button (vor dem Anzeigen der Lösungen)
    $(document).on("click", "#value_btn", function(e) {
        e.preventDefault();

        // Sammle alle Dropdown-Werte
        const dataToSave = {
            fall_id: fallId,
            result_id: resultId,
            gruppe: group,
            identifier: identifier,
            // SNA
            sna_grad: $("#sna_grad").val() || '',
            sna_klasse: $("#sna_klasse").val() || '',
            // SNB
            snb_grad: $("#snb_grad").val() || '',
            snb_klasse: $("#snb_klasse").val() || '',
            // ANB
            anb_grad: $("#anb_grad").val() || '',
            anb_klasse: $("#anb_klasse").val() || '',
            // NL-NSL
            nlnsl_grad: $("#nlnsl_grad").val() || '',
            nlnsl_klasse: $("#nlnsl_klasse").val() || '',
            // ML-NSL
            mlnsl_grad: $("#mlnsl_grad").val() || '',
            mlnsl_klasse: $("#mlnsl_klasse").val() || '',
            // ML-NL
            mlnl_grad: $("#mlnl_grad").val() || '',
            mlnl_klasse: $("#mlnl_klasse").val() || '',
            // Kieferwinkel
            kieferw_grad: $("#kieferw_grad").val() || '',
            kieferw_klasse: $("#kieferw_klasse").val() || '',
            // IOK-NL
            ioknl_grad: $("#ioknl_grad").val() || '',
            ioknl_klasse: $("#ioknl_klasse").val() || '',
            // IUK-ML
            iukml_grad: $("#iukml_grad").val() || '',
            iukml_klasse: $("#iukml_klasse").val() || '',
            // IOK-IUK
            iokiuk_grad: $("#iokiuk_grad").val() || '',
            iokiuk_klasse: $("#iokiuk_klasse").val() || '',
            // N'-Sn-Pg'
            nsnpg_grad: $("#nsnpg_grad").val() || '',
            nsnpg_klasse: $("#nsnpg_klasse").val() || '',
            // Nasolabialwinkel
            nasolabial_grad: $("#nasolabial_grad").val() || '',
            nasolabial_klasse: $("#nasolabial_klasse").val() || ''
        };

        console.log("Zu speichernde FRS Diagnose Werte:", dataToSave);

        // AJAX Request mit verbessertem Error Handling
        $.ajax({
            type: "POST",
            url: 'php/saveValuesFRSDiagnose.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(dataToSave),
            timeout: 10000, // 10 Sekunden Timeout
            success: function(response) {
                console.log("Speicher-Erfolg:", response);

                if (response.success === true) {
                    console.log("Erfolgreich gespeichert:", response);

                    // Trigger das Laden und Anzeigen der Lösungen
                    // Das wird vom btnsFRSDiagnose.js übernommen
                    $(document).trigger('frs-diagnose-saved');
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
                    errorMsg += "Keine Verbindung zum Server.";
                } else if (xhr.status === 404) {
                    errorMsg += "Datei nicht gefunden (404)\n";
                    errorMsg += "Pfad: php/saveValuesFRSDiagnose.php";
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

});