/**
 * reviewModeCanvasFRS.js - FRS Canvas-Unterstützung für Review-Modus
 *
 * Zeichnet User-Eingaben (blau) und Musterlösungen (grün) auf dem FRS-Canvas.
 * Nur auf step_frs0.html einbinden.
 *
 * Voraussetzung: reviewMode.js muss vorher geladen sein!
 */

$(document).ready(function() {
    console.log("reviewModeCanvasFRS: Script geladen");

    // Warte bis Canvas initialisiert ist
    setTimeout(function() {
        console.log("reviewModeCanvasFRS: Prüfe Review-Modus...");

        // Prüfe ob Review-Modus aktiv (von reviewMode.js gesetzt)
        if (!window.reviewMode || !window.reviewMode.active) {
            console.log("reviewModeCanvasFRS: Review-Modus nicht aktiv, beende");
            return;
        }

        console.log("reviewModeCanvasFRS: Review-Modus aktiv!");

        const fall_id = window.reviewMode.fall_id;
        const result_id = window.reviewMode.result_id;

        // FRS Canvas-Review initialisieren
        initFRSCanvasReview(fall_id, result_id);

    }, 500);
});

/**
 * Initialisiert den FRS Canvas für den Review
 */
function initFRSCanvasReview(fall_id, result_id) {
    console.log("reviewModeCanvasFRS: initFRSCanvasReview() gestartet");

    const $img = $('#linien_img1');
    const $canvas = $('#frs_canvas');

    if ($img.length === 0 || $canvas.length === 0) {
        console.log("reviewModeCanvasFRS: Canvas oder Bild nicht gefunden");
        return;
    }

    console.log("reviewModeCanvasFRS: Canvas gefunden");

    const img = $img[0];

    function initAndDraw() {
        const width = img.clientWidth;
        const height = img.clientHeight;

        if (width === 0 || height === 0) {
            console.log("reviewModeCanvasFRS: Bild noch nicht geladen, warte...");
            setTimeout(initAndDraw, 100);
            return;
        }

        console.log("reviewModeCanvasFRS: Bild geladen, Größe:", width, "x", height);

        // Canvas Größe setzen
        const canvas = $canvas[0];
        const ctx = canvas.getContext("2d");
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // Canvas leeren
        ctx.clearRect(0, 0, width, height);

        // Legende hinzufügen
        addFRSLegend();

        // Pfade für JSON-Dateien
        const userPath = "frs_results/frs_" + result_id + ".json";
        const solutionPath = "eingabe/frs" + fall_id + ".json";

        console.log("reviewModeCanvasFRS: User-Pfad:", userPath);
        console.log("reviewModeCanvasFRS: Lösungs-Pfad:", solutionPath);

        // Musterlösung zuerst laden (grün, größere Punkte, transparent)
        loadAndDrawFRSJSON(solutionPath, ctx, width, height, "#18ff5a", 9, 0.3, false);

        // Dann Musterlösung nochmal mit kleinen Punkten (für bessere Sichtbarkeit)
        loadAndDrawFRSJSON(solutionPath, ctx, width, height, "#18ff5a", 2, 1, false);

        // User-Daten laden (blau, mit Namen)
        loadAndDrawFRSJSON(userPath, ctx, width, height, "#18ceff", 3, 1, true);

        // Interaktionen deaktivieren
        disableFRSInteractions();
    }

    // Prüfe ob Bild schon geladen ist
    if (img.complete && img.naturalHeight !== 0) {
        initAndDraw();
    } else {
        img.onload = initAndDraw;
    }
}

/**
 * Fügt Legende hinzu
 */
function addFRSLegend() {
    const $container = $('.frs_line_container');
    if ($container.length === 0) return;

    // Prüfe ob Legende schon existiert
    if ($('.canvas_legend').length > 0) return;

    const legend = $(`
        <div class="canvas_legend" style="
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
                <div style="width: 20px; height: 4px; background: #18ceff; border-radius: 2px;"></div>
                <span>Ihre Eingabe</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 4px; background: #18ff5a; border-radius: 2px;"></div>
                <span>Musterlösung</span>
            </div>
        </div>
    `);

    $container.prepend(legend);
    console.log("reviewModeCanvasFRS: Legende hinzugefügt");
}

/**
 * Lädt JSON und zeichnet auf Canvas
 */
function loadAndDrawFRSJSON(path, ctx, width, height, color, size, alpha, showNames) {
    console.log("reviewModeCanvasFRS: Lade", path);

    $.ajax({
        async: false,
        global: false,
        cache: false,
        url: path,
        dataType: "json",
        success: function(data) {
            console.log("reviewModeCanvasFRS: Daten geladen:", path, data);
            if (data && data.values) {
                displayFRSPoints(ctx, data.values, width, height, color, size, alpha, showNames);
            }
        },
        error: function(xhr, status, error) {
            console.log("reviewModeCanvasFRS: Datei nicht gefunden:", path, error);
        }
    });
}

