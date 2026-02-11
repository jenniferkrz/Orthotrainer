/**
 * reviewModeSlider.js - Schieberegler-Unterstützung für Review-Modus
 *
 * Zeigt User-Eingaben (blau) und Musterlösungen (grün) auf Midline-Skalen.
 * Nur auf Seiten einbinden, die Slider haben (z.B. step8.html).
 *
 * Voraussetzung: reviewMode.js muss vorher geladen sein!
 */

$(document).ready(function() {
    console.log("reviewModeSlider: Script geladen");

    // Warte bis Skalen initialisiert sind (DOMContentLoaded im HTML)
    setTimeout(function() {
        console.log("reviewModeSlider: Prüfe Review-Modus...");

        // Prüfe ob Review-Modus aktiv (von reviewMode.js gesetzt)
        if (!window.reviewMode || !window.reviewMode.active) {
            console.log("reviewModeSlider: Review-Modus nicht aktiv, beende");
            return;
        }

        console.log("reviewModeSlider: Review-Modus aktiv!");
        console.log("reviewModeSlider: fall_id =", window.reviewMode.fall_id);
        console.log("reviewModeSlider: result_id =", window.reviewMode.result_id);

        const fall_id = window.reviewMode.fall_id;
        const result_id = window.reviewMode.result_id;

        // Slider-Review initialisieren
        initSliderReview(fall_id, result_id);

    }, 800); // Längere Verzögerung damit Skalen fertig initialisiert sind
});

/**
 * Initialisiert die Slider für den Review
 */
function initSliderReview(fall_id, result_id) {
    console.log("reviewModeSlider: initSliderReview() gestartet");

    // Slider-Konfiguration
    const sliderConfigs = [
        { scaleId: 'scale_ok_basal', inputId: 'midline_ok_basal', label: 'OK Basal' },
        { scaleId: 'scale_ok_dental', inputId: 'midline_ok_dental', label: 'OK Dental' },
        { scaleId: 'scale_uk_dental', inputId: 'midline_uk_dental', label: 'UK Dental' },
        { scaleId: 'scale_uk_basal', inputId: 'midline_uk_basal', label: 'UK Basal' }
    ];

    // Prüfe ob Slider vorhanden sind
    sliderConfigs.forEach(function(config) {
        const $scale = $('#' + config.scaleId);
        const $input = $('#' + config.inputId);
        console.log(`reviewModeSlider: ${config.scaleId} gefunden:`, $scale.length > 0);
        console.log(`reviewModeSlider: ${config.inputId} gefunden:`, $input.length > 0);
    });

    const hasSliders = sliderConfigs.some(config => $('#' + config.scaleId).length > 0);
    if (!hasSliders) {
        console.log("reviewModeSlider: Keine Slider auf dieser Seite gefunden, beende");
        return;
    }

    // Legende hinzufügen
    addSliderLegend();

    // Musterlösungen laden (zuerst, damit wir wissen was richtig ist)
    loadSolutionSliderData(fall_id, sliderConfigs, function(solutions) {
        // Dann User-Daten laden
        loadUserSliderData(fall_id, result_id, sliderConfigs, solutions);
    });
}

/**
 * Fügt Legende für Slider-Farben hinzu
 */
function addSliderLegend() {
    const $table = $('.ml-table');
    if ($table.length === 0) {
        console.log("reviewModeSlider: .ml-table nicht gefunden für Legende");
        return;
    }

    // Prüfe ob Legende schon existiert
    if ($('.slider_legend').length > 0) return;

    const legend = $(`
        <div class="slider_legend" style="
            display: flex;
            gap: 20px;
            padding: 10px 15px;
            background: #f8f9fa;
            border-radius: 6px;
            margin: 10px 0;
            font-size: 13px;
            font-family: 'Public Sans', sans-serif;
        ">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; border: 2px solid #2684ff; background: rgba(38,132,255,.15); border-radius: 4px;"></div>
                <span>Ihre Eingabe</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; border: 2px solid #67ff18; background: rgba(103,255,24,.15); border-radius: 4px;"></div>
                <span>Musterlösung</span>
            </div>
        </div>
    `);

    $table.before(legend);
    console.log("reviewModeSlider: Legende hinzugefügt");
}

/**
 * Lädt Musterlösungen aus der Datenbank
 */
function loadSolutionSliderData(fall_id, sliderConfigs, callback) {
    console.log("reviewModeSlider: Lade Musterlösungen für fall_id:", fall_id);

    const postData = JSON.stringify({ id: fall_id });
    console.log("reviewModeSlider: POST data:", postData);

    $.ajax({
        type: "POST",
        url: 'php/getValues.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: postData,
        success: function(result) {
            console.log("reviewModeSlider: Musterlösungen Response:", result);

            const solutions = {};

            // Musterlösungen auf Skalen setzen
            result.forEach(function(item) {
                console.log("reviewModeSlider: Prüfe item:", item.input_id, "=", item.value);

                const config = sliderConfigs.find(c => c.inputId === item.input_id);
                if (config) {
                    console.log("reviewModeSlider: Config gefunden für", item.input_id);
                    solutions[item.input_id] = item.value;
                    setSliderSolution(config.scaleId, item.value);
                }
            });

            // Callback mit den Lösungen
            if (callback) callback(solutions);

            // Alle Skalen deaktivieren
            setTimeout(function() {
                sliderConfigs.forEach(function(config) {
                    disableSlider(config.scaleId);
                });
            }, 300);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error("reviewModeSlider: AJAX-Fehler bei Musterlösungen:", xhr.status, thrownError);
            console.error("reviewModeSlider: Response:", xhr.responseText);
            if (callback) callback({});
        }
    });
}

