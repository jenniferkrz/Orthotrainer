/**
 * reviewMode.js - Review-Modus für Ortho Campus
 *
 * Features:
 * - Kompakte Step-Navigation oben
 * - Vergleich Nutzerantworten vs. Musterlösung
 * - Ein ✓ oder ✗ pro Eingabe/Frage
 * - Kein Weiter-Button im Review-Modus
 *
 * Für Canvas-Unterstützung (Punkte/Linien/Winkel) zusätzlich reviewModeCanvas.js einbinden
 */

$(document).ready(function() {
    // Prüfe ob Review-Modus aktiv
    const urlParams = new URLSearchParams(window.location.search);
    const isReviewMode = urlParams.get('mode') === 'review';

    if (!isReviewMode) return;

    console.log("Review-Modus aktiviert");

    // Hash parsen: #10-QoFVPW4j6k -> fall_id=10, result_id=QoFVPW4j6k
    const hash = window.location.hash.substring(1);
    const hashParts = hash.split("-");
    const fall_id = hashParts[0];
    const result_id = hashParts.slice(1).join("-");

    if (!fall_id || !result_id) {
        console.error("Review-Modus: fall_id oder result_id fehlt im Hash");
        return;
    }

    console.log("Fall ID:", fall_id, "Result ID:", result_id);

    // Globale Variablen für andere Scripts
    window.reviewMode = {
        active: true,
        fall_id: fall_id,
        result_id: result_id
    };

    // UI für Review-Modus anpassen
    initReviewUI();

    // Daten laden
    loadReviewData(fall_id, result_id);
});

/**
 * Step-Navigation Konfiguration
 */

const STEP_CONFIG = [
    { file: 'step0_0.html', label: 'Anamnese' },
    { file: 'step0.html', label: 'Extraoral' },
    { file: 'step_orthopantogramm.html', label: 'OPG' },
    { file: 'step.html', label: 'Step 1' },
    { file: 'step1.html', label: 'Step 2' },
    { file: 'step2.html', label: 'Step 3' },
    { file: 'step3.html', label: 'Step 4' },
    { file: 'step6.html', label: 'Step 5' },
    { file: 'step9.html', label: 'Step 6' },
    { file: 'step8.html', label: 'Step 7' },
    { file: 'step_frs0.html', label: 'FRS Punkte' },
    { file: 'step_frs.html', label: 'FRS Winkel' },
    { file: 'step_frs_diagnose.html', label: 'FRS Diagnose' }
];

/**
 * Passt die UI für den Review-Modus an
 */
