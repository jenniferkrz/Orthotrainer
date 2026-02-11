/**
 * reviewModeCanvasFRSWinkel.js - FRS Winkel Canvas-Unterstützung für Review-Modus
 *
 * Ersetzt das Bild mit dem Lösungsbild und zeichnet User-Eingaben.
 * Nur auf step_frs.html einbinden.
 *
 * Voraussetzung: reviewMode.js muss vorher geladen sein!
 */

$(document).ready(function() {
    console.log("reviewModeCanvasFRSWinkel: Script geladen");

    // Warte bis Canvas initialisiert ist
    setTimeout(function() {
        console.log("reviewModeCanvasFRSWinkel: Prüfe Review-Modus...");

        // Prüfe ob Review-Modus aktiv (von reviewMode.js gesetzt)
        if (!window.reviewMode || !window.reviewMode.active) {
            console.log("reviewModeCanvasFRSWinkel: Review-Modus nicht aktiv, beende");
            return;
        }

        console.log("reviewModeCanvasFRSWinkel: Review-Modus aktiv!");

        const fall_id = window.reviewMode.fall_id;
        const result_id = window.reviewMode.result_id;

        // FRS Winkel Canvas-Review initialisieren
        initFRSWinkelCanvasReview(fall_id, result_id);

    }, 500);
});

/**
 * Initialisiert den FRS Winkel Canvas für den Review
 */
function initFRSWinkelCanvasReview(fall_id, result_id) {
    console.log("reviewModeCanvasFRSWinkel: initFRSWinkelCanvasReview() gestartet");

    const $img = $('#linien_img1');
    const $canvas = $('#frs_canvas');

    if ($img.length === 0 || $canvas.length === 0) {
        console.log("reviewModeCanvasFRSWinkel: Canvas oder Bild nicht gefunden");
        return;
    }

    // 1. Bild ersetzen mit Lösungsbild
    const solutionImagePath = 'images/winkel' + fall_id + '.jpg';
    console.log("reviewModeCanvasFRSWinkel: Setze Lösungsbild:", solutionImagePath);
    $img.attr('src', solutionImagePath);

    const img = $img[0];

    function initAndDraw() {
        const width = img.clientWidth;
        const height = img.clientHeight;

        if (width === 0 || height === 0) {
            console.log("reviewModeCanvasFRSWinkel: Bild noch nicht geladen, warte...");
            setTimeout(initAndDraw, 100);
            return;
        }

        console.log("reviewModeCanvasFRSWinkel: Bild geladen, Größe:", width, "x", height);

        // Canvas Größe setzen
        const canvas = $canvas[0];
        const ctx = canvas.getContext("2d");
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // Canvas leeren
        ctx.clearRect(0, 0, width, height);

        // Legende hinzufügen
        addFRSWinkelLegend();

        // Pfad für User-JSON
        const userPath = "frs_results/frs_" + result_id + ".json";

        console.log("reviewModeCanvasFRSWinkel: User-Pfad:", userPath);

        // User-Daten laden und zeichnen (blau)
        loadAndDrawFRSWinkelJSON(userPath, ctx, width, height, "#18ceff", true);

        // Interaktionen deaktivieren
        disableFRSWinkelInteractions();
    }

    // Warte bis neues Bild geladen ist
    img.onload = initAndDraw;

    // Falls Bild schon gecached ist
    if (img.complete && img.naturalHeight !== 0) {
        setTimeout(initAndDraw, 100);
    }
}

/**
 * Fügt Legende hinzu
 */