/**
 * Lädt User-Eingaben aus der Datenbank
 */
function loadUserSliderData(fall_id, result_id, sliderConfigs, solutions) {
    console.log("reviewModeSlider: Lade User-Daten für fall_id:", fall_id, "result_id:", result_id);

    const postData = JSON.stringify({
        fall_id: fall_id,
        result_id: result_id
    });
    console.log("reviewModeSlider: POST data:", postData);

    $.ajax({
        type: "POST",
        url: 'php/getReviewData.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: postData,
        success: function(result) {
            console.log("reviewModeSlider: User-Daten Response:", result);

            if (result.error) {
                console.error("reviewModeSlider: Fehler:", result.error);
                return;
            }

            // User-Werte auf Skalen setzen
            result.forEach(function(item) {
                console.log("reviewModeSlider: Prüfe User-Item:", item.input_id, "=", item.user_input);

                const config = sliderConfigs.find(c => c.inputId === item.input_id);
                if (config && item.user_input !== null && item.user_input !== '') {
                    console.log("reviewModeSlider: Setze User-Wert für", config.inputId);
                    setSliderUser(config.scaleId, config.inputId, item.user_input, solutions[item.input_id]);
                }
            });
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error("reviewModeSlider: AJAX-Fehler bei User-Daten:", xhr.status, thrownError);
            console.error("reviewModeSlider: Response:", xhr.responseText);
        }
    });
}

/**
 * Setzt die Musterlösung auf der Skala (grüner Indikator)
 */
function setSliderSolution(scaleId, value) {
    const $scale = $('#' + scaleId);

    if ($scale.length === 0) {
        console.log("reviewModeSlider: Skala nicht gefunden:", scaleId);
        return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        console.log("reviewModeSlider: Ungültiger Wert:", value);
        return;
    }

    // Position berechnen (min=-10, max=10)
    const min = -10, max = 10;
    const span = max - min;
    const pct = ((numValue - min) / span) * 96 + 2;

    console.log(`reviewModeSlider: Musterlösung ${scaleId} = ${numValue} (${pct}%)`);

    // Grünen Indikator hinzufügen
    if ($scale.find('.ml-solution-indicator').length === 0) {
        const solutionIndicator = $(`
            <div class="ml-solution-indicator" style="
                position: absolute;
                top: 3px;
                bottom: 3px;
                width: 12px;
                left: ${pct}%;
                transform: translateX(-50%);
                background: rgba(103, 255, 24, 0.3);
                border: 2px solid #67ff18;
                border-radius: 6px;
                pointer-events: none;
                z-index: 10;
            "></div>
        `);
        $scale.append(solutionIndicator);

        // Grüner Marker/Pfeil über der Position
        const marker = $(`
            <div class="ml-solution-marker" style="
                position: absolute;
                top: -8px;
                left: ${pct}%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid #67ff18;
                pointer-events: none;
                z-index: 11;
            "></div>
        `);
        $scale.append(marker);

        console.log("reviewModeSlider: Grüner Indikator hinzugefügt für", scaleId);
    }
}

/**
 * Setzt den User-Wert auf der Skala (blauer Indikator) und färbt ihn
 */
function setSliderUser(scaleId, inputId, userValue, solutionValue) {
    const $scale = $('#' + scaleId);
    const $input = $('#' + inputId);

    if ($scale.length === 0) {
        console.log("reviewModeSlider: Skala nicht gefunden:", scaleId);
        return;
    }

    const numValue = parseFloat(userValue);
    if (isNaN(numValue)) {
        console.log("reviewModeSlider: Ungültiger User-Wert:", userValue);
        return;
    }

    // Position berechnen
    const min = -10, max = 10;
    const span = max - min;
    const pct = ((numValue - min) / span) * 96 + 2;

    console.log(`reviewModeSlider: User ${scaleId} = ${numValue} (${pct}%)`);

    // Hidden Input setzen
    $input.val(numValue);

    // Blauen Indikator positionieren
    const $indicator = $scale.find('.ml-indicator');
    if ($indicator.length > 0) {
        $indicator.css('left', pct + '%');
        console.log("reviewModeSlider: Indikator positioniert für", scaleId);

        // Vergleich mit Musterlösung
        const correctValue = parseFloat(solutionValue);
        const isCorrect = !isNaN(correctValue) && Math.abs(numValue - correctValue) <= 0.5;

        if (isCorrect) {
            // Richtig: Indikator grün
            $indicator.css({
                'background': 'rgba(103, 255, 24, 0.15)',
                'border-color': '#67ff18'
            });
            console.log(`reviewModeSlider: ${inputId} RICHTIG (${numValue} ≈ ${correctValue})`);
        } else {
            // Falsch: Indikator rot
            $indicator.css({
                'background': 'rgba(255, 0, 0, 0.15)',
                'border-color': '#ff0000'
            });
            console.log(`reviewModeSlider: ${inputId} FALSCH (${numValue} ≠ ${correctValue})`);
        }
    } else {
        console.log("reviewModeSlider: .ml-indicator nicht gefunden in", scaleId);
    }
}

/**
 * Deaktiviert eine Skala
 */
function disableSlider(scaleId) {
    const $scale = $('#' + scaleId);
    if ($scale.length === 0) return;

    console.log("reviewModeSlider: Deaktiviere Skala:", scaleId);

    // Deaktiviere alle Klick-Buttons
    $scale.find('.ml-hit').each(function() {
        $(this).prop('disabled', true);
        $(this).css({
            'cursor': 'not-allowed',
            'pointer-events': 'none'
        });
    });

    // Verhindere Interaktion
    $scale.css('pointer-events', 'none');

    // Entferne Tabindex für Keyboard-Navigation
    $scale.attr('tabindex', '-1');
}