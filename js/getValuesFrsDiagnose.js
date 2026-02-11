$(document).ready(function () {

    console.log("TEST - Script geladen");

    const fallId = window.location.hash.substring(1).split("-")[0];
    const resultId = window.location.hash.substring(1).split("-")[1];
    const group = window.location.hash.substring(1).split("-")[2];
    const identifier = window.location.hash.substring(1).split("-")[3] + "-" +
        window.location.hash.substring(1).split("-")[4] + "-" +
        window.location.hash.substring(1).split("-")[5];

    console.log("FallId:", fallId);

    // Beim Laden der Seite: Musterlösungen für basale Werte laden und anzeigen
    // WICHTIG: Warte bis die Skalen initialisiert sind
    // Die Skalen werden im HTML mit DOMContentLoaded initialisiert
    // Wir müssen länger warten, damit sie fertig sind
    setTimeout(function() {
        console.log("Versuche Musterlösungen zu laden...");
        loadBasalMusterlösungen();
    }, 500); // Erhöht auf 1 Sekunde

    // ========================================
    // BASALE WERTE BEIM LADEN ANZEIGEN
    // ========================================
    function loadBasalMusterlösungen() {
        console.log("loadBasalMusterlösungen() aufgerufen");

        let obj = { id: fallId };
        let post_data = JSON.stringify(obj);

        console.log("Sende Request mit:", post_data);

        $.ajax({
            type: "POST",
            url: 'php/getValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function (result) {
                console.log("Musterlösungen geladen:", result);

                // Setze basale Werte direkt in die Skalen
                result.forEach(item => {
                    if (item.input_id === "midline_ok_basal") {
                        console.log("OK Basal gefunden:", item.value);
                        // Setze Wert DIREKT im Input (BEVOR die Skala initialisiert wird wäre ideal)
                        $("#midline_ok_basal").val(item.value);
                        console.log("OK Basal Input gesetzt auf:", $("#midline_ok_basal").val());

                        // Rufe die interne setValue Funktion auf, indem wir einen Klick simulieren
                        // oder besser: direktes Trigger mit dem Wert
                        const $scale = $("#scale_ok_basal");
                        const value = parseFloat(item.value);

                        // Berechne Position wie in initMidlineScale
                        const min = -10, max = 10;
                        const span = max - min;
                        const pct = ((value - min) / span) * 96 + 2;

                        console.log(`OK Basal - Wert: ${value}, Position: ${pct}%`);

                        // Setze Indikator-Position manuell
                        $scale.find('.ml-indicator').css('left', pct + '%');

                        // Deaktiviere die Skala
                        setTimeout(() => disableScale('scale_ok_basal'), 100);

                    } else if (item.input_id === "midline_uk_basal") {
                        console.log("UK Basal gefunden:", item.value);
                        // Setze Wert DIREKT im Input
                        $("#midline_uk_basal").val(item.value);
                        console.log("UK Basal Input gesetzt auf:", $("#midline_uk_basal").val());

                        const $scale = $("#scale_uk_basal");
                        const value = parseFloat(item.value);

                        // Berechne Position wie in initMidlineScale
                        const min = -10, max = 10;
                        const span = max - min;
                        const pct = ((value - min) / span) * 96 + 2;

                        console.log(`UK Basal - Wert: ${value}, Position: ${pct}%`);

                        // Setze Indikator-Position manuell
                        $scale.find('.ml-indicator').css('left', pct + '%');

                        // Deaktiviere die Skala
                        setTimeout(() => disableScale('scale_uk_basal'), 100);
                    }
                });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("AJAX Fehler beim Laden der Musterlösungen:", xhr.status, thrownError);
                console.log("Response:", xhr.responseText);
            }
        });
    }

    // ========================================
    // LÖSUNGEN ANZEIGEN BUTTON
    // ========================================
    $(document).on("click", "#value_btn", function (e) {
        e.preventDefault();

        // Prüfe ob alle dentalen Felder ausgefüllt sind
        let dentalFilled = checkDentalFields();
        if (!dentalFilled) {
            alert("Bitte füllen Sie die dentalen Felder (Oberkiefer und Unterkiefer) aus!");
            return;
        }

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
                console.log("Alle Musterlösungen:", result);

                // Entferne alte Lösungsanzeigen
                $('.loesung_cont').remove();

                // Zeige Musterlösungen für dentale Werte
                result.forEach(item => {
                    if (item.input_id === "midline_ok_dental") {
                        showSolution('scale_ok_dental', 'midline_ok_dental', item.value);
                    } else if (item.input_id === "midline_uk_dental") {
                        showSolution('scale_uk_dental', 'midline_uk_dental', item.value);
                    }
                });

                // Buttons aktualisieren
                $("#next_btn").removeClass("inactive");
                $("#value_btn").addClass("inactive");
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log("Fehler:", xhr.status, thrownError);
                alert("Fehler beim Laden der Musterlösungen: " + thrownError);
            }
        });
    });

    // ========================================
    // HILFSFUNKTIONEN
    // ========================================

    function disableScale(scaleId) {
        const $scale = $("#" + scaleId);
        if ($scale.length) {
            console.log("Deaktiviere Skala:", scaleId);

            // Deaktiviere alle Klick-Buttons
            $scale.find('.ml-hit').each(function() {
                $(this).prop('disabled', true);
                $(this).css({
                    'cursor': 'not-allowed',
                    'pointer-events': 'none'
                });
            });

            // Visuelles Feedback: Nur bestimmte Elemente ausgrauen, NICHT die Ticks
            $scale.find('.ml-indicator').css('opacity', '0.5');
            $scale.find('.ml-hit').css('opacity', '0.5');

            // Verhindere Interaktion
            $scale.css('pointer-events', 'none');

            // Entferne Tabindex für Keyboard-Navigation
            $scale.attr('tabindex', '-1');

            // Ändere Indikator-Farbe zu grau
            $scale.find('.ml-indicator').css({
                'background': 'rgba(128,128,128,.15)',
                'border-color': '#888'
            });

            // Füge ein Label hinzu
            if (!$scale.find('.ml-locked-label').length) {
                /*    $scale.append('<div class="ml-locked-label" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(255,255,255,0.9); padding:4px 8px; border-radius:4px; font-size:11px; color:#666; pointer-events:none; font-weight:600;">Musterlösung</div>');*/
            }
        }
    }

    function checkDentalFields() {
        const okDental = $("#midline_ok_dental").val();
        const ukDental = $("#midline_uk_dental").val();

        return okDental !== "" && ukDental !== "";
    }

    function showSolution(scaleId, inputId, musterloesung) {
        const studentValue = $("#" + inputId).val();
        const $scale = $("#" + scaleId);

        if ($scale.length) {
            const studentVal = parseFloat(studentValue);
            const correctVal = parseFloat(musterloesung);

            console.log(`Zeige Lösung für ${inputId}: Student=${studentVal}, Musterlösung=${correctVal}`);

            // Berechne Positionen
            const min = -10, max = 10;
            const span = max - min;

            // Position der Musterlösung
            const correctPct = ((correctVal - min) / span) * 96 + 2;

            // Füge grünen Indikator für Musterlösung hinzu
            if (!$scale.find('.ml-solution-indicator').length) {
                const solutionIndicator = `
                    <div class="ml-solution-indicator" style="
                        position: absolute;
                        top: 3px;
                        bottom: 3px;
                        width: 12px;
                        left: ${correctPct}%;
                        transform: translateX(-50%);
                        background: rgba(103, 255, 24, 0.3);
                        border: 2px solid #67ff18;
                        border-radius: 6px;
                        pointer-events: none;
                        z-index: 10;
                    "></div>
                `;
                $scale.append(solutionIndicator);

                // Füge einen grünen Marker/Pfeil über der Position hinzu
                const marker = `
                    <div class="ml-solution-marker" style="
                        position: absolute;
                        top: -8px;
                        left: ${correctPct}%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 8px solid #67ff18;
                        pointer-events: none;
                        z-index: 11;
                    "></div>
                `;
                $scale.append(marker);
            }

            // Wenn Student falsch liegt, ändere dessen Indikator zu rot
            if (Math.abs(studentVal - correctVal) > 0.1) {
                $scale.find('.ml-indicator').css({
                    'background': 'rgba(255, 0, 0, 0.15)',
                    'border-color': '#ff0000'
                });
                console.log(`${inputId}: FALSCH - Student: ${studentVal}, Richtig: ${correctVal}`);
            } else {
                // Richtig: Indikator grün machen
                $scale.find('.ml-indicator').css({
                    'background': 'rgba(103, 255, 24, 0.15)',
                    'border-color': '#67ff18'
                });
                console.log(`${inputId}: RICHTIG!`);
            }

            // Deaktiviere die Skala nach dem Anzeigen der Lösung
            setTimeout(() => {
                $scale.find('.ml-hit').prop('disabled', true).css('pointer-events', 'none');
                $scale.css('pointer-events', 'none');
            }, 100);
        }
    }

});