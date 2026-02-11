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

    function getRelativeMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
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
                    showAllPoints(); // Neu zeichnen mit mm-Werten
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
    // Kalibrierungs-Info aktualisieren (optional, falls Element vorhanden)
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

                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red", true);
                } else {
                    drawLine(start, end, "#18ceff", true);
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
            //drawLine(lineStartPoint, tempEndPoint, "#67ff18", true);
            drawLine(lineStartPoint, tempEndPoint, "#67ff18", cursor_type !== "winkel");
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
                loadCalibrationFromDB(); // Kalibrierung aus DB laden
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
            let clickedLinePoint = checkLinePointAtPosition(mouseX, mouseY);
            if (selectedLine && clickedLinePoint && clickedLinePoint.line === selectedLine) {
                selectedPoint = clickedLinePoint.point; canvas_ready = true;
                window.isDraggingPoint = true; showAllPoints(); return;
            }
            if (selectedLine && isPointOnLine(mouseX, mouseY, selectedLine)) {
                canvas_ready = true; moveOffset = { x: mouseX, y: mouseY }; showAllPoints(); return;
            }
            if (selectedLine) { selectedPoint = null; selectedLine = null; selected = null; showAllPoints(); return; }
            if (clickedLinePoint) {
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
        } else if (canvas_ready && selectedPoint) {
            selectedPoint.x = getXPercent(mouseX); selectedPoint.y = getYPercent(mouseY);
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
        const lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

        if (isDrawingLine && lineStartPoint) {
            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                if (replacingAngleLine && angleToReplace && lineIndexToReplace !== -1) {
                    // Handle replacing angle line
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
                    const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true };
                    if (cursor_type === "winkel") {
                        newLine.partOfAngle = true; angleLines.push(newLine);
                        if (angleLines.length === 2) {
                            const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                            if (intersection) {
                                const angle = calculateAngle(angleLines[0].start, intersection, angleLines[1].end);
                                points.values.push({ name: "Winkel", type: "angle", points: [angleLines[0].start, intersection, angleLines[1].end], angle: angle });
                                saveJson(); showAllPoints();
                            }
                            angleLines = [];
                        }
                    } else { points.values.push(newLine); saveJson(); showAllPoints(); }
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
                const midX = (getXAbsolute(start.x) + getXAbsolute(end.x)) / 2;
                const midY = (getYAbsolute(start.y) + getYAbsolute(end.y)) / 2;
                const text = lengthMM.toFixed(2) + " mm";
                ctx.font = "bold 12px Arial";
                const textWidth = ctx.measureText(text).width;
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(midX + 3, midY - 14, textWidth + 6, 16);
                ctx.fillStyle = "#fff";
                ctx.fillText(text, midX + 6, midY - 2);
            }
        }
    }

    function drawAngle(pts, color) {
        for (let i = 0; i < pts.length - 1; i++) drawLine(pts[i], pts[i + 1], color, false);
        const angle = calculateAngle(pts[0], pts[1], pts[2]);
        displayAngle(angle, pts[1], color);
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

    function displayAngle(angle, point, color) {
        let absX = getXAbsolute(point.x); let absY = getYAbsolute(point.y);
        let textX = Math.max(5, Math.min(canvas.width - 30, absX + 10));
        let textY = Math.max(15, Math.min(canvas.height - 5, absY - 10));
        ctx.fillStyle = color || "#67ff18"; ctx.font = "14px Arial";
        ctx.fillText(angle.toFixed(2) + "°", textX, textY);
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

    $("body").on("click", ".auswahl_tab", function (e) {
        $('#zoomTarget').css("cursor", "default");
        window.moveModeActive = false; $('#move_mode3').removeClass("active");
        cursor_type = $(e.target).attr("data-id");
        $(".auswahl_tab").removeClass("active"); $(e.target).addClass("active");
        selectedPoint = null; selectedLine = null; selectedAngle = null; selected = null; canvas_ready = false;
        replacingAngleLine = false; angleToReplace = null; lineIndexToReplace = -1; window.selectedAngleLineIndex = -1;
        if (cursor_type !== "winkel") angleLines = [];
        showAllPoints();
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

    // Touch events (simplified)
    function getTouchPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
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
        const lineEndPoint = { x: getXPercent(x), y: getYPercent(y) };
        if (isDrawingLine && lineStartPoint && (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y)) {
            const newLine = { name: 'Linie', type: 'line', start: lineStartPoint, end: lineEndPoint, isNew: true };
            if (cursor_type === "winkel") {
                newLine.partOfAngle = true; angleLines.push(newLine);
                if (angleLines.length === 2) {
                    const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                    if (intersection) { points.values.push({ name: "Winkel", type: "angle", points: [angleLines[0].start, intersection, angleLines[1].end], angle: calculateAngle(angleLines[0].start, intersection, angleLines[1].end) }); saveJson(); showAllPoints(); }
                    angleLines = [];
                }
            } else { points.values.push(newLine); saveJson(); showAllPoints(); }
        }
        isDrawingLine = false; lineStartPoint = null; tempEndPoint = null;
        if (canvas_ready) { saveJson(); canvas_ready = false; movingAngleLine = false; angleLineIndex = -1; }
        window.isDraggingPoint = false;
    }, { passive: false });

    $("body").on("click", "#toggle_angle_mode", function (e) {
        const $btn = $(this);
        useOuterAngle = !useOuterAngle;

        if (useOuterAngle) {
            $btn.addClass("clicked");
            $btn.html('<i class="fa fa-rotate-right"></i> 360°−α');
        } else {
            $btn.removeClass("clicked");
            $btn.html('<i class="fa fa-rotate-left"></i> α');
        }

        // Alle Winkel neu berechnen und anzeigen
        for (let obj of points.values) {
            if (obj.type === 'angle' && obj.points?.length === 3) {
                obj.angle = calculateAngle(obj.points[0], obj.points[1], obj.points[2]);
            }
        }

        showAllPoints();
    });
});