function initReviewUI() {
    const urlParams = new URLSearchParams(window.location.search);
    const identifier = urlParams.get('identifier') || '';
    const hash = window.location.hash;
    const currentFile = window.location.pathname.split('/').pop();

    // CSS für Review-Modus
    const reviewStyles = `
        <style id="review_styles">
            /* Review Navigation */
            #review_nav_wrapper {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1001;
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            #review_banner {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: 'Public Sans', sans-serif;
                font-size: 13px;
            }
            
            #review_banner .banner_left {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            #review_banner .banner_title {
                font-weight: 600;
            }
            
            #exit_review {
                color: white;
                background: rgba(255,255,255,0.2);
                padding: 5px 12px;
                border-radius: 4px;
                text-decoration: none;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            #exit_review:hover {
                background: rgba(255,255,255,0.3);
            }
            
            #review_step_nav {
                display: flex;
                overflow-x: auto;
                padding: 8px 15px;
                gap: 5px;
                background: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
            }
            
            #review_step_nav::-webkit-scrollbar {
                height: 4px;
            }
            
            #review_step_nav::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 2px;
            }
            
            .review_step_link {
                flex-shrink: 0;
                padding: 6px 12px;
                border-radius: 4px;
                text-decoration: none;
                font-size: 12px;
                font-family: 'Public Sans', sans-serif;
                color: #555;
                background: white;
                border: 1px solid #ddd;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .review_step_link:hover {
                background: #e3f2fd;
                border-color: #2196f3;
                color: #1976d2;
            }
            
            .review_step_link.active {
                background: #2c5f8d;
                color: white;
                border-color: #2c5f8d;
            }
            
            /* Body Padding für fixe Navigation */
            body.review_mode {
                padding-top: 85px !important;
            }
            
            /* Review Comparison Styles */
            .review_comparison {
                display: flex;
                gap: 10px;
                margin-top: 5px;
                font-size: 13px;
                font-family: 'Public Sans', sans-serif;
            }
            
            .review_solution {
                background: #e8f5e9;
                padding: 6px 10px;
                border-radius: 4px;
                border-left: 3px solid #4caf50;
            }
            
            /* Input UND Textarea Styling */
            .review_correct input,
            .review_correct textarea {
                border: 2px solid #4caf50 !important;
                background: #e8f5e9 !important;
            }
            
            .review_incorrect input,
            .review_incorrect textarea {
                border: 2px solid #f44336 !important;
                background: #ffebee !important;
            }
            
            .review_empty input,
            .review_empty textarea {
                border: 2px solid #ff9800 !important;
                background: #fff3e0 !important;
            }
            
            /* Select Styling */
            select.review_select_correct {
                border: 2px solid #4caf50 !important;
                background: #e8f5e9 !important;
            }
            
            select.review_select_incorrect {
                border: 2px solid #f44336 !important;
                background: #ffebee !important;
            }
            
            select.review_select_empty {
                border: 2px solid #ff9800 !important;
                background: #fff3e0 !important;
            }
            
            .review_select_solution {
                color: #4caf50;
                font-size: 12px;
                font-weight: 600;
                margin-top: 4px;
            }
            
            /* Radio/Checkbox Styling */
            .checkbox_item.review_correct label {
                color: #2e7d32;
                font-weight: 600;
            }
            
            .checkbox_item.review_incorrect label {
                color: #c62828;
                text-decoration: line-through;
            }
            
            /* Ergebnis-Symbol pro Frage */
            .review_result_indicator {
                font-weight: 600;
                margin-left: 10px;
                font-size: 16px;
            }
            
            .review_result_indicator.correct {
                color: #4caf50;
            }
            
            .review_result_indicator.incorrect {
                color: #f44336;
            }
            
            .correct_answer_indicator {
                color: #4caf50;
                font-weight: 600;
                margin-left: 5px;
                font-size: 13px;
            }
            
            /* Canvas Legende (für reviewModeCanvas.js) */
            .canvas_legend {
                display: flex;
                gap: 20px;
                padding: 10px 15px;
                background: #f8f9fa;
                border-radius: 6px;
                margin: 10px 0;
                font-size: 13px;
                font-family: 'Public Sans', sans-serif;
            }
            
            .canvas_legend_item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .canvas_legend_color {
                width: 20px;
                height: 4px;
                border-radius: 2px;
            }
            
            .canvas_legend_color.user {
                background: #18ceff;
            }
            
            .canvas_legend_color.solution {
                background: #18ff5a;
            }
            
            /* Stats Box */
            #review_stats {
                display: none!important;
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                font-family: 'Public Sans', sans-serif;
                z-index: 999;
                min-width: 150px;
            }
            
            #review_stats .stat {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin: 5px 0;
            }
            
            #review_stats .stat-value {
                font-weight: 600;
            }
            
            #review_stats .stat-value.correct { color: #4caf50; }
            #review_stats .stat-value.incorrect { color: #f44336; }
            #review_stats .stat-value.empty { color: #f44336; }
        </style>
    `;
    $('head').append(reviewStyles);

    // Navigation bauen
    let navHtml = `
        <div id="review_nav_wrapper">
            <div id="review_banner">
                <div class="banner_left">
                    <span class="banner_title">📋 Review-Modus</span>
                </div>
                <a href="index.php?identifier=${encodeURIComponent(identifier)}" id="exit_review">✕ Beenden</a>
            </div>
            <div id="review_step_nav">
    `;

    STEP_CONFIG.forEach(function(step) {
        const isActive = currentFile === step.file ? 'active' : '';
        const href = `${step.file}?mode=review&identifier=${encodeURIComponent(identifier)}${hash}`;
        navHtml += `<a href="${href}" class="review_step_link ${isActive}">${step.label}</a>`;
    });

    navHtml += `
            </div>
        </div>
    `;

    $('body').addClass('review_mode').prepend(navHtml);

    // Zum aktiven Step scrollen
    setTimeout(function() {
        const $activeStep = $('.review_step_link.active');
        if ($activeStep.length) {
            $activeStep[0].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, 100);

    // Alle Inputs deaktivieren
    $('input, select, textarea').prop('disabled', true);

    // Buttons verstecken
    $('#value_btn').hide();
    $('#next_btn').hide();

    // Delete-Buttons und Hilfe-Buttons verstecken im Review-Modus
    $('.delete-btn').hide();
    $('.help-modal').hide();
}

/**
 * Lädt Review-Daten vom Server
 */
function loadReviewData(fall_id, result_id) {
    const postData = JSON.stringify({
        fall_id: fall_id,
        result_id: result_id
    });

    $.ajax({
        type: "POST",
        url: 'php/getReviewData.php',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: postData,
        success: function(result) {
            console.log("Review-Daten geladen:", result);
            if (result.error) {
                console.error("Fehler:", result.error);
                return;
            }
            applyReviewData(result);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.error("AJAX-Fehler:", xhr.status, thrownError);
        }
    });
}

/**
 * Wendet die Review-Daten auf die Seite an
 */
function applyReviewData(data) {
    let stats = { correct: 0, incorrect: 0, empty: 0, total: 0 };

    // Track welche input_ids schon verarbeitet wurden (verhindert Duplikate)
    const processedInputs = new Set();

    console.log("reviewMode: Verarbeite", data.length, "Einträge");

    data.forEach(function(item) {
        // Überspringe wenn schon verarbeitet
        if (processedInputs.has(item.input_id)) {
            return;
        }
        processedInputs.add(item.input_id);

        console.log("reviewMode: Verarbeite input_id:", item.input_id, "user_input:", item.user_input, "solution:", item.solution);

        const inputId = '#' + item.input_id;
        const $input = $(inputId);

        if ($input.length === 0) {
            console.log("reviewMode: Kein Element mit ID gefunden:", item.input_id);

            // Könnte ein Radio/Checkbox sein
            if (applyRadioReview(item, stats)) {
                console.log("reviewMode: Als Radio/Checkbox behandelt:", item.input_id);
                return;
            }

            // Könnte ein Select sein (by name)
            if (applySelectReview(item, stats)) {
                console.log("reviewMode: Als Select behandelt:", item.input_id);
                return;
            }

            console.log("reviewMode: Element nicht gefunden:", item.input_id);
            return;
        }

        // Prüfe ob es ein Select-Element ist
        if ($input.is('select')) {
            console.log("reviewMode: Element ist ein Select:", item.input_id);
            applySelectReviewDirect($input, item, stats);
            return;
        }

        // Normales Input-Feld
        const userAnswer = item.user_input || '';
        const solution = item.solution || '';

        // Wert setzen
        $input.val(userAnswer);

        // Vergleich durchführen
        const isCorrect = compareAnswers(userAnswer, solution);
        const isEmpty = !userAnswer || userAnswer.trim() === '';

        // Styling anwenden
        const $container = $input.closest('.input_cont');

        if (isEmpty) {
            $container.addClass('review_incorrect');
            stats.empty++;
        } else if (isCorrect) {
            $container.addClass('review_correct');
            stats.correct++;
        } else {
            $container.addClass('review_incorrect');
            stats.incorrect++;
        }

        stats.total++;

        // Vergleichs-Anzeige hinzufügen (nur wenn Lösung existiert und nicht übereinstimmt)
        if (solution && !isCorrect && !$container.next('.review_comparison').length) {
            const comparison = $(`
                <div class="review_comparison">
                    <div class="review_solution">✓ Lösung: ${solution}${item.unit ? ' ' + item.unit : ''}</div>
                </div>
            `);
            $container.after(comparison);
        }
    });

    // Stats-Box anzeigen
    showReviewStats(stats);
}

/**
 * Behandelt Radio-Buttons und Checkboxen
 * @returns {boolean} true wenn Element gefunden wurde
 */
function applyRadioReview(item, stats) {
    const $radioGroup = $('input[name="' + item.input_id + '"]');

    if ($radioGroup.length === 0) return false;

    const userAnswer = item.user_input || '';
    const solution = item.solution || '';

    // Nutzerantwort markieren
    if (userAnswer) {
        $radioGroup.filter('[value="' + userAnswer + '"]').prop('checked', true);
    }

    // Vergleich
    const isCorrect = compareAnswers(userAnswer, solution);
    const isEmpty = !userAnswer || userAnswer.trim() === '';

    // Finde den Container für die gesamte Frage (die Checkbox-Gruppe)
    const $selectedItem = $radioGroup.filter('[value="' + userAnswer + '"]').closest('.checkbox_item');

    if (isEmpty) {
        stats.empty++;
    } else if (isCorrect) {
        $selectedItem.addClass('review_correct');
        stats.correct++;

        // EIN grüner Haken hinter der gewählten Antwort
        if ($selectedItem.find('.review_result_indicator').length === 0) {
            $selectedItem.append('<span class="review_result_indicator correct">✓</span>');
        }
    } else {
        $selectedItem.addClass('review_incorrect');
        stats.incorrect++;

        // EIN rotes Kreuz hinter der (falschen) gewählten Antwort
        if ($selectedItem.find('.review_result_indicator').length === 0) {
            $selectedItem.append('<span class="review_result_indicator incorrect">✗</span>');
        }

        // Die richtige Antwort anzeigen
        if (solution) {
            const $correctItem = $radioGroup.filter('[value="' + solution + '"]').closest('.checkbox_item');
            if ($correctItem.find('.correct_answer_indicator').length === 0) {
                $correctItem.append('<span class="correct_answer_indicator">← Richtig</span>');
            }
        }
    }

    stats.total++;
    return true;
}

/**
 * Behandelt Select-Dropdowns (direkt mit Element)
 */
function applySelectReviewDirect($select, item, stats) {
    const userAnswer = item.user_input || '';
    const solution = item.solution || '';

    console.log("reviewMode: Select direkt:", item.input_id, "User:", userAnswer, "Lösung:", solution);

    // Wert setzen
    if (userAnswer) {
        $select.val(userAnswer);
    }

    // Vergleich
    const isCorrect = compareAnswers(userAnswer, solution);
    const isEmpty = !userAnswer || userAnswer.trim() === '';

    // Styling anwenden
    if (isEmpty) {
        $select.addClass('review_select_empty');
        stats.empty++;
    } else if (isCorrect) {
        $select.addClass('review_select_correct');
        stats.correct++;
    } else {
        $select.addClass('review_select_incorrect');
        stats.incorrect++;

        // Lösung anzeigen
        if (solution) {
            const $solutionOption = $select.find('option[value="' + solution + '"]');
            const solutionText = $solutionOption.length > 0 ? $solutionOption.text() : solution;

            const $container = $select.closest('.assess-row');
            if ($container.length > 0 && $container.find('.review_select_solution').length === 0) {
                $container.append($(`<div class="review_select_solution">✓ ${solutionText}</div>`));
            } else if ($container.length === 0 && $select.next('.review_select_solution').length === 0) {
                $select.after($(`<div class="review_select_solution">✓ ${solutionText}</div>`));
            }
        }
    }

    stats.total++;
}

/**
 * Behandelt Select-Dropdowns (by name)
 * @returns {boolean} true wenn Element gefunden wurde
 */
function applySelectReview(item, stats) {
    // Versuche Select zu finden (by name oder by id)
    let $select = $('select[name="' + item.input_id + '"]');
    if ($select.length === 0) {
        $select = $('select#' + item.input_id);
    }

    if ($select.length === 0) {
        console.log("reviewMode: Select nicht gefunden für input_id:", item.input_id);
        return false;
    }

    console.log("reviewMode: Select gefunden:", item.input_id, "User:", item.user_input, "Lösung:", item.solution);

    const userAnswer = item.user_input || '';
    const solution = item.solution || '';

    // Wert setzen
    if (userAnswer) {
        $select.val(userAnswer);
        console.log("reviewMode: Select Wert gesetzt auf:", userAnswer);
    }

    // Vergleich
    const isCorrect = compareAnswers(userAnswer, solution);
    const isEmpty = !userAnswer || userAnswer.trim() === '';

    // Styling anwenden
    if (isEmpty) {
        $select.addClass('review_select_empty');
        stats.empty++;
        console.log("reviewMode: Select leer:", item.input_id);
    } else if (isCorrect) {
        $select.addClass('review_select_correct');
        stats.correct++;
        console.log("reviewMode: Select richtig:", item.input_id);
    } else {
        $select.addClass('review_select_incorrect');
        stats.incorrect++;
        console.log("reviewMode: Select falsch:", item.input_id, "User:", userAnswer, "Lösung:", solution);

        // Lösung anzeigen
        if (solution) {
            // Finde den Text der Lösung aus den Options
            const $solutionOption = $select.find('option[value="' + solution + '"]');
            const solutionText = $solutionOption.length > 0 ? $solutionOption.text() : solution;

            const $container = $select.closest('.assess-row');
            if ($container.length > 0 && $container.find('.review_select_solution').length === 0) {
                const solutionDiv = $(`<div class="review_select_solution">✓ ${solutionText}</div>`);
                $container.append(solutionDiv);
            } else if ($container.length === 0) {
                // Fallback: direkt nach dem Select
                if ($select.next('.review_select_solution').length === 0) {
                    $select.after($(`<div class="review_select_solution">✓ ${solutionText}</div>`));
                }
            }
        }
    }

    stats.total++;
    return true;
}

/**
 * Vergleicht Nutzerantworten (tolerant)
 */
function compareAnswers(userAnswer, solution) {
    if (!userAnswer || !solution) return false;

    let user = userAnswer.toString().trim().toLowerCase();
    let sol = solution.toString().trim().toLowerCase();

    if (user === sol) return true;

    // Numerischer Vergleich mit Toleranz (±0.5)
    const userNum = parseFloat(user.replace(',', '.'));
    const solNum = parseFloat(sol.replace(',', '.'));

    if (!isNaN(userNum) && !isNaN(solNum)) {
        return Math.abs(userNum - solNum) <= 0.5;
    }

    if (user.replace(',', '.') === sol.replace(',', '.')) return true;

    return false;
}

/**
 * Zeigt Statistik-Box
 */
function showReviewStats(stats) {
    if (stats.total === 0) return;

    const percentage = Math.round((stats.correct / stats.total) * 100);

    const statsBox = $(`
        <div id="review_stats">
            <div style="font-weight: 600; margin-bottom: 10px; font-size: 15px;">
                Ergebnis: ${percentage}%
            </div>
            <div class="stat">
                <span>Richtig:</span>
                <span class="stat-value correct">${stats.correct} ✓</span>
            </div>
            <div class="stat">
                <span>Falsch:</span>
                <span class="stat-value incorrect">${stats.incorrect} ✗</span>
            </div>
            <div class="stat">
                <span>Leer:</span>
                <span class="stat-value empty">${stats.empty}</span>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <span>Gesamt:</span>
                <span style="font-weight: 600; margin-left: 10px;">${stats.total}</span>
            </div>
        </div>
    `);

    $('body').append(statsBox);
}