/**
 * Zeichnet alle Punkte/Linien/Winkel
 */
function displayFRSPoints(ctx, points, width, height, color, size, alpha, showNames) {
    console.log("reviewModeCanvasFRS: Zeichne", points.length, "Elemente in", color);

    points.forEach(function(point) {
        if (point.type === 'line') {
            drawFRSLine(ctx, point.start, point.end, width, height, color, alpha);
        } else if (point.type === 'angle') {
            drawFRSAngle(ctx, point.points, width, height, color, alpha);
        } else {
            // Einzelner Punkt
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                getXAbsoluteFRS(point.x, width),
                getYAbsoluteFRS(point.y, height),
                size,
                0,
                Math.PI * 2,
                true
            );
            ctx.fill();

            // Punktname anzeigen (nur für User-Eingabe)
            if (point.name && showNames) {
                ctx.globalAlpha = 1;
                ctx.font = "12px Arial";
                ctx.fillStyle = color;
                ctx.fillText(
                    point.name,
                    getXAbsoluteFRS(point.x, width) + 5,
                    getYAbsoluteFRS(point.y, height) - 5
                );
            }
        }
    });

    // Alpha zurücksetzen
    ctx.globalAlpha = 1;
}

/**
 * Zeichnet eine Linie
 */
function drawFRSLine(ctx, start, end, width, height, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(getXAbsoluteFRS(start.x, width), getYAbsoluteFRS(start.y, height));
    ctx.lineTo(getXAbsoluteFRS(end.x, width), getYAbsoluteFRS(end.y, height));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/**
 * Zeichnet einen Winkel
 */
function drawFRSAngle(ctx, points, width, height, color, alpha) {
    // Linien zwischen den Punkten zeichnen
    for (let i = 0; i < points.length - 1; i++) {
        drawFRSLine(ctx, points[i], points[i + 1], width, height, color, alpha);
    }

    // Winkel berechnen und anzeigen
    if (points.length >= 3) {
        const angle = calculateFRSAngle(points[0], points[1], points[2]);
        displayFRSAngleValue(ctx, angle, points[1], width, height, color);
    }
}

/**
 * Berechnet den Winkel zwischen drei Punkten
 */
function calculateFRSAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
    return (angleRad * 180) / Math.PI;
}

/**
 * Zeigt den Winkelwert an
 */
function displayFRSAngleValue(ctx, angle, point, width, height, color) {
    const absX = getXAbsoluteFRS(point.x, width);
    const absY = getYAbsoluteFRS(point.y, height);

    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText(angle.toFixed(2) + "°", absX + 10, absY - 10);
}

/**
 * Konvertiert Prozent-X zu absoluter Position
 */
function getXAbsoluteFRS(xpercent, width) {
    return (width * xpercent) / 100;
}

/**
 * Konvertiert Prozent-Y zu absoluter Position
 */
function getYAbsoluteFRS(ypercent, height) {
    return (height * ypercent) / 100;
}

/**
 * Deaktiviert alle Interaktionen auf dem FRS Canvas
 */
function disableFRSInteractions() {
    console.log("reviewModeCanvasFRS: Deaktiviere Interaktionen");

    // Canvas Click-Events entfernen
    const $canvas = $('#frs_canvas');
    $canvas.off('click mousedown mouseup mousemove touchstart touchmove touchend');
    $canvas.css('pointer-events', 'none');

    // Zoom-Target deaktivieren
    const $zoomTarget = $('#zoomTarget');
    $zoomTarget.off('click mousedown mouseup mousemove touchstart touchmove touchend');

    // Auswahl-Tabs deaktivieren
    $('.auswahl_tab').off('click').css({
        'pointer-events': 'none',
        'opacity': '0.5'
    });

    // FRS Punkt-Buttons deaktivieren
    $('.frs_point').off('click').css({
        'pointer-events': 'none',
        'opacity': '0.5'
    });

    // Delete-Button verstecken
    $('#delete-btn-frs').hide();

    // Zoom-Controls verstecken oder deaktivieren
    $('.zoom_controls').hide();

    // Nav-Tabs deaktivieren
    $('.nav_tab').off('click').css('pointer-events', 'none');

    // Container nicht klickbar
    $('#container').css('pointer-events', 'none');

    // Aber Bild sichtbar lassen
    $('#linien_img1').css('pointer-events', 'none');

    console.log("reviewModeCanvasFRS: Interaktionen deaktiviert");
}