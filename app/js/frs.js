$(document).ready(function () {

    var fall = window.location.hash.substring(1).split("-")[1];
    console.log("Fall-ID:", fall);
    var filename = "frs_" + fall + ".json"

    var fallnummer = window.location.hash.substring(1).split("-")[0];

    window.moveModeActive = false;

    var points;
    var pointSize = 1.5;
    var linePointSize = 1.5;
    var lineWidth = 1;
    let cursor_type = "winkel";
    let showAngles = true;
    let useOuterAngle = false;  // false = innerer Winkel (≤180°), true = äußerer Winkel

    // ========================================
    // NEU: Linien-Subtyp Variable
    // ========================================
    let lineSubtype = "linie";  // "linie", "senkrechte", "wits"
    // ========================================

    window.selectedPoint = null;
    window.selectedLine = null;
    window.selectedAngle = null;
    window.selectedAngleLineIndex = -1;

    var lineStartPoint = null;
    var isDrawingLine = false;
    var tempEndPoint = null;
    var angleLines = [];
    var selected = null;
    var img = document.getElementById('linien_img1');
    var width = img.clientWidth;
    var height = img.clientHeight;
    var c = document.getElementById("frs_canvas");
    var ctx = c.getContext("2d");
    var canvas_ready = false;

    // Variablen für Linienverschiebung innerhalb eines Winkels
    let movingAngleLine = false;
    let angleLineIndex = -1;
    let moveOffset = { x: 0, y: 0 };

    // Für das Ersetzen einzelner Winkellinien
    let replacingAngleLine = false;
    let angleToReplace = null;
    let lineIndexToReplace = -1;

    // ========================================
    // Kalibrierung (wird aus DB geladen)
    // ========================================
    let mmPerPixel = null;
    // ========================================

    const zoomTarget = document.getElementById("zoomTarget");
    const canvas = document.getElementById("frs_canvas");

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // WICHTIG: zoomTarget verwenden, nicht canvas!
    function getRelativeMousePos(e) {
        const rect = zoomTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

    // ========================================
    // Kalibrierung aus DB laden
    // ========================================
    function loadCalibrationFromDB() {
        console.log(fallnummer);
        if (!fallnummer) return;

        $.ajax({
            type: "GET",
            url: "php/getCalibration.php",
            data: { fall_id: fallnummer },
            dataType: "json",
            success: function(result) {
                if (result.status === "OK" && result.frs_kalibrierung !== null) {
                    mmPerPixel = result.frs_kalibrierung;
                    console.log("Kalibrierung aus DB geladen:", mmPerPixel);
                    updateCalibrationInfo(true);
                    showAllPoints();
                } else {
                    console.log("Keine Kalibrierung in DB gefunden");
                    updateCalibrationInfo(false);
                }
            },
            error: function(xhr, status, error) {
                console.error("Fehler beim Laden der Kalibrierung:", error);
                updateCalibrationInfo(false);
            }
        });
    }

    // ========================================
    // Kalibrierungs-Info aktualisieren
    // ========================================
    function updateCalibrationInfo(isCalibrated) {
        const infoDiv = document.getElementById("calibration_info");
        if (!infoDiv) return;

        if (isCalibrated && mmPerPixel) {
            infoDiv.className = "calibration-info";
            infoDiv.innerHTML = '<i class="fa fa-check-circle"></i> Kalibriert: 1 px = <strong>' + mmPerPixel.toFixed(4) + ' mm</strong> – Linien zeigen mm-Werte';
        } else {
            infoDiv.className = "calibration-info not-calibrated";
            infoDiv.innerHTML = '<i class="fa fa-exclamation-triangle"></i> Nicht kalibriert – keine mm-Werte verfügbar';
        }
    }

    // ========================================
    // Linienlänge in mm berechnen
    // ========================================
    function calculateLineLengthMM(start, end) {
        if (!mmPerPixel) return null;

        const startAbs = {
            x: getXAbsolute(start.x),
            y: getYAbsolute(start.y)
        };
        const endAbs = {
            x: getXAbsolute(end.x),
            y: getYAbsolute(end.y)
        };

        const dx = endAbs.x - startAbs.x;
        const dy = endAbs.y - startAbs.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        return distPx * mmPerPixel;
    }

    // ========================================
    // NEU: Senkrechte Projektion berechnen
    // ========================================
    function projectPointOntoLine(point, lineStart, lineEnd) {
        // Punkt auf Linie projizieren (alle in Absolutkoordinaten)
        const px = getXAbsolute(point.x);
        const py = getYAbsolute(point.y);
        const x1 = getXAbsolute(lineStart.x);
        const y1 = getYAbsolute(lineStart.y);
        const x2 = getXAbsolute(lineEnd.x);
        const y2 = getYAbsolute(lineEnd.y);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLengthSquared = dx * dx + dy * dy;

        if (lineLengthSquared === 0) {
            // Linie hat keine Länge
            return { x: lineStart.x, y: lineStart.y };
        }

        // Parameter t für die Projektion auf die Linie (kann auch außerhalb 0-1 liegen)
        const t = ((px - x1) * dx + (py - y1) * dy) / lineLengthSquared;

        // Projizierter Punkt (auch außerhalb des Liniensegments erlaubt)
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return {
            x: getXPercent(projX),
            y: getYPercent(projY)
        };
    }

    // ========================================
    // NEU: Nächste Linie zum Punkt finden
    // ========================================
    function findNearestLineToPoint(pointAbs) {
        let nearestLine = null;
        let minDistance = Infinity;

        for (let obj of points.values) {
            if (obj.type === 'line') {
                // Überprüfe ob Linie Teil eines Winkels ist
                let isPartOfAngle = false;
                for (let p of points.values) {
                    if (p.type === 'angle' && p.points?.length === 3) {
                        const a = p.points;
                        if (
                            (pointsMatch(obj.start, a[0]) && pointsMatch(obj.end, a[1])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[0])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[2])) ||
                            (pointsMatch(obj.start, a[2]) && pointsMatch(obj.end, a[1]))
                        ) {
                            isPartOfAngle = true;
                            break;
                        }
                    }
                }
                if (isPartOfAngle) continue;

                // Berechne Abstand zur Linie
                const dist = distanceToLineSegment(pointAbs, obj);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestLine = obj;
                }
            }
        }

        return nearestLine;
    }

    // ========================================
    // NEU: Abstand eines Punktes zu einem Liniensegment
    // ========================================
    function distanceToLineSegment(pointAbs, line) {
        const x1 = getXAbsolute(line.start.x);
        const y1 = getYAbsolute(line.start.y);
        const x2 = getXAbsolute(line.end.x);
        const y2 = getYAbsolute(line.end.y);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLengthSquared = dx * dx + dy * dy;

        if (lineLengthSquared === 0) {
            return Math.sqrt(Math.pow(pointAbs.x - x1, 2) + Math.pow(pointAbs.y - y1, 2));
        }

        // Projektion (unbegrenzt, auch außerhalb des Segments)
        const t = ((pointAbs.x - x1) * dx + (pointAbs.y - y1) * dy) / lineLengthSquared;

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt(Math.pow(pointAbs.x - projX, 2) + Math.pow(pointAbs.y - projY, 2));
    }

    // ========================================
    // NEU: Prüfe ob zwei Linien die gleiche Ziellinie sind
    // ========================================
    function isSameTargetLine(targetStart, targetEnd, line) {
        // Prüfe ob die gespeicherte Ziellinie mit der aktuellen Linie übereinstimmt
        // (in beiden Richtungen, da Start/End vertauscht sein können)
        const tolerance = 0.1;  // Etwas großzügiger für Float-Ungenauigkeiten

        const matchForward =
            Math.abs(targetStart.x - line.start.x) < tolerance &&
            Math.abs(targetStart.y - line.start.y) < tolerance &&
            Math.abs(targetEnd.x - line.end.x) < tolerance &&
            Math.abs(targetEnd.y - line.end.y) < tolerance;

        const matchBackward =
            Math.abs(targetStart.x - line.end.x) < tolerance &&
            Math.abs(targetStart.y - line.end.y) < tolerance &&
            Math.abs(targetEnd.x - line.start.x) < tolerance &&
            Math.abs(targetEnd.y - line.start.y) < tolerance;

        return matchForward || matchBackward;
    }

    // ========================================
    // NEU: Prüfe ob eine Linie Senkrechte hat (als Ziellinie dient)
    // ========================================
    function lineHasPerpendicularsDependingOnIt(line) {
        for (let obj of points.values) {
            if (obj.type === 'line' && obj.lineSubtype === 'senkrechte' && obj.targetLineStart && obj.targetLineEnd) {
                if (isSameTargetLine(obj.targetLineStart, obj.targetLineEnd, line)) {
                    return true;
                }
            }
        }
        return false;
    }

    // ========================================
    // NEU: Aktualisiere alle Senkrechten die an einer Linie hängen
    // ========================================
    function updatePerpendicularLines(movedLine, oldStart, oldEnd) {
        // Berechne wie weit die Ziellinie verschoben wurde
        const deltaX = movedLine.start.x - oldStart.x;
        const deltaY = movedLine.start.y - oldStart.y;

        for (let obj of points.values) {
            if (obj.type === 'line' && obj.lineSubtype === 'senkrechte' && obj.targetLineStart && obj.targetLineEnd) {
                // Prüfe ob diese Senkrechte an der verschobenen Linie hängt
                const oldTargetLine = { start: oldStart, end: oldEnd };

                if (isSameTargetLine(obj.targetLineStart, obj.targetLineEnd, oldTargetLine)) {
                    // Diese Senkrechte hängt an der verschobenen Linie!
                    // Verschiebe die gesamte Senkrechte um den gleichen Betrag wie die Ziellinie
                    obj.start.x += deltaX;
                    obj.start.y += deltaY;
                    obj.end.x += deltaX;
                    obj.end.y += deltaY;

                    // Aktualisiere die gespeicherte Ziellinie-Referenz
                    obj.targetLineStart = { x: movedLine.start.x, y: movedLine.start.y };
                    obj.targetLineEnd = { x: movedLine.end.x, y: movedLine.end.y };
                }
            }
        }
    }

    // ========================================
    // NEU: Rechtwinkelsymbol am Fußpunkt zeichnen
    // ========================================
    function drawPerpendicularSymbol(startPoint, footPoint, targetLine) {
        const footX = getXAbsolute(footPoint.x);
        const footY = getYAbsolute(footPoint.y);

        // Richtungsvektor der Ziellinie
        const lineX1 = getXAbsolute(targetLine.start.x);
        const lineY1 = getYAbsolute(targetLine.start.y);
        const lineX2 = getXAbsolute(targetLine.end.x);
        const lineY2 = getYAbsolute(targetLine.end.y);

        const lineDx = lineX2 - lineX1;
        const lineDy = lineY2 - lineY1;
        const lineLen = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

        if (lineLen === 0) return;

        // Normierter Richtungsvektor der Ziellinie
        const unitX = lineDx / lineLen;
        const unitY = lineDy / lineLen;

        // Größe des Rechteck-Symbols
        const size = 8;

        // Richtungsvektor der Senkrechten (vom Fußpunkt zum Startpunkt)
        const startX = getXAbsolute(startPoint.x);
        const startY = getYAbsolute(startPoint.y);
        const perpDx = startX - footX;
        const perpDy = startY - footY;
        const perpLen = Math.sqrt(perpDx * perpDx + perpDy * perpDy);

        if (perpLen === 0) return;

        const perpUnitX = perpDx / perpLen;
        const perpUnitY = perpDy / perpLen;

        // Zeichne das kleine Quadrat
        ctx.beginPath();
        ctx.moveTo(footX + unitX * size, footY + unitY * size);
        ctx.lineTo(footX + unitX * size + perpUnitX * size, footY + unitY * size + perpUnitY * size);
        ctx.lineTo(footX + perpUnitX * size, footY + perpUnitY * size);
        ctx.strokeStyle = "#ff9900";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ========================================

    window.showAllPoints = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                let isPartOfAngle = false;

                for (let p of points.values) {
                    if (p.type === 'angle' && p.points?.length === 3) {
                        const a = p.points;
                        if (
                            (pointsMatch(objp.start, a[0]) && pointsMatch(objp.end, a[1])) ||
                            (pointsMatch(objp.start, a[1]) && pointsMatch(objp.end, a[0])) ||
                            (pointsMatch(objp.start, a[1]) && pointsMatch(objp.end, a[2])) ||
                            (pointsMatch(objp.start, a[2]) && pointsMatch(objp.end, a[1]))
                        ) {
                            isPartOfAngle = true;
                            break;
                        }
                    }
                }

                if (isPartOfAngle && !showAngles) {
                    continue;
                }

                if (isPartOfAngle) {
                    continue;
                }

                let start = objp.start;
                let end = objp.end;

                // NEU: mm-Anzeige nur bei WITS-Linien oder wenn explizit markiert
                const showMM = objp.lineSubtype === 'wits';

                // NEU: Senkrechte-Linien in anderer Farbe
                let lineColor = "#18ceff";
                if (objp.lineSubtype === 'senkrechte') {
                    lineColor = "#ff9900";  // Orange für Senkrechte
                } else if (objp.lineSubtype === 'wits') {
                    lineColor = "#67ff18";  // Grün für WITS
                }

                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red", showMM);
                } else {
                    drawLine(start, end, lineColor, showMM);
                }
            }

            else if (objp.type === 'angle') {
                if (!showAngles) continue;

                if (replacingAngleLine && angleToReplace === objp && lineIndexToReplace !== -1) {
                    for (let lineIdx = 0; lineIdx < objp.points.length - 1; lineIdx++) {
                        if (lineIdx === lineIndexToReplace) {
                            drawLine(objp.points[lineIdx], objp.points[lineIdx + 1], "#808080", false);
                        } else {
                            drawLine(objp.points[lineIdx], objp.points[lineIdx + 1], "#67ff18", false);
                        }
                    }
                    const angle = calculateAngle(objp.points[0], objp.points[1], objp.points[2]);
                    displayAngle(angle, objp.points[1], "#808080");
                }
                else if (selectedAngle && selectedAngle === objp && window.selectedAngleLineIndex !== -1) {
                    for (let lineIdx = 0; lineIdx < objp.points.length - 1; lineIdx++) {
                        if (lineIdx === window.selectedAngleLineIndex) {
                            drawLine(objp.points[lineIdx], objp.points[lineIdx + 1], "red", false);
                        } else {
                            drawLine(objp.points[lineIdx], objp.points[lineIdx + 1], "#67ff18", false);
                        }
                    }
                    const angle = calculateAngle(objp.points[0], objp.points[1], objp.points[2]);
                    displayAngle(angle, objp.points[1], "#67ff18");
                } else if (selectedAngle && selectedAngle === objp) {
                    drawAngle(objp.points, "red");
                } else {
                    drawAngle(objp.points, "#67ff18");
                }
            }

            else if (objp.type === 'point') {
                ctx.fillStyle = "#18ceff";
                if (selectedPoint && selectedPoint === objp) {
                    ctx.fillStyle = "red";
                }
                ctx.beginPath();
                ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }

        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            // NEU: Bei Senkrechte die Vorschau entsprechend anpassen
            if (cursor_type === "line" && lineSubtype === "senkrechte") {
                // Zeige Vorschau mit projiziertem Startpunkt auf die nächste Linie
                const nearestLine = findNearestLineToPoint({
                    x: getXAbsolute(tempEndPoint.x),
                    y: getYAbsolute(tempEndPoint.y)
                });
                if (nearestLine) {
                    // Projiziere STARTPUNKT auf die Ziellinie für echte Senkrechte
                    const projected = projectPointOntoLine(lineStartPoint, nearestLine.start, nearestLine.end);
                    drawLine(lineStartPoint, projected, "#ff9900", false);
                    // Zeichne auch die Ziellinie hervorgehoben
                    drawLine(nearestLine.start, nearestLine.end, "#ffcc00", false);
                    // Zeichne kleines Rechteck-Symbol am Fußpunkt um 90° anzuzeigen
                    drawPerpendicularSymbol(lineStartPoint, projected, nearestLine);
                } else {
                    drawLine(lineStartPoint, tempEndPoint, "#ff9900", false);
                }
            } else {
                const showMM = (cursor_type === "line" && lineSubtype === "wits");
                drawLine(lineStartPoint, tempEndPoint, "#67ff18", showMM);
            }
        }

        if (cursor_type === "winkel" && angleLines.length > 0) {
            for (let line of angleLines) {
                drawLine(line.start, line.end, "#67ff18", false);
            }
        }

        updateDeleteButton();
    };

    function updateDeleteButton() {
        const deleteBtn = document.getElementById("delete-btn-frs");

        if (selectedPoint || selectedLine || selectedAngle) {
            if (deleteBtn) {
                $(deleteBtn).addClass("active");
            }
        } else {
            if (deleteBtn) {
                $(deleteBtn).removeClass("active");
            }
        }
    }

    if (document.getElementById("delete-btn-frs")) {
        document.getElementById("delete-btn-frs").addEventListener("click", function() {
            if (selectedAngle && window.selectedAngleLineIndex !== -1) {
                if (confirm("Diese Winkellinie löschen und neu zeichnen?")) {
                    replacingAngleLine = true;
                    angleToReplace = selectedAngle;
                    lineIndexToReplace = window.selectedAngleLineIndex;

                    cursor_type = "winkel";
                    $(".auswahl_tab").removeClass("active");
                    $(".auswahl_tab[data-id='winkel']").addClass("active");

                    selectedAngle = null;
                    selectedPoint = null;
                    selected = null;
                    window.selectedAngleLineIndex = -1;
                    angleLineIndex = -1;

                    showAllPoints();
                    alert("Zeichnen Sie jetzt die neue Linie für den Winkel.");
                }
            } else if (selectedAngle) {
                if (confirm("Diesen Winkel wirklich löschen?")) {
                    deleteAngle(selectedAngle);
                    selectedAngle = null;
                    selectedPoint = null;
                    selected = null;
                    window.selectedAngleLineIndex = -1;
                }
            } else if (selectedLine) {
                if (confirm("Diese Linie wirklich löschen?")) {
                    deleteLine(selectedLine);
                    selectedLine = null;
                    selectedPoint = null;
                    selected = null;
                }
            } else if (selectedPoint && selectedPoint.type === 'point') {
                if (confirm("Diesen Punkt wirklich zurücksetzen?")) {
                    selectedPoint.x = 0;
                    selectedPoint.y = 0;
                    selectedPoint = null;
                    selected = null;
                }
            }
            saveJson();
            showAllPoints();
        });
    }

    loadPoints();

    function loadPoints() {
        console.log(filename);
        $.ajax({
            'async': false,
            'global': false,
            'cache': false,
            'url': "frs_results/" + filename,
            'dataType': "json",
            'success': function (data) {
                points = data;
                loadCalibrationFromDB();
                showAllPoints();
            },
            'error': function(xhr, status, error) {
                console.log("Datei nicht gefunden:", error);
                points = { values: [] };
                loadCalibrationFromDB();
                showAllPoints();
            }
        });
    }

    function pointsMatch(p1, p2) {
        return Math.abs(p1.x - p2.x) < 0.0001 && Math.abs(p1.y - p2.y) < 0.0001;
    }

    function deleteLine(lineToDelete) {
        points.values = points.values.filter(function (point) {
            return point !== lineToDelete;
        });
        saveJson();
    }

    function deleteAngle(angleToDelete) {
        const anglePoints = angleToDelete.points;
        points.values = points.values.filter(point => point !== angleToDelete);
        points.values = points.values.filter(point => {
            if (point.type !== "line" || !point.partOfAngle) return true;
            const s = point.start;
            const e = point.end;
            const matchesAny = (
                (pointsMatch(s, anglePoints[0]) && pointsMatch(e, anglePoints[1])) ||
                (pointsMatch(s, anglePoints[1]) && pointsMatch(e, anglePoints[0])) ||
                (pointsMatch(s, anglePoints[1]) && pointsMatch(e, anglePoints[2])) ||
                (pointsMatch(s, anglePoints[2]) && pointsMatch(e, anglePoints[1]))
            );
            return !matchesAny;
        });
        saveJson();
        showAllPoints();
    }

    function isPointOnLine(mouseX, mouseY, line) {
        const startAbs = { x: getXAbsolute(line.start.x), y: getYAbsolute(line.start.y) };
        const endAbs = { x: getXAbsolute(line.end.x), y: getYAbsolute(line.end.y) };
        const threshold = 5;
        const lineLength = Math.sqrt(Math.pow(endAbs.x - startAbs.x, 2) + Math.pow(endAbs.y - startAbs.y, 2));
        const distToStart = Math.sqrt(Math.pow(mouseX - startAbs.x, 2) + Math.pow(mouseY - startAbs.y, 2));
        const distToEnd = Math.sqrt(Math.pow(mouseX - endAbs.x, 2) + Math.pow(mouseY - endAbs.y, 2));
        const distToLine = Math.abs((endAbs.y - startAbs.y) * mouseX - (endAbs.x - startAbs.x) * mouseY + endAbs.x * startAbs.y - endAbs.y * startAbs.x) / lineLength;
        const isOnSegment = Math.abs(distToStart + distToEnd - lineLength) < threshold;
        return distToLine < threshold && isOnSegment;
    }

    function checkLineBodyAtPosition(mouseX, mouseY) {
        for (let i = points.values.length - 1; i >= 0; i--) {
            let obj = points.values[i];
            if (obj.type === 'line') {
                let isPartOfAngle = false;
                for (let p of points.values) {
                    if (p.type === 'angle' && p.points?.length === 3) {
                        const a = p.points;
                        if ((pointsMatch(obj.start, a[0]) && pointsMatch(obj.end, a[1])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[0])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[2])) ||
                            (pointsMatch(obj.start, a[2]) && pointsMatch(obj.end, a[1]))) {
                            isPartOfAngle = true;
                            break;
                        }
                    }
                }
                if (isPartOfAngle) continue;
                let startAbs = { x: getXAbsolute(obj.start.x), y: getYAbsolute(obj.start.y) };
                let endAbs = { x: getXAbsolute(obj.end.x), y: getYAbsolute(obj.end.y) };
                if (isPointNear(mouseX, mouseY, startAbs) || isPointNear(mouseX, mouseY, endAbs)) continue;
                if (isPointOnLine(mouseX, mouseY, obj)) return obj;
            }
        }
        return null;
    }

    function checkWhichAngleLineClicked(mouseX, mouseY, angle) {
        if (!angle.points || angle.points.length !== 3) return -1;
        const line1 = { start: angle.points[0], end: angle.points[1] };
        const line2 = { start: angle.points[1], end: angle.points[2] };
        if (isPointOnLine(mouseX, mouseY, line1)) return 0;
        if (isPointOnLine(mouseX, mouseY, line2)) return 1;
        return -1;
    }

    function findAngleAndLineAtPosition(mouseX, mouseY) {
        for (let i = points.values.length - 1; i >= 0; i--) {
            let obj = points.values[i];
            if (obj.type === 'angle') {
                for (let pt of obj.points) {
                    let absX = getXAbsolute(pt.x);
                    let absY = getYAbsolute(pt.y);
                    if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) return null;
                }
                let lineIndex = checkWhichAngleLineClicked(mouseX, mouseY, obj);
                if (lineIndex !== -1) return { angle: obj, lineIndex: lineIndex };
            }
        }
        return null;
    }

    c.addEventListener('mousedown', function (e) {
        if (window.moveModeActive) return;
        if (e.button !== 0) return;
        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (cursor_type === "point") {
            let clickedPoint = checkPointAtPosition(mouseX, mouseY);
            if (selectedPoint && clickedPoint && clickedPoint.point === selectedPoint) {
                selectedPoint = null; selected = null; showAllPoints(); return;
            }
            if (clickedPoint) {
                selectedPoint = clickedPoint.point; selected = selectedPoint;
                canvas_ready = true; window.isDraggingPoint = true; showAllPoints(); return;
            }
            if (selectedPoint) {
                selectedPoint.x = getXPercent(mouseX); selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true; showAllPoints();
            } else {
                selectedPoint = null; selectedLine = null; selectedAngle = null; showAllPoints();
            }
        }
        else if (cursor_type === "line") {
            // ========================================
            // WITS-Modus: Nur Zeichnen, keine Auswahl
            // ========================================
            if (lineSubtype === "wits") {
                selectedPoint = null; selectedLine = null;
                lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                isDrawingLine = true;
                return;
            }

            let clickedLinePoint = checkLinePointAtPosition(mouseX, mouseY);

            // ========================================
            // Senkrechte-Linien: Keine Einzelpunkt-Auswahl
            // ========================================
            if (clickedLinePoint && clickedLinePoint.line.lineSubtype === "senkrechte") {
                // Bei Senkrechten nur ganze Linie auswählen, nicht einzelne Punkte
                selectedLine = clickedLinePoint.line;
                selected = selectedLine;
                selectedPoint = null;
                canvas_ready = true;
                moveOffset = { x: mouseX, y: mouseY };
                showAllPoints();
                return;
            }

            // ========================================
            // Ziellinien mit Senkrechten: Auch keine Einzelpunkt-Auswahl
            // ========================================
            if (clickedLinePoint && lineHasPerpendicularsDependingOnIt(clickedLinePoint.line)) {
                // Bei Ziellinien nur ganze Linie auswählen, nicht einzelne Punkte
                selectedLine = clickedLinePoint.line;
                selected = selectedLine;
                selectedPoint = null;
                canvas_ready = true;
                moveOffset = { x: mouseX, y: mouseY };
                showAllPoints();
                return;
            }

            if (selectedLine && clickedLinePoint && clickedLinePoint.line === selectedLine) {
                // Bei Senkrechten oder Ziellinien keine Punkt-Bearbeitung
                if (selectedLine.lineSubtype === "senkrechte" || lineHasPerpendicularsDependingOnIt(selectedLine)) {
                    canvas_ready = true;
                    moveOffset = { x: mouseX, y: mouseY };
                    showAllPoints();
                    return;
                }
                selectedPoint = clickedLinePoint.point; canvas_ready = true;
                window.isDraggingPoint = true; showAllPoints(); return;
            }
            if (selectedLine && isPointOnLine(mouseX, mouseY, selectedLine)) {
                canvas_ready = true; moveOffset = { x: mouseX, y: mouseY }; showAllPoints(); return;
            }
            if (selectedLine) { selectedPoint = null; selectedLine = null; selected = null; showAllPoints(); return; }
            if (clickedLinePoint) {
                // Prüfe ob die Linie Senkrechte hat - dann keine Punkt-Auswahl
                if (lineHasPerpendicularsDependingOnIt(clickedLinePoint.line)) {
                    selectedLine = clickedLinePoint.line;
                    selected = selectedLine;
                    selectedPoint = null;
                    canvas_ready = true;
                    moveOffset = { x: mouseX, y: mouseY };
                    showAllPoints();
                    return;
                }
                selectedLine = clickedLinePoint.line; selectedPoint = clickedLinePoint.point;
                selected = selectedLine; canvas_ready = true; window.isDraggingPoint = true; showAllPoints();
            } else {
                let clickedLine = checkLineBodyAtPosition(mouseX, mouseY);
                if (clickedLine) {
                    selectedLine = clickedLine; selected = selectedLine; canvas_ready = true;
                    moveOffset = { x: mouseX, y: mouseY }; showAllPoints();
                } else {
                    selectedPoint = null; selectedLine = null;
                    lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) }; isDrawingLine = true;
                }
            }
        }
        else if (cursor_type === "winkel") {
            let clickedAnglePoint = checkAnglePointAtPosition(mouseX, mouseY);
            if (clickedAnglePoint) {
                selectedAngle = clickedAnglePoint.angle; selectedPoint = clickedAnglePoint.point;
                selected = selectedAngle; canvas_ready = true; movingAngleLine = false;
                window.isDraggingPoint = true; window.selectedAngleLineIndex = -1; showAllPoints();
            } else {
                let angleLineResult = findAngleAndLineAtPosition(mouseX, mouseY);
                if (angleLineResult) {
                    selectedAngle = angleLineResult.angle; selected = selectedAngle; canvas_ready = true;
                    movingAngleLine = true; angleLineIndex = angleLineResult.lineIndex;
                    window.selectedAngleLineIndex = angleLineResult.lineIndex;
                    moveOffset = { x: mouseX, y: mouseY }; showAllPoints();
                } else {
                    selectedPoint = null; selectedLine = null; selectedAngle = null;
                    window.selectedAngleLineIndex = -1;
                    lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) }; isDrawingLine = true;
                }
            }
        }
    });

    function checkPointAtPosition(mouseX, mouseY) {
        for (let i = points.values.length - 1; i >= 0; i--) {
            let obj = points.values[i];
            if (obj.type === 'point') {
                let absX = getXAbsolute(obj.x); let absY = getYAbsolute(obj.y);
                if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) return { point: obj, index: i };
            }
        }
        return null;
    }

    function checkLinePointAtPosition(mouseX, mouseY) {
        for (let i = points.values.length - 1; i >= 0; i--) {
            let obj = points.values[i];
            if (obj.type === 'line') {
                let isPartOfAngle = false;
                for (let p of points.values) {
                    if (p.type === 'angle' && p.points?.length === 3) {
                        const a = p.points;
                        if ((pointsMatch(obj.start, a[0]) && pointsMatch(obj.end, a[1])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[0])) ||
                            (pointsMatch(obj.start, a[1]) && pointsMatch(obj.end, a[2])) ||
                            (pointsMatch(obj.start, a[2]) && pointsMatch(obj.end, a[1]))) {
                            isPartOfAngle = true; break;
                        }
                    }
                }
                if (isPartOfAngle) continue;
                let startAbs = { x: getXAbsolute(obj.start.x), y: getYAbsolute(obj.start.y) };
                let endAbs = { x: getXAbsolute(obj.end.x), y: getYAbsolute(obj.end.y) };
                if (isPointNear(mouseX, mouseY, startAbs)) return { line: obj, point: obj.start, isStart: true };
                if (isPointNear(mouseX, mouseY, endAbs)) return { line: obj, point: obj.end, isStart: false };
            }
        }
        return null;
    }

    function checkAnglePointAtPosition(mouseX, mouseY) {
        for (let i = points.values.length - 1; i >= 0; i--) {
            let obj = points.values[i];
            if (obj.type === 'angle' && obj.points?.length === 3) {
                for (let j = 0; j < obj.points.length; j++) {
                    let anglePoint = obj.points[j];
                    let absX = getXAbsolute(anglePoint.x); let absY = getYAbsolute(anglePoint.y);
                    if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) {
                        return { angle: obj, point: anglePoint, pointIndex: j };
                    }
                }
            }
        }
        return null;
    }

    c.addEventListener('mousemove', function (e) {
        if (window.moveModeActive) return;
        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (isDrawingLine && lineStartPoint) {
            tempEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) }; showAllPoints();
        }
        if (canvas_ready && movingAngleLine && selectedAngle && angleLineIndex !== -1) {
            const deltaX = mouseX - moveOffset.x; const deltaY = mouseY - moveOffset.y;
            const deltaXPercent = getXPercent(deltaX); const deltaYPercent = getYPercent(deltaY);
            if (angleLineIndex === 0) {
                selectedAngle.points[0].x += deltaXPercent; selectedAngle.points[0].y += deltaYPercent;
                selectedAngle.points[1].x += deltaXPercent; selectedAngle.points[1].y += deltaYPercent;
            } else if (angleLineIndex === 1) {
                selectedAngle.points[1].x += deltaXPercent; selectedAngle.points[1].y += deltaYPercent;
                selectedAngle.points[2].x += deltaXPercent; selectedAngle.points[2].y += deltaYPercent;
            }
            selectedAngle.angle = calculateAngle(selectedAngle.points[0], selectedAngle.points[1], selectedAngle.points[2]);
            moveOffset.x = mouseX; moveOffset.y = mouseY; showAllPoints();
        }
            // ========================================
            // NEU: Senkrechte-Linie entlang Ziellinie verschieben
        // ========================================
        else if (canvas_ready && selectedLine && selectedLine.lineSubtype === "senkrechte" && !selectedPoint) {
            // Hole die Ziellinie aus den gespeicherten Referenzen
            if (selectedLine.targetLineStart && selectedLine.targetLineEnd) {
                const targetLine = {
                    start: selectedLine.targetLineStart,
                    end: selectedLine.targetLineEnd
                };

                // Berechne die aktuelle Länge der Senkrechten (Abstand Start zu Fußpunkt)
                const currentLength = Math.sqrt(
                    Math.pow(getXAbsolute(selectedLine.start.x) - getXAbsolute(selectedLine.end.x), 2) +
                    Math.pow(getYAbsolute(selectedLine.start.y) - getYAbsolute(selectedLine.end.y), 2)
                );

                // Projiziere Mausposition auf die Ziellinie -> neuer Fußpunkt
                const mousePoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                const newFootPoint = projectPointOntoLine(mousePoint, targetLine.start, targetLine.end);

                // Berechne Richtungsvektor der Ziellinie
                const targetDx = getXAbsolute(targetLine.end.x) - getXAbsolute(targetLine.start.x);
                const targetDy = getYAbsolute(targetLine.end.y) - getYAbsolute(targetLine.start.y);
                const targetLen = Math.sqrt(targetDx * targetDx + targetDy * targetDy);

                if (targetLen > 0) {
                    // Senkrechter Richtungsvektor (90° zur Ziellinie)
                    const perpUnitX = -targetDy / targetLen;
                    const perpUnitY = targetDx / targetLen;

                    // Bestimme Richtung (auf welcher Seite der Ziellinie liegt der Startpunkt?)
                    const oldStartX = getXAbsolute(selectedLine.start.x);
                    const oldStartY = getYAbsolute(selectedLine.start.y);
                    const oldFootX = getXAbsolute(selectedLine.end.x);
                    const oldFootY = getYAbsolute(selectedLine.end.y);
                    const oldDirX = oldStartX - oldFootX;
                    const oldDirY = oldStartY - oldFootY;

                    // Prüfe ob gleiche Richtung
                    const dotProduct = oldDirX * perpUnitX + oldDirY * perpUnitY;
                    const sign = dotProduct >= 0 ? 1 : -1;

                    // Neuer Startpunkt = Fußpunkt + Länge * senkrechter Richtungsvektor
                    const newFootX = getXAbsolute(newFootPoint.x);
                    const newFootY = getYAbsolute(newFootPoint.y);
                    const newStartX = newFootX + sign * perpUnitX * currentLength;
                    const newStartY = newFootY + sign * perpUnitY * currentLength;

                    // Aktualisiere die Linie
                    selectedLine.start.x = getXPercent(newStartX);
                    selectedLine.start.y = getYPercent(newStartY);
                    selectedLine.end.x = newFootPoint.x;
                    selectedLine.end.y = newFootPoint.y;
                }

                moveOffset.x = mouseX; moveOffset.y = mouseY;
                showAllPoints();
            }
        }
            // ========================================
            // Normale Linien verschieben (ganze Linie)
        // ========================================
        else if (canvas_ready && selectedLine && !selectedPoint) {
            // Speichere alte Position für Senkrechten-Update
            const oldStart = { x: selectedLine.start.x, y: selectedLine.start.y };
            const oldEnd = { x: selectedLine.end.x, y: selectedLine.end.y };

            const deltaX = mouseX - moveOffset.x;
            const deltaY = mouseY - moveOffset.y;
            const deltaXPercent = getXPercent(deltaX);
            const deltaYPercent = getYPercent(deltaY);

            selectedLine.start.x += deltaXPercent;
            selectedLine.start.y += deltaYPercent;
            selectedLine.end.x += deltaXPercent;
            selectedLine.end.y += deltaYPercent;

            // Aktualisiere alle Senkrechten die an dieser Linie hängen
            if (selectedLine.lineSubtype !== 'senkrechte') {
                updatePerpendicularLines(selectedLine, oldStart, oldEnd);
            }

            moveOffset.x = mouseX;
            moveOffset.y = mouseY;
            showAllPoints();
        }
            // ========================================
            // Einzelne Punkte verschieben
        // ========================================
        else if (canvas_ready && selectedPoint) {
            // Speichere alte Position falls es ein Linien-Endpunkt ist
            let lineWithMovedPoint = null;
            let oldStart = null;
            let oldEnd = null;

            // Finde die Linie zu der dieser Punkt gehört
            if (selectedLine && selectedLine.lineSubtype !== 'senkrechte') {
                oldStart = { x: selectedLine.start.x, y: selectedLine.start.y };
                oldEnd = { x: selectedLine.end.x, y: selectedLine.end.y };
                lineWithMovedPoint = selectedLine;
            }

            selectedPoint.x = getXPercent(mouseX);
            selectedPoint.y = getYPercent(mouseY);

            // Aktualisiere Senkrechte falls ein Linien-Endpunkt verschoben wurde
            if (lineWithMovedPoint) {
                updatePerpendicularLines(lineWithMovedPoint, oldStart, oldEnd);
            }

            if (selectedAngle) {
                const index = selectedAngle.points.indexOf(selectedPoint);
                if (index !== -1) {
                    selectedAngle.points[index] = selectedPoint;
                    selectedAngle.angle = calculateAngle(selectedAngle.points[0], selectedAngle.points[1], selectedAngle.points[2]);
                }
            }
            showAllPoints();
        }
    });

    c.addEventListener('mouseup', function (e) {
        if (window.moveModeActive) return;
        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);
        let lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

        if (isDrawingLine && lineStartPoint) {
            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                if (replacingAngleLine && angleToReplace && lineIndexToReplace !== -1) {
                    const existingLineIndex = lineIndexToReplace === 0 ? 1 : 0;
                    let existingLine = existingLineIndex === 0
                        ? { start: angleToReplace.points[0], end: angleToReplace.points[1] }
                        : { start: angleToReplace.points[1], end: angleToReplace.points[2] };
                    const newLine = { start: lineStartPoint, end: lineEndPoint };
                    const intersection = getLineIntersection(existingLine, newLine);
                    if (intersection) {
                        const distStart = Math.sqrt(Math.pow(getXAbsolute(lineStartPoint.x) - getXAbsolute(intersection.x), 2) + Math.pow(getYAbsolute(lineStartPoint.y) - getYAbsolute(intersection.y), 2));
                        const distEnd = Math.sqrt(Math.pow(getXAbsolute(lineEndPoint.x) - getXAbsolute(intersection.x), 2) + Math.pow(getYAbsolute(lineEndPoint.y) - getYAbsolute(intersection.y), 2));
                        const outerPoint = (distStart > distEnd) ? lineStartPoint : lineEndPoint;
                        const distExistStart = Math.sqrt(Math.pow(getXAbsolute(existingLine.start.x) - getXAbsolute(intersection.x), 2) + Math.pow(getYAbsolute(existingLine.start.y) - getYAbsolute(intersection.y), 2));
                        const distExistEnd = Math.sqrt(Math.pow(getXAbsolute(existingLine.end.x) - getXAbsolute(intersection.x), 2) + Math.pow(getYAbsolute(existingLine.end.y) - getYAbsolute(intersection.y), 2));
                        const existingOuterPoint = (distExistStart > distExistEnd) ? existingLine.start : existingLine.end;
                        angleToReplace.points = lineIndexToReplace === 0 ? [outerPoint, intersection, existingOuterPoint] : [existingOuterPoint, intersection, outerPoint];
                        angleToReplace.angle = calculateAngle(angleToReplace.points[0], angleToReplace.points[1], angleToReplace.points[2]);
                    } else { alert("Die neue Linie schneidet sich nicht mit der bestehenden Linie!"); }
                    replacingAngleLine = false; angleToReplace = null; lineIndexToReplace = -1;
                    saveJson(); showAllPoints();
                } else {
                    // ========================================
                    // NEU: Unterscheide zwischen Linien-Subtypen
                    // ========================================
                    if (cursor_type === "line") {
                        let nearestLine = null;  // Außerhalb definieren für späteren Zugriff

                        // Senkrechte: STARTPUNKT auf nächste Linie projizieren (ergibt senkrechte Linie)
                        if (lineSubtype === "senkrechte") {
                            nearestLine = findNearestLineToPoint({ x: mouseX, y: mouseY });
                            if (nearestLine) {
                                // Projiziere den STARTPUNKT auf die Ziellinie
                                // Die Linie von Start zum Fußpunkt ist dann senkrecht
                                lineEndPoint = projectPointOntoLine(lineStartPoint, nearestLine.start, nearestLine.end);
                            } else {
                                alert("Keine Linie gefunden, auf die senkrecht projiziert werden kann. Bitte zuerst eine Linie zeichnen.");
                                isDrawingLine = false;
                                lineStartPoint = null;
                                tempEndPoint = null;
                                return;
                            }
                        }

                        const newLine = {
                            name: 'Linie',
                            type: 'line',
                            start: lineStartPoint,
                            end: lineEndPoint,
                            isNew: true,
                            lineSubtype: lineSubtype  // NEU: Speichere den Subtyp
                        };

                        // Bei Senkrechten: Speichere Referenz zur Ziellinie
                        if (lineSubtype === "senkrechte" && nearestLine) {
                            newLine.targetLineStart = { x: nearestLine.start.x, y: nearestLine.start.y };
                            newLine.targetLineEnd = { x: nearestLine.end.x, y: nearestLine.end.y };
                        }

                        points.values.push(newLine);
                        saveJson();
                        showAllPoints();
                    }
                    // ========================================
                    else if (cursor_type === "winkel") {
                        const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true, partOfAngle: true };
                        angleLines.push(newLine);
                        if (angleLines.length === 2) {
                            const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                            if (intersection) {
                                const angle = calculateAngle(angleLines[0].start, intersection, angleLines[1].end);
                                points.values.push({ name: "Winkel", type: "angle", points: [angleLines[0].start, intersection, angleLines[1].end], angle: angle });
                                saveJson(); showAllPoints();
                            }
                            angleLines = [];
                        }
                    } else {
                        const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true };
                        points.values.push(newLine);
                        saveJson();
                        showAllPoints();
                    }
                }
            }
            isDrawingLine = false; lineStartPoint = null; tempEndPoint = null;
        }
        if (canvas_ready) {
            if (selectedPoint && !movingAngleLine) { selectedPoint.x = getXPercent(mouseX); selectedPoint.y = getYPercent(mouseY); }
            saveJson(); canvas_ready = false; movingAngleLine = false; angleLineIndex = -1; showAllPoints();
        }
        window.isDraggingPoint = false;
    });

    function getLineIntersection(l1, l2) {
        let x1 = getXAbsolute(l1.start.x), y1 = getYAbsolute(l1.start.y);
        let x2 = getXAbsolute(l1.end.x), y2 = getYAbsolute(l1.end.y);
        let x3 = getXAbsolute(l2.start.x), y3 = getYAbsolute(l2.start.y);
        let x4 = getXAbsolute(l2.end.x), y4 = getYAbsolute(l2.end.y);
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return null;
        const px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
        const py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;
        return { x: getXPercent(px), y: getYPercent(py) };
    }

    function drawLine(start, end, color, showMM) {
        ctx.beginPath();
        ctx.moveTo(getXAbsolute(start.x), getYAbsolute(start.y));
        ctx.lineTo(getXAbsolute(end.x), getYAbsolute(end.y));
        ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(getXAbsolute(start.x), getYAbsolute(start.y), linePointSize, 0, Math.PI * 2, true); ctx.fill(); ctx.closePath();
        ctx.beginPath(); ctx.arc(getXAbsolute(end.x), getYAbsolute(end.y), linePointSize, 0, Math.PI * 2, true); ctx.fill(); ctx.closePath();

        if (showMM && mmPerPixel) {
            const lengthMM = calculateLineLengthMM(start, end);
            if (lengthMM !== null) {
                const startX = getXAbsolute(start.x);
                const startY = getYAbsolute(start.y);
                const endX = getXAbsolute(end.x);
                const endY = getYAbsolute(end.y);

                // Mittelpunkt der Linie
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;

                // Richtungsvektor der Linie
                const dx = endX - startX;
                const dy = endY - startY;
                const len = Math.sqrt(dx * dx + dy * dy);

                // Senkrechter Vektor (90° gedreht) - normiert
                const perpX = -dy / len;
                const perpY = dx / len;

                // Offset senkrecht zur Linie (15px Abstand)
                const offsetDistance = 15;
                const textX = midX + perpX * offsetDistance;
                const textY = midY + perpY * offsetDistance;

                const text = lengthMM.toFixed(2) + " mm";
                ctx.font = "bold 11px Arial";
                const textWidth = ctx.measureText(text).width;

                // Hintergrund zentriert um den Text
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(textX - textWidth/2 - 3, textY - 8, textWidth + 6, 14);

                // Text zentriert
                ctx.fillStyle = "#67ff18";
                ctx.textAlign = "center";
                ctx.fillText(text, textX, textY + 3);
                ctx.textAlign = "left";  // Reset
            }
        }
    }



    function drawAngle(pts, color) {
        // Linien zeichnen
        for (let i = 0; i < pts.length - 1; i++) {
            drawLine(pts[i], pts[i + 1], color, false);
        }

        // Winkel berechnen und Bogen zeichnen
        const angle = calculateAngle(pts[0], pts[1], pts[2]);
        drawAngleArc(pts[0], pts[1], pts[2]);
        displayAngle(angle, pts[1], color);
    }

    function drawAngleArc(p1, vertex, p3) {
        const vx = getXAbsolute(vertex.x);
        const vy = getYAbsolute(vertex.y);
        const p1x = getXAbsolute(p1.x);
        const p1y = getYAbsolute(p1.y);
        const p3x = getXAbsolute(p3.x);
        const p3y = getYAbsolute(p3.y);

        // Winkel der beiden Schenkel berechnen
        const angle1 = Math.atan2(p1y - vy, p1x - vx);
        const angle2 = Math.atan2(p3y - vy, p3x - vx);

        // Radius für den Bogen
        const dist1 = Math.sqrt(Math.pow(p1x - vx, 2) + Math.pow(p1y - vy, 2));
        const dist2 = Math.sqrt(Math.pow(p3x - vx, 2) + Math.pow(p3y - vy, 2));
        const arcRadius = Math.min(dist1, dist2, 35) * 0.5;

        // Berechne die Differenz für die Bogenrichtung
        let diff = angle2 - angle1;

        // Normalisiere auf -PI bis PI
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        // Für den inneren Winkel: wenn diff positiv, gegen Uhrzeigersinn; wenn negativ, im Uhrzeigersinn
        let counterclockwise = diff < 0;

        // Bei äußerem Winkel umkehren
        if (useOuterAngle) {
            counterclockwise = !counterclockwise;
        }

        // Bogen zeichnen - immer ROT
        ctx.beginPath();
        ctx.arc(vx, vy, arcRadius, angle1, angle2, counterclockwise);
        ctx.strokeStyle = "#67ff18";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Halbtransparente rote Füllung
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.arc(vx, vy, arcRadius, angle1, angle2, counterclockwise);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 50, 50, 0.2)";
        ctx.fill();
    }

    function displayAngle(angle, point, color) {
        let absX = getXAbsolute(point.x);
        let absY = getYAbsolute(point.y);

        // Text etwas weiter vom Scheitelpunkt entfernt positionieren
        let textX = Math.max(5, Math.min(canvas.width - 50, absX + 15));
        let textY = Math.max(20, Math.min(canvas.height - 5, absY - 15));

        // Hintergrund für bessere Lesbarkeit
        const text = angle.toFixed(1) + "°";
        ctx.font = "bold 13px Arial";
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(textX - 2, textY - 13, textWidth + 4, 16);

        ctx.fillStyle = color || "#67ff18";
        ctx.fillText(text, textX, textY);
    }

    function calculateAngle(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dotProduct = v1.x * v2.x + v1.y * v2.y;
        const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
        const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
        const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
        let angle = (angleRad * 180) / Math.PI;

        if (useOuterAngle) {
            angle = 360 - angle;
        }

        return angle;
    }


    function isPointNear(x, y, point) {
        return Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2) < pointSize + 5;
    }

    function getXPercent(x) { return (x / canvas.width) * 100; }
    function getYPercent(y) { return (y / canvas.height) * 100; }
    function getXAbsolute(xpercent) { return (canvas.width * xpercent) / 100; }
    function getYAbsolute(ypercent) { return (canvas.height * ypercent) / 100; }

    function saveJson() {
        console.log(filename);
        $.ajax({ type: "POST", url: "writefrsResult.php", data: { json: JSON.stringify(points), filename: JSON.stringify(filename) },
            success: function () { console.log("Daten gespeichert!"); }
        });
    }

    // ========================================
    // NEU: Linien-Modus UI aktualisieren
    // ========================================
    function updateLineModeUI() {
        const infoDiv = document.getElementById("line_mode_info");
        const textSpan = document.getElementById("line_mode_text");
        const hintDiv = document.getElementById("senkrechte_hint");

        if (cursor_type === "line") {
            if (infoDiv) infoDiv.classList.add("visible");

            switch (lineSubtype) {
                case "linie":
                    if (textSpan) textSpan.textContent = "Linie ohne mm-Anzeige";
                    if (hintDiv) hintDiv.classList.remove("visible");
                    break;
                case "senkrechte":
                    if (textSpan) textSpan.textContent = "Senkrechte";
                    if (hintDiv) hintDiv.classList.add("visible");
                    break;
                case "wits":
                    if (textSpan) textSpan.textContent = "WITS-Linie mit mm-Anzeige";
                    if (hintDiv) hintDiv.classList.remove("visible");
                    break;
            }
        } else {
            if (infoDiv) infoDiv.classList.remove("visible");
            if (hintDiv) hintDiv.classList.remove("visible");
        }
    }

    $("body").on("click", ".auswahl_tab", function (e) {
        // Verhindere Klick auf Submenu-Buttons
        if ($(e.target).hasClass("line_sub_btn")) {
            return;
        }

        $('#zoomTarget').css("cursor", "default");
        window.moveModeActive = false;
        $('#move_mode3').removeClass("active");

        const clickedId = $(this).attr("data-id");

        // Submenu Toggle für Linie
        if (clickedId === "line") {
            const submenu = document.getElementById("line_submenu");
            if (submenu) {
                submenu.classList.toggle("visible");
            }
        } else {
            // Andere Tabs - Submenu schließen
            const submenu = document.getElementById("line_submenu");
            if (submenu) {
                submenu.classList.remove("visible");
            }
        }

        cursor_type = clickedId;
        $(".auswahl_tab").removeClass("active");
        $(this).addClass("active");
        selectedPoint = null;
        selectedLine = null;
        selectedAngle = null;
        selected = null;
        canvas_ready = false;
        replacingAngleLine = false;
        angleToReplace = null;
        lineIndexToReplace = -1;
        window.selectedAngleLineIndex = -1;
        if (cursor_type !== "winkel") angleLines = [];

        updateWinkelOptions();
        updateLineModeUI();

        showAllPoints();
    });

    // ========================================
    // NEU: Submenu-Button Klick Handler
    // ========================================
    $("body").on("click", ".line_sub_btn", function (e) {
        e.stopPropagation();  // Verhindere Bubbling zum Tab

        lineSubtype = $(this).attr("data-subtype");

        // Aktiven Button markieren
        $(".line_sub_btn").removeClass("active");
        $(this).addClass("active");

        // Cursor-Typ auf Linie setzen
        cursor_type = "line";
        $(".auswahl_tab").removeClass("active");
        $(".auswahl_tab[data-id='line']").addClass("active");

        // Submenu schließen
        const submenu = document.getElementById("line_submenu");
        if (submenu) {
            submenu.classList.remove("visible");
        }

        // Auswahl zurücksetzen
        selectedPoint = null;
        selectedLine = null;
        selectedAngle = null;
        selected = null;
        canvas_ready = false;
        window.selectedAngleLineIndex = -1;
        angleLines = [];

        updateWinkelOptions();
        updateLineModeUI();
        showAllPoints();

        console.log("Linien-Subtyp gewählt:", lineSubtype);
    });

    // ========================================
    // Submenu bei Klick außerhalb schließen
    // ========================================
    $(document).on("click", function (e) {
        if (!$(e.target).closest(".auswahl_tab[data-id='line']").length) {
            const submenu = document.getElementById("line_submenu");
            if (submenu) {
                submenu.classList.remove("visible");
            }
        }
    });

    $("body").on("click", "#einbl", function (e) {
        const $btn = $(e.currentTarget); showAngles = !showAngles;
        if (!showAngles) { $btn.removeClass("clicked"); $btn.html('<i class="fa fa-eye"></i>'); }
        else { $btn.addClass("clicked"); $btn.html('<i class="fa fa-eye-slash"></i>'); }
        showAllPoints();
    });

    $(document).on("click", "#value_btn", function (e) {
        let err = 0;
        let inputs = document.getElementsByTagName("input");
        for (let i = 0; i < inputs.length; i++) {
            if(inputs[i].value.length <= 0){
                if($($(inputs[i]).parent(".input_cont")[0]).hasClass("grey") || $(inputs[i]).is(":disabled")) continue;
                else { alert("Bitte alle Felder ausfüllen!"); err = 1; break; }
            }
        }
        if(err === 0){
            let obj = { id: window.location.hash.substring(1).split("-")[0] };
            $.ajax({ type: "POST", url: 'php/getValues.php', contentType: "application/json; charset=utf-8",
                dataType: "json", data: JSON.stringify(obj),
                success: function (result) {
                    selectedPoint = null; selectedLine = null; selectedAngle = null; selected = null;
                    var fallnummer = window.location.hash.substring(1).split("-")[0];
                    document.getElementById('linien_img1').src = 'images/winkel' + fallnummer + '.jpg';
                    $("#next_btn").removeClass("inactive"); $("#value_btn").addClass("inactive");
                }
            });
        }
    });

    c.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);
        for (let obj of points.values) {
            if (obj.type === "angle") {
                for (let j = 0; j < obj.points.length; j++) {
                    if (isPointNear(mouseX, mouseY, { x: getXAbsolute(obj.points[j].x), y: getYAbsolute(obj.points[j].y) })) {
                        if (confirm("Diesen Winkel wirklich löschen?")) { deleteAngle(obj); selectedAngle = null; saveJson(); showAllPoints(); }
                        return false;
                    }
                }
            }
            if (obj.type === "line") {
                let startAbs = { x: getXAbsolute(obj.start.x), y: getYAbsolute(obj.start.y) };
                let endAbs = { x: getXAbsolute(obj.end.x), y: getYAbsolute(obj.end.y) };
                if (isPointNear(mouseX, mouseY, startAbs) || isPointNear(mouseX, mouseY, endAbs)) {
                    if (confirm("Diese Linie wirklich löschen?")) { deleteLine(obj); selectedLine = null; saveJson(); showAllPoints(); }
                    return false;
                }
            }
            if (obj.type === "point") {
                if (isPointNear(mouseX, mouseY, { x: getXAbsolute(obj.x), y: getYAbsolute(obj.y) })) {
                    if (confirm("Diesen Punkt wirklich löschen?")) { obj.x = 0; obj.y = 0; selectedPoint = null; saveJson(); showAllPoints(); }
                    return false;
                }
            }
        }
        return false;
    });

    // Touch events - WICHTIG: zoomTarget verwenden!
    function getTouchPosition(e) {
        const rect = zoomTarget.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: (touch.clientX - rect.left) * (canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    c.addEventListener('touchstart', function (e) { e.preventDefault(); if (window.moveModeActive) return;
        const { x, y } = getTouchPosition(e);
        if (cursor_type === "winkel") {
            let clickedAnglePoint = checkAnglePointAtPosition(x, y);
            if (clickedAnglePoint) { selectedAngle = clickedAnglePoint.angle; selectedPoint = clickedAnglePoint.point; selected = selectedAngle; canvas_ready = true; window.isDraggingPoint = true; window.selectedAngleLineIndex = -1; showAllPoints(); }
            else { lineStartPoint = { x: getXPercent(x), y: getYPercent(y) }; isDrawingLine = true; window.selectedAngleLineIndex = -1; }
        } else if (cursor_type === "line") {
            let clickedLinePoint = checkLinePointAtPosition(x, y);
            if (clickedLinePoint) { selectedLine = clickedLinePoint.line; selectedPoint = clickedLinePoint.point; selected = selectedLine; canvas_ready = true; window.isDraggingPoint = true; showAllPoints(); }
            else { lineStartPoint = { x: getXPercent(x), y: getYPercent(y) }; isDrawingLine = true; }
        } else if (cursor_type === "point") {
            let clickedPoint = checkPointAtPosition(x, y);
            if (clickedPoint) { selectedPoint = clickedPoint.point; canvas_ready = true; window.isDraggingPoint = true; showAllPoints(); }
        }
    }, { passive: false });

    c.addEventListener('touchmove', function (e) { e.preventDefault(); if (window.moveModeActive) return;
        const { x, y } = getTouchPosition(e);
        if (isDrawingLine && lineStartPoint) { tempEndPoint = { x: getXPercent(x), y: getYPercent(y) }; showAllPoints(); }
        if (canvas_ready && selectedPoint) { selectedPoint.x = getXPercent(x); selectedPoint.y = getYPercent(y); showAllPoints(); }
    }, { passive: false });

    c.addEventListener('touchend', function (e) { e.preventDefault(); if (window.moveModeActive) return;
        const { x, y } = getTouchPosition(e);
        let lineEndPoint = { x: getXPercent(x), y: getYPercent(y) };

        if (isDrawingLine && lineStartPoint && (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y)) {
            // ========================================
            // NEU: Unterscheide zwischen Linien-Subtypen auch bei Touch
            // ========================================
            if (cursor_type === "line") {
                let nearestLine = null;  // Außerhalb für späteren Zugriff

                // Senkrechte: STARTPUNKT auf nächste Linie projizieren
                if (lineSubtype === "senkrechte") {
                    nearestLine = findNearestLineToPoint({ x: x, y: y });
                    if (nearestLine) {
                        // Projiziere den STARTPUNKT auf die Ziellinie
                        lineEndPoint = projectPointOntoLine(lineStartPoint, nearestLine.start, nearestLine.end);
                    } else {
                        alert("Keine Linie gefunden, auf die senkrecht projiziert werden kann.");
                        isDrawingLine = false;
                        lineStartPoint = null;
                        tempEndPoint = null;
                        return;
                    }
                }

                const newLine = {
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint,
                    end: lineEndPoint,
                    isNew: true,
                    lineSubtype: lineSubtype
                };

                // Bei Senkrechten: Speichere Referenz zur Ziellinie
                if (lineSubtype === "senkrechte" && nearestLine) {
                    newLine.targetLineStart = { x: nearestLine.start.x, y: nearestLine.start.y };
                    newLine.targetLineEnd = { x: nearestLine.end.x, y: nearestLine.end.y };
                }

                points.values.push(newLine);
                saveJson();
                showAllPoints();
            }
            // ========================================
            else if (cursor_type === "winkel") {
                const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true, partOfAngle: true };
                angleLines.push(newLine);
                if (angleLines.length === 2) {
                    const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                    if (intersection) { points.values.push({ name: "Winkel", type: "angle", points: [angleLines[0].start, intersection, angleLines[1].end], angle: calculateAngle(angleLines[0].start, intersection, angleLines[1].end) }); saveJson(); showAllPoints(); }
                    angleLines = [];
                }
            } else {
                const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true };
                points.values.push(newLine);
                saveJson();
                showAllPoints();
            }
        }
        isDrawingLine = false; lineStartPoint = null; tempEndPoint = null;
        if (canvas_ready) { saveJson(); canvas_ready = false; movingAngleLine = false; angleLineIndex = -1; }
        window.isDraggingPoint = false;
    }, { passive: false });

    // ========================================
    // Winkel-Optionen ein-/ausblenden je nach Modus
    // ========================================
    function updateWinkelOptions() {
        const optionsDiv = document.getElementById("winkel_options");
        if (optionsDiv) {
            if (cursor_type === "winkel") {
                optionsDiv.classList.add("visible");
            } else {
                optionsDiv.classList.remove("visible");
            }
        }
    }

    // Toggle-Handler für die Checkbox
    $("body").on("change", "#toggle_angle_checkbox", function () {
        useOuterAngle = $(this).is(":checked");

        // Alle Winkel neu berechnen
        for (let obj of points.values) {
            if (obj.type === 'angle' && obj.points?.length === 3) {
                obj.angle = calculateAngle(obj.points[0], obj.points[1], obj.points[2]);
            }
        }

        showAllPoints();
    });

    // Label klickbar machen
    $("body").on("click", ".toggle_label", function () {
        $("#toggle_angle_checkbox").click();
    });

    // Initial aufrufen
    updateWinkelOptions();
    updateLineModeUI();
});