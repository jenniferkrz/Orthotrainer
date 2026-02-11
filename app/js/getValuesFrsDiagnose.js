$(document).ready(function() {

    console.log("getValuesFRSDiagnose.js geladen");

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

    console.log("FallId:", fallId, "ResultId:", resultId, "Gruppe:", group, "Identifier:", identifier);

    // Beim Laden der Seite: Winkelwerte aus step_frs laden
    loadWinkelwerte();

    function loadWinkelwerte() {
        console.log("Lade Winkelwerte aus step_frs...");

        let obj = {
            id: fallId,
            result_id: resultId,
            gruppe: group,
            identifier: identifier
        };
        let post_data = JSON.stringify(obj);

        $.ajax({
            type: "POST",
            url: 'php/getValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function(result) {
                console.log("Winkelwerte geladen:", result);

                // Prüfe ob Debug-Modus (mit 'data' und 'debug' Feldern)
                let data = result;
                if (result.debug) {
                    console.log("=== DEBUG INFO ===");
                    console.log("Query:", result.debug.query);
                    console.log("Count:", result.debug.count);
                    console.log("fall_id:", result.debug.fall_id);
                    console.log("result_id:", result.debug.result_id);
                    console.log("identifier:", result.debug.identifier);
                    console.log("==================");
                    data = result.data;
                }

                // Mapping von field_id zu input_id
                const fieldMapping = {
                    'winkel_sna': 'winkel_sna',
                    'winkel_snb': 'winkel_snb',
                    'winkel_anb': 'winkel_anb',
                    'winkel_nlnsl': 'winkel_nlnsl',
                    'winkel_mlnsl': 'winkel_mlnsl',
                    'winkel_mlnl': 'winkel_mlnl',
                    'winkel_kieferw': 'winkel_kieferw',
                    'winkel_ioknl': 'winkel_ioknl',
                    'winkel_iukml': 'winkel_iukml',
                    'winkel_iokiuk': 'winkel_iokiuk',
                    'winkel_nsnpg': 'winkel_nsnpg',
                    'winkel_nasolabialw': 'winkel_nasolabialw'
                };

                if (data && Array.isArray(data) && data.length > 0) {
                    // Setze alle Winkelwerte in die Eingabefelder
                    data.forEach(item => {
                        if (fieldMapping[item.input_id]) {
                            const targetId = fieldMapping[item.input_id];
                            const $input = $("#" + targetId);

                            if ($input.length) {
                                $input.val(item.value);
                                console.log(`Setze ${targetId} = ${item.value}`);
                            } else {
                                console.warn(`Input-Feld nicht gefunden: ${targetId}`);
                            }
                        }
                    });
                } else {
                    // Keine Winkelwerte gefunden - setze "/" in alle Felder
                    console.warn("Keine Winkelwerte gefunden - setze '/' in alle Felder");
                    Object.values(fieldMapping).forEach(targetId => {
                        const $input = $("#" + targetId);
                        if ($input.length) {
                            $input.val('/');
                            console.log(`Setze ${targetId} = /`);
                        }
                    });
                }

                console.log("Alle Winkelwerte wurden gesetzt");
            },
            error: function(xhr, status, error) {
                console.error("Fehler beim Laden der Winkelwerte:");
                console.log("Status:", status);
                console.log("Error:", error);
                console.log("XHR Status:", xhr.status);
                console.log("Response:", xhr.responseText);
            }
        });
    }

});