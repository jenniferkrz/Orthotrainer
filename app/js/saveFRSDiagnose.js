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

                    // Rufe direkt die Lösungs-Funktion auf
                    console.log("Lade jetzt die Musterlösungen...");
                    loadAndShowSolutions();
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
// ========================================
// NEXT/BEENDEN BUTTON
// ========================================
    $(document).on("click", "#next_btn", function(e) {
        if ($(this).hasClass("inactive")) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        // Parse Hash: Fallnummer und Identifier trennen
        const hash = window.location.hash.substring(1); // z.B. "6-ident-undefined-undefined"
        const hashParts = hash.split("-");
        const fallId = hashParts[0]; // z.B. "6"
        const identifier = hashParts.slice(1).join("-"); // z.B. "ident-undefined-undefined"

        console.log("Hash:", hash);
        console.log("Fall ID:", fallId);
        console.log("Identifier:", identifier);

        // Baue die URL mit identifier Parameter
        const baseUrl = "https://emedia-medizin.rwth-aachen.de/app/ortho_campus/index.php";
        const fullUrl = baseUrl + "?identifier=" + encodeURIComponent(identifier);

        console.log("Navigiere zu:", fullUrl);
        window.location.href = fullUrl;
    });

    // ========================================
    // LÖSUNGEN LADEN UND ANZEIGEN
    // ========================================
    function loadAndShowSolutions() {
        console.log("loadAndShowSolutions() aufgerufen");

        let obj = { id: fallId };
        let post_data = JSON.stringify(obj);

        // Hole Musterlösungen
        $.ajax({
            type: "POST",
            url: 'php/getValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function (result) {
                console.log("Alle Musterlösungen geladen:", result);

                // Zeige Musterlösungen für alle Dropdown-Felder
                result.forEach(item => {
                    // Grad-Dropdowns
                    if (item.input_id.endsWith('_grad')) {
                        showDropdownSolution(item.input_id, item.value);
                    }
                    // Klasse-Dropdowns
                    else if (item.input_id.endsWith('_klasse')) {
                        showDropdownSolution(item.input_id, item.value);
                    }
                });

                // Buttons aktualisieren
                $("#next_btn").removeClass("inactive");
                $("#value_btn").addClass("inactive");

                console.log("Lösungen wurden angezeigt");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("Fehler beim Laden der Musterlösungen:", xhr.status, thrownError);
                alert("Fehler beim Laden der Musterlösungen: " + thrownError);
            }
        });
    }

    function showDropdownSolution(dropdownId, correctValue) {
        const $dropdown = $("#" + dropdownId);
        if (!$dropdown.length) {
            console.warn("Dropdown nicht gefunden:", dropdownId);
            return;
        }

        const studentValue = $dropdown.val();

        console.log(`Prüfe ${dropdownId}: Student="${studentValue}", Richtig="${correctValue}"`);

        // Erstelle ein Wrapper-Div um das Dropdown, falls noch nicht vorhanden
        if (!$dropdown.parent().hasClass('dropdown-solution-wrapper')) {
            $dropdown.wrap('<div class="dropdown-solution-wrapper" style="position:relative;"></div>');
        }

        const $wrapper = $dropdown.parent();

        // Vergleiche Werte
        const isCorrect = studentValue === correctValue;

        if (isCorrect) {
            // RICHTIG: Grüner Rahmen
            $dropdown.css({
                'border': '2px solid #67ff18',
                'background': 'rgba(103, 255, 24, 0.1)'
            });

            // Füge grünes Häkchen hinzu
            if (!$wrapper.find('.solution-icon').length) {
                $wrapper.append(`
                    <span class="solution-icon" style="
                        position: absolute;
                        right: 8px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #67ff18;
                        font-weight: bold;
                        font-size: 16px;
                        pointer-events: none;
                    ">✓</span>
                `);
            }

            console.log(`${dropdownId}: RICHTIG!`);
        } else {
            // FALSCH: Roter Rahmen
            $dropdown.css({
                'border': '2px solid #ff0000',
                'background': 'rgba(255, 0, 0, 0.1)'
            });



            // Zeige die korrekte Antwort unter dem Dropdown
            if (!$wrapper.find('.correct-answer').length) {
                // Finde den Text der korrekten Option
                const correctText = $dropdown.find(`option[value="${correctValue}"]`).text() || correctValue;

                $wrapper.append(`
                    <div class="correct-answer" style="
                        margin-top: 4px;
                        padding: 4px 8px;
                        background: #fff3cd;
                        border: 1px solid #ffc107;
                        border-radius: 3px;
                        font-size: 12px;
                        color: #856404;
                    ">Richtig: ${correctText}</div>
                `);

                // Füge Margin zum nächsten Element hinzu, um Überlappung zu vermeiden
                $wrapper.css('margin-bottom', '30px');
            }

            console.log(`${dropdownId}: FALSCH - Student: "${studentValue}", Richtig: "${correctValue}"`);
        }

        // Deaktiviere das Dropdown
        $dropdown.prop('disabled', true);
        $dropdown.css('cursor', 'not-allowed');
    }

});