function addFRSWinkelLegend() {
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
                <span>Ihre Zeichnungen</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 20px; height: 4px; background: #67ff18; border-radius: 2px;"></div>
                <span>Musterlösung (im Bild)</span>
            </div>
        </div>
    `);

    $container.prepend(legend);
    console.log("reviewModeCanvasFRSWinkel: Legende hinzugefügt");
}

/**
 * Lädt JSON und zeichnet auf Canvas
 */
function loadAndDrawFRSWinkelJSON(path, ctx, width, height, color, showLabels) {
    console.log("reviewModeCanvasFRSWinkel: Lade", path);

    $.ajax({
        async: false,
        global: false,
        cache: false,
        url: path,
        dataType: "json",
        success: function(data) {
            console.log("reviewModeCanvasFRSWinkel: Daten geladen:", path, data);
            if (data && data.values) {
                displayFRSWinkelPoints(ctx, data.values, width, height, color, showLabels);
            }
        },
        error: function(xhr, status, error) {
            console.log("reviewModeCanvasFRSWinkel: Datei nicht gefunden:", path, error);
        }
    });
}

/**
 * Zeichnet alle Punkte/Linien/Winkel
 */
function displayFRSWinkelPoints(ctx, points, width, height, color, showLabels) {
    console.log("reviewModeCanvasFRSWinkel: Zeichne", points.length, "Elemente in", color);

    const lineWidth = 1;
    const pointSize = 1.5;

    points.forEach(function(obj) {
        if (obj.type === 'line') {
            // Prüfe ob Linie Teil eines Winkels ist
            let isPartOfAngle = false;
            for (let p of points) {
                if (p.type === 'angle' && p.points?.length === 3) {
                    const a = p.points;
                    if (
                        (pointsMatchFRSW(obj.start, a[0]) && pointsMatchFRSW(obj.end, a[1])) ||
                        (pointsMatchFRSW(obj.start, a[1]) && pointsMatchFRSW(obj.end, a[0])) ||
                        (pointsMatchFRSW(obj.start, a[1]) && pointsMatchFRSW(obj.end, a[2])) ||
                        (pointsMatchFRSW(obj.start, a[2]) && pointsMatchFRSW(obj.end, a[1]))
                    ) {
                        isPartOfAngle = true;
                        break;
                    }
                }
            }

            // Überspringe Linien die Teil eines Winkels sind (werden mit dem Winkel gezeichnet)
            if (isPartOfAngle) return;

            drawFRSWinkelLine(ctx, obj.start, obj.end, width, height, color, lineWidth, pointSize);

        } else if (obj.type === 'angle') {
            drawFRSWinkelAngle(ctx, obj.points, width, height, color, lineWidth, pointSize);

        } else if (obj.type === 'point') {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                getXAbsoluteFRSW(obj.x, width),
                getYAbsoluteFRSW(obj.y, height),
                pointSize,
                0,
                Math.PI * 2,
                true
            );
            ctx.fill();
        }
    });
}

/**
 * Prüft ob zwei Punkte übereinstimmen
 */
function pointsMatchFRSW(p1, p2) {
    return Math.abs(p1.x - p2.x) < 0.0001 && Math.abs(p1.y - p2.y) < 0.0001;
}

/**
 * Zeichnet eine Linie
 */
function drawFRSWinkelLine(ctx, start, end, width, height, color, lineWidth, pointSize) {
    ctx.beginPath();
    ctx.moveTo(getXAbsoluteFRSW(start.x, width), getYAbsoluteFRSW(start.y, height));
    ctx.lineTo(getXAbsoluteFRSW(end.x, width), getYAbsoluteFRSW(end.y, height));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Endpunkte zeichnen
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(getXAbsoluteFRSW(start.x, width), getYAbsoluteFRSW(start.y, height), pointSize, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(getXAbsoluteFRSW(end.x, width), getYAbsoluteFRSW(end.y, height), pointSize, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
}

/**
 * Zeichnet einen Winkel
 */
function drawFRSWinkelAngle(ctx, pts, width, height, color, lineWidth, pointSize) {
    if (!pts || pts.length !== 3) return;

    // Linien zeichnen
    for (let i = 0; i < pts.length - 1; i++) {
        drawFRSWinkelLine(ctx, pts[i], pts[i + 1], width, height, color, lineWidth, pointSize);
    }

    // Winkel berechnen und anzeigen
    const angle = calculateFRSWinkelAngle(pts[0], pts[1], pts[2]);

    // Winkelbogen zeichnen
    drawFRSWinkelArc(ctx, pts[0], pts[1], pts[2], width, height, color);

    // Winkelwert anzeigen
    displayFRSWinkelValue(ctx, angle, pts[1], width, height, color);
}

/**
 * Zeichnet den Winkelbogen
 */
function drawFRSWinkelArc(ctx, p1, vertex, p3, width, height, color) {
    const vx = getXAbsoluteFRSW(vertex.x, width);
    const vy = getYAbsoluteFRSW(vertex.y, height);
    const p1x = getXAbsoluteFRSW(p1.x, width);
    const p1y = getYAbsoluteFRSW(p1.y, height);
    const p3x = getXAbsoluteFRSW(p3.x, width);
    const p3y = getYAbsoluteFRSW(p3.y, height);

    // Winkel der beiden Schenkel berechnen
    const angle1 = Math.atan2(p1y - vy, p1x - vx);
    const angle2 = Math.atan2(p3y - vy, p3x - vx);

    // Radius für den Bogen
    const dist1 = Math.sqrt(Math.pow(p1x - vx, 2) + Math.pow(p1y - vy, 2));
    const dist2 = Math.sqrt(Math.pow(p3x - vx, 2) + Math.pow(p3y - vy, 2));
    const arcRadius = Math.min(dist1, dist2, 35) * 0.5;

    // Berechne die Differenz für die Bogenrichtung
    let diff = angle2 - angle1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    let counterclockwise = diff < 0;

    // Bogen zeichnen
    ctx.beginPath();
    ctx.arc(vx, vy, arcRadius, angle1, angle2, counterclockwise);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Halbtransparente Füllung
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.arc(vx, vy, arcRadius, angle1, angle2, counterclockwise);
    ctx.closePath();
    ctx.fillStyle = color === "#18ceff" ? "rgba(24, 206, 255, 0.2)" : "rgba(103, 255, 24, 0.2)";
    ctx.fill();
}

/**
 * Berechnet den Winkel zwischen drei Punkten
 */
function calculateFRSWinkelAngle(p1, p2, p3) {
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
function displayFRSWinkelValue(ctx, angle, point, width, height, color) {
    const absX = getXAbsoluteFRSW(point.x, width);
    const absY = getYAbsoluteFRSW(point.y, height);

    // Text positionieren
    let textX = Math.max(5, Math.min(width - 50, absX + 15));
    let textY = Math.max(20, Math.min(height - 5, absY - 15));

    // Hintergrund für bessere Lesbarkeit
    const text = angle.toFixed(1) + "°";
    ctx.font = "bold 13px Arial";
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(textX - 2, textY - 13, textWidth + 4, 16);

    ctx.fillStyle = color;
    ctx.fillText(text, textX, textY);
}

/**
 * Konvertiert Prozent-X zu absoluter Position
 */
function getXAbsoluteFRSW(xpercent, width) {
    return (width * xpercent) / 100;
}

/**
 * Konvertiert Prozent-Y zu absoluter Position
 */
function getYAbsoluteFRSW(ypercent, height) {
    return (height * ypercent) / 100;
}

/**
 * Deaktiviert alle Interaktionen auf dem FRS Winkel Canvas
 */
function disableFRSWinkelInteractions() {
    console.log("reviewModeCanvasFRSWinkel: Deaktiviere Interaktionen");

    // Canvas Click-Events entfernen
    const $canvas = $('#frs_canvas');
    $canvas.off('click mousedown mouseup mousemove touchstart touchmove touchend contextmenu');
    $canvas.css('pointer-events', 'none');

    // Zoom-Target deaktivieren
    const $zoomTarget = $('#zoomTarget');
    $zoomTarget.off('click mousedown mouseup mousemove touchstart touchmove touchend');

    // Auswahl-Tabs deaktivieren (Punkt/Linie/Winkel)
    $('.auswahl_tab').off('click').css({
        'pointer-events': 'none',
        'opacity': '0.5'
    });

    // Winkel-Optionen verstecken
    $('#winkel_options').hide();

    // Delete-Button verstecken
    $('#delete-btn-frs').hide();

    // Zoom-Controls verstecken
    $('.zoom_controls').hide();

    // Kalibrierungs-Info verstecken
    $('#calibration_info').hide();

    // Container nicht klickbar
    $('#container').css('pointer-events', 'none');

    // Aber Bild sichtbar lassen
    $('#linien_img1').css('pointer-events', 'none');

    console.log("reviewModeCanvasFRSWinkel: Interaktionen deaktiviert");
}