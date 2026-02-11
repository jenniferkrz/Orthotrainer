$(document).ready(function () {

    console.log("loadFallInfo.js geladen");

    // Parse Hash: #fallId oder #fallId-identifier
    const hash = window.location.hash.substring(1);
    const hashParts = hash.split("-");
    const fallId = hashParts[0];
    const identifier = hashParts.length > 1 ? hashParts.slice(1).join("-") : "";

    console.log("Fall ID:", fallId);
    console.log("Identifier:", identifier);

    if (!fallId) {
        $("#fall-content").html('<div class="loading">Keine Fall-ID gefunden. Bitte wählen Sie einen Fall aus.</div>');
        return;
    }

    // Lade Fallinformationen
    loadFallData(fallId);

    // Start Button Click Handler
    $(document).on("click", "#start_btn", function(e) {
        e.preventDefault();

        // Baue die URL für den ersten Step
        let nextUrl = "step0_0.html#" + fallId;

        if (identifier) {
            nextUrl += "-" + identifier;
        }

        console.log("Navigiere zu:", nextUrl);
        window.location.href = nextUrl;
    });

    function loadFallData(fallId) {
        console.log("Lade Fall Daten für ID:", fallId);

        let obj = { id: fallId };
        let post_data = JSON.stringify(obj);

        $.ajax({
            type: "POST",
            url: 'php/getFallInfo.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function (result) {
                console.log("Fall Daten geladen:", result);

                if (result.error) {
                    $("#fall-content").html('<div class="loading">Fehler: ' + result.error + '</div>');
                    return;
                }

                // Baue HTML
                let html = '';

                // Header mit Bild und Text
                html += '<div class="fall-header">';

                // Bild
                html += '<div class="fall-image">';
                html += '<img src="images/front' + fallId + '.png" alt="Fall ' + fallId + '" onerror="this.style.display=\'none\'">';
                html += '</div>';

                // Text
                html += '<div class="fall-text">';

                // Titel
                if (result.title) {
                    html += '<h2>' + escapeHtml(result.title) + '</h2>';
                }

                // Alter
                if (result.age) {
                    html += '<p class="fall-age"> ' + escapeHtml(result.age) + '</p>';
                }

                // Beschreibung
                if (result.description) {
                    html += '<p>' + escapeHtml(result.description) + '</p>';
                }

                html += '</div>'; // fall-text
                html += '</div>'; // fall-header

                // Anamnese
                if (result.anamnese) {
                    html += '<div class="info-section">';
                    html += '<h3>Anamnese</h3>';
                    html += '<p>' + escapeHtml(result.anamnese) + '</p>';
                    html += '</div>';
                }

                // Dentale Entwicklung
                if (result.dental_entw) {
                    html += '<div class="info-section">';
                    html += '<h3>Dentale Entwicklung</h3>';
                    html += '<p>' + escapeHtml(result.dental_entw) + '</p>';
                    html += '</div>';
                }

                // Skelettale Entwicklung
                if (result.skelettal_entw) {
                    html += '<div class="info-section">';
                    html += '<h3>Skelettale Entwicklung</h3>';
                    html += '<p>' + escapeHtml(result.skelettal_entw) + '</p>';
                    html += '</div>';
                }

                $("#fall-content").html(html);
            },
            error: function (xhr, status, error) {
                console.log("AJAX Error:");
                console.log("Status:", status);
                console.log("Error:", error);
                console.log("Response:", xhr.responseText);

                $("#fall-content").html('<div class="loading">Fehler beim Laden der Fallinformationen.</div>');
            }
        });
    }

    // Hilfsfunktion zum Escapen von HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

});