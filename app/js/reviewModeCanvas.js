/**
 * reviewModeCanvas.js - Canvas-Unterstützung für Review-Modus
 *
 * Zeichnet User-Eingaben (blau) und Musterlösungen (grün) auf Canvas.
 * Nur auf Seiten einbinden, die Canvas-Elemente haben (z.B. step0.html).
 *
 * Voraussetzung: reviewMode.js muss vorher geladen sein!
 */

$(document).ready(function() {
    // Warte kurz bis reviewMode.js fertig ist
    setTimeout(function() {
        // Prüfe ob Review-Modus aktiv (von reviewMode.js gesetzt)
        if (!window.reviewMode || !window.reviewMode.active) {
            return;
        }

        console.log("reviewModeCanvas: Canvas-Review wird initialisiert");

        const fall_id = window.reviewMode.fall_id;
        const result_id = window.reviewMode.result_id;

        // Canvas-Konfiguration für diese Seite
        initCanvasReview(fall_id, result_id);

    }, 200); // Kurze Verzögerung damit reviewMode.js zuerst läuft
});

/**
 * Initialisiert die Canvas-Elemente für den Review
 */
function initCanvasReview(fall_id, result_id) {
    // Canvas-Konfigurationen (anpassen je nach Seite)
    var canvasConfigs = [
        {
            imgId: "linien_img1",
            canvasId: "lines1",
            userPath: "enfaceResults/" + result_id + ".json",
            solutionPath: "eingabe/enface" + fall_id + ".json",
            containerSelector: "#lines_enfance"
        },
        {
            imgId: "linien_img3",
            canvasId: "lines3",
            userPath: "profilResults/" + result_id + ".json",
            solutionPath: "eingabe/profil" + fall_id + ".json",
            containerSelector: ".lines_container3"
        }
    ];

    canvasConfigs.forEach(function(config) {
        setupCanvas(config);
    });
}

/**
 * Richtet ein einzelnes Canvas ein und lädt die Daten
 */
function setupCanvas(config) {
    const $img = $('#' + config.imgId);
    const $canvas = $('#' + config.canvasId);

    if ($img.length === 0 || $canvas.length === 0) {
        console.log("Canvas nicht gefunden:", config.canvasId);
        return;
    }

    console.log("Canvas gefunden:", config.canvasId);

    const img = $img[0];

    function initAndDraw() {
        const width = img.clientWidth;
        const height = img.clientHeight;

        if (width === 0 || height === 0) {
            console.log("Bild noch nicht geladen, warte...");
            setTimeout(initAndDraw, 100);
            return;
        }

        // Canvas Größe setzen
        const canvas = $canvas[0];
        const ctx = canvas.getContext("2d");
        ctx.canvas.width = width;
        ctx.canvas.height = height;

        // Canvas leeren (falls andere Scripts schon gezeichnet haben)
        ctx.clearRect(0, 0, width, height);

        // Legende hinzufügen
        addCanvasLegend($(config.containerSelector));

        // User-Daten laden und zeichnen (blau)
        loadAndDrawJSON(config.userPath, ctx, width, height, "#18ceff");

        // Lösungs-Daten laden und zeichnen (grün)
        loadAndDrawJSON(config.solutionPath, ctx, width, height, "#18ff5a");
    }

    // Prüfe ob Bild schon geladen ist
    if (img.complete && img.naturalHeight !== 0) {
        initAndDraw();
    } else {
        img.onload = initAndDraw;
    }
}

/**
 * Fügt Legende für Farben hinzu
 */
function addCanvasLegend($container) {
    // Verhindere doppelte Legenden
    if ($container.find('.canvas_legend').length > 0) return;
    if ($container.siblings('.canvas_legend').length > 0) return;

    const legend = $(`
        <div class="canvas_legend">
            <div class="canvas_legend_item">
                <div class="canvas_legend_color user"></div>
                <span>Ihre Eingabe</span>
            </div>
            <div class="canvas_legend_item">
                <div class="canvas_legend_color solution"></div>
                <span>Musterlösung</span>
            </div>
        </div>
    `);

    $container.after(legend);
}

/**
 * Lädt JSON und zeichnet auf Canvas
 */
function loadAndDrawJSON(path, ctx, width, height, color) {
    $.ajax({
        async: false,
        global: false,
        cache: false,
        url: path,
        dataType: "json",
        success: function(data) {
            console.log("Canvas-Daten geladen:", path);
            if (data && data.values) {
                displayPoints(ctx, data.values, width, height, color);
            }
        },
        error: function() {
            console.log("Canvas-Datei nicht gefunden (normal falls User nichts eingegeben hat):", path);
        }
    });
}

/**
 * Zeichnet alle Punkte/Linien/Winkel
 */
function displayPoints(ctx, points, width, height, color) {
    points.forEach(function(point) {
        if (point.type === 'line') {
            drawLine(ctx, point.start, point.end, width, height, color);
        } else if (point.type === 'angle') {
            drawAngle(ctx, point.points, width, height, color);
        } else {
            // Einzelner Punkt
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                getXAbsolute(point.x, width),
                getYAbsolute(point.y, height),
                5,  // Punktgröße
                0,
                Math.PI * 2,
                true
            );
            ctx.fill();
        }
    });
}

/**
 * Zeichnet eine Linie
 */
function drawLine(ctx, start, end, width, height, color) {
    ctx.beginPath();
    ctx.moveTo(getXAbsolute(start.x, width), getYAbsolute(start.y, height));
    ctx.lineTo(getXAbsolute(end.x, width), getYAbsolute(end.y, height));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Zeichnet einen Winkel (3 Punkte verbunden + Winkelwert)
 */
function drawAngle(ctx, points, width, height, color) {
    // Linien zwischen den Punkten zeichnen
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(ctx, points[i], points[i + 1], width, height, color);
    }

    // Punkte markieren
    points.forEach(function(point) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
            getXAbsolute(point.x, width),
            getYAbsolute(point.y, height),
            4,
            0,
            Math.PI * 2,
            true
        );
        ctx.fill();
    });

    // Winkel berechnen und anzeigen
    if (points.length >= 3) {
        const angle = calculateAngle(points[0], points[1], points[2]);
        displayAngleValue(ctx, angle, points[1], width, height, color);
    }
}

/**
 * Berechnet den Winkel zwischen drei Punkten (Scheitelpunkt = p2)
 */
function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
    return (angleRad * 180) / Math.PI;
}

/**
 * Zeigt den Winkelwert am Scheitelpunkt an
 */
function displayAngleValue(ctx, angle, point, width, height, color) {
    const absX = getXAbsolute(point.x, width);
    const absY = getYAbsolute(point.y, height);

    // Hintergrund für bessere Lesbarkeit
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(absX + 8, absY - 22, 55, 18);

    // Winkeltext
    ctx.fillStyle = color;
    ctx.font = "bold 14px Arial";
    ctx.fillText(angle.toFixed(1) + "°", absX + 10, absY - 8);
}

/**
 * Konvertiert Prozent-X zu absoluter Position
 */
function getXAbsolute(xpercent, width) {
    return (width * xpercent) / 100;
}

/**
 * Konvertiert Prozent-Y zu absoluter Position
 */
function getYAbsolute(ypercent, height) {
    return (height * ypercent) / 100;
}