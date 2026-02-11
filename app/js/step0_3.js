$(document).ready(function () {
    const filename3 = window.location.hash.substring(1).split("-")[1];
    const img3 = document.getElementById("linien_img3");
    const canvas3 = document.getElementById("lines3");
    const ctx3 = canvas3.getContext("2d");
    const zoomTarget3 = document.getElementById("zoom_target3");
    const container3 = document.querySelector(".lines_container3");

    const targetElement = zoomTarget3 || canvas3;

    let points3 = { values: [] };
    const linePointSize3 = 1.5;
    const lineWidth3 = 1;
    var selectedAngle3 = null;
    var selectedAnglePoint3 = null;
    var lineStartPoint3 = null;
    var isDrawingLine3 = false;
    var tempEndPoint3 = null;
    var angleLines3 = [];
    let canvas_ready3 = false;
    let canvasInitialized = false;

    let movingWholeAngle3 = false;
    let angleMovementOffset3 = { x: 0, y: 0};

    // Für 3-Punkt Winkel
    let angleCreationPoints = [];
    const MAX_ANGLE_POINTS = 3;

    // Für Unterscheidung zwischen Klick und Drag
    let pointerDownPos = null;
    let hasMoved = false;
    const DRAG_THRESHOLD = 5; // Pixel

    let zoomLevel3 = 1;
    const zoomStep3 = 0.2;
    const maxZoom3 = 3;
    let minZoom3 = 1;
    let offsetX3 = 0;
    let offsetY3 = 0;
    let isDragging3 = false;
    let startX3 = 0;
    let startY3 = 0;
    let moveModeActive3 = false;

    // Touch-Tracking
    let isTouchActive3 = false;
    let touchStartTime3 = 0;
    let lastTouchDistance3 = null;
    let lastTouchCenter3 = null;

    img3.onload = function() {
        initCanvas();
        loadPoints3();
    };

    if (img3.complete) {
        initCanvas();
        loadPoints3();
    }

    function initCanvas() {
        canvas3.width = img3.naturalWidth;
        canvas3.height = img3.naturalHeight;

        if (container3) {
            const containerWidth3 = container3.clientWidth;
            const containerHeight3 = container3.clientHeight;
            const widthRatio3 = containerWidth3 / img3.naturalWidth;
            const heightRatio3 = containerHeight3 / img3.naturalHeight;
            minZoom3 = Math.min(widthRatio3, heightRatio3);
        }

        zoomLevel3 = 1;
        offsetX3 = 0;
        offsetY3 = 0;

        console.log("Profil Canvas initialisiert:", canvas3.width, canvas3.height);
        canvasInitialized = true;

        if (targetElement) {
            $(targetElement).css("cursor", "default");
        }

        if (zoomTarget3) {
            clampOffsets3();
            applyTransform3();
        }
    }

    function applyTransform3() {
        if (zoomTarget3) {
            zoomTarget3.style.transform = `translate(${offsetX3}px, ${offsetY3}px) scale(${zoomLevel3})`;
        }
        showAllPoints3();
    }

    function clampOffsets3() {
        if (!container3) return;

        const containerWidth3 = container3.clientWidth;
        const containerHeight3 = container3.clientHeight;
        const contentWidth3 = containerWidth3 * zoomLevel3;
        const contentHeight3 = containerHeight3 * zoomLevel3;

        const maxOffsetX3 = 0;
        const maxOffsetY3 = 0;
        const minOffsetX3 = containerWidth3 - contentWidth3;
        const minOffsetY3 = containerHeight3 - contentHeight3;

        offsetX3 = Math.min(maxOffsetX3, Math.max(minOffsetX3, offsetX3));
        offsetY3 = Math.min(maxOffsetY3, Math.max(minOffsetY3, offsetY3));
    }

    function getCanvasCoordinates(e) {
        const rect = canvas3.getBoundingClientRect();

        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const scaleX = canvas3.width / rect.width;
        const scaleY = canvas3.height / rect.height;

        const canvasX = mouseX * scaleX;
        const canvasY = mouseY * scaleY;

        return { x: canvasX, y: canvasY };
    }

    function loadPoints3() {
        $.ajax({
            async: false,
            cache: false,
            url: "profil.json",
            dataType: "json",
            success: function (data3) {
                points3 = data3;
                console.log("Student Profil Punkte geladen:", points3);
                showAllPoints3();
            },
            error: function(xhr, status, error) {
                console.error("Fehler beim Laden der Profil-Punkte:", error);
            }
        });
    }

    function pointsMatch(p1, p2) {
        return Math.abs(p1.x - p2.x) < 0.0001 && Math.abs(p1.y - p2.y) < 0.0001;
    }

    function showAllPoints3() {
        ctx3.clearRect(0, 0, canvas3.width, canvas3.height);

        let point_arr = points3.values;

        // Nur Winkel zeichnen
        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'angle') {
                if (selectedAngle3 && selectedAngle3 === objp) {
                    drawAngle(objp.points, "red");
                } else {
                    drawAngle(objp.points, "#18ceff");
                }
            }
        }

        // Temporäre Linien beim Zeichnen
        if (isDrawingLine3 && lineStartPoint3 && tempEndPoint3) {
            drawLine(lineStartPoint3, tempEndPoint3, "#18ceff");
        }

        // Temporäre Linien für Winkel-Erstellung (2 Linien)
        if (angleLines3.length > 0) {
            for (let line of angleLines3) {
                drawLine(line.start, line.end, "#18ceff");
            }
        }

        // Temporäre Punkte für 3-Punkt Winkel-Erstellung
        if (angleCreationPoints.length > 0) {
            drawTemporaryAnglePoints();
        }

        updateDeleteButton();
    }

    // Zeichne temporäre Punkte während der 3-Punkt Winkel-Erstellung
    function drawTemporaryAnglePoints() {
        ctx3.fillStyle = "#ffaa00"; // Orange für temporäre Punkte

        for (let i = 0; i < angleCreationPoints.length; i++) {
            const point = angleCreationPoints[i];
            const absX = getXAbsolute3(point.x);
            const absY = getYAbsolute3(point.y);

            // Zeichne Punkt
            ctx3.beginPath();
            ctx3.arc(absX, absY, linePointSize3 * 3, 0, Math.PI * 2, true);
            ctx3.fill();
            ctx3.closePath();

            // Zeichne Nummer
            ctx3.font = "14px Arial";
            ctx3.fillText((i + 1).toString(), absX + 10, absY - 10);
        }

        // Wenn 2 Punkte gesetzt sind, zeichne Vorschau-Linien
        if (angleCreationPoints.length === 2) {
            drawLine(angleCreationPoints[0], angleCreationPoints[1], "#ffaa00");
        }

        // Wenn alle 3 Punkte gesetzt sind, zeichne kompletten Winkel als Vorschau
        if (angleCreationPoints.length === 3) {
            drawLine(angleCreationPoints[0], angleCreationPoints[1], "#ffaa00");
            drawLine(angleCreationPoints[1], angleCreationPoints[2], "#ffaa00");

            const angle = calculateAngle(
                angleCreationPoints[0],
                angleCreationPoints[1],
                angleCreationPoints[2]
            );
            displayAngle(angle, angleCreationPoints[1], "#ffaa00");
        }
    }

    function updateDeleteButton() {
        const deleteBtn = document.getElementById("delete-btn-profil");

        if (selectedAngle3) {
            if (deleteBtn) {
                $(deleteBtn).addClass("active");
            }
        } else {
            if (deleteBtn) {
                $(deleteBtn).removeClass("active");
            }
        }
    }

    function isPointOnLine(mouseX, mouseY, line) {
        const startAbs = {
            x: getXAbsolute3(line.start.x),
            y: getYAbsolute3(line.start.y)
        };
        const endAbs = {
            x: getXAbsolute3(line.end.x),
            y: getYAbsolute3(line.end.y)
        };

        const threshold = ('ontouchstart' in window) ? 10 : 5;

        const lineLength = Math.sqrt(
            Math.pow(endAbs.x - startAbs.x, 2) +
            Math.pow(endAbs.y - startAbs.y, 2)
        );

        const distToStart = Math.sqrt(
            Math.pow(mouseX - startAbs.x, 2) +
            Math.pow(mouseY - startAbs.y, 2)
        );

        const distToEnd = Math.sqrt(
            Math.pow(mouseX - endAbs.x, 2) +
            Math.pow(mouseY - endAbs.y, 2)
        );

        const distToLine = Math.abs(
            (endAbs.y - startAbs.y) * mouseX -
            (endAbs.x - startAbs.x) * mouseY +
            endAbs.x * startAbs.y -
            endAbs.y * startAbs.x
        ) / lineLength;

        const isOnSegment = Math.abs(distToStart + distToEnd - lineLength) < threshold;

        return distToLine < threshold && isOnSegment;
    }

    // ====================================================================
    // TOUCH EVENTS FÜR IPAD/APPLE PENCIL
    // ====================================================================

    targetElement.addEventListener('touchstart', function (e) {
        if (!canvasInitialized) return;

        isTouchActive3 = true;
        touchStartTime3 = Date.now();

        // Multi-Touch für Zoom/Pan
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance3 = Math.sqrt(dx * dx + dy * dy);
            lastTouchCenter3 = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            return;
        }

        // Single Touch
        if (e.touches.length === 1) {
            e.preventDefault();

            const coords = getCanvasCoordinates(e);
            const mouseX = coords.x;
            const mouseY = coords.y;

            if (moveModeActive3) {
                const touch = e.touches[0];
                isDragging3 = true;
                startX3 = touch.clientX;
                startY3 = touch.clientY;
                return;
            }

            handlePointerDown(mouseX, mouseY);
        }
    }, { passive: false });

    targetElement.addEventListener('touchmove', function (e) {
        if (!canvasInitialized) return;

        e.preventDefault();

        // Multi-Touch Zoom
        if (e.touches.length === 2 && lastTouchDistance3 !== null) {
            handlePinchZoom3(e);
            return;
        }

        // Single Touch
        if (e.touches.length === 1) {
            const touch = e.touches[0];

            if (isDragging3 && moveModeActive3) {
                const dx = touch.clientX - startX3;
                const dy = touch.clientY - startY3;
                offsetX3 += dx;
                offsetY3 += dy;
                startX3 = touch.clientX;
                startY3 = touch.clientY;
                clampOffsets3();
                applyTransform3();
                return;
            }

            const coords = getCanvasCoordinates(e);
            handlePointerMove(coords.x, coords.y);
        }
    }, { passive: false });

    targetElement.addEventListener('touchend', function (e) {
        if (!canvasInitialized) return;

        if (e.touches.length === 0) {
            const coords = e.changedTouches && e.changedTouches[0] ? getCanvasCoordinates(e.changedTouches[0]) : null;

            if (coords) {
                handlePointerUp(coords.x, coords.y);
            }

            // Reset Touch-Variablen
            isTouchActive3 = false;
            isDragging3 = false;
            lastTouchDistance3 = null;
            lastTouchCenter3 = null;
            startX3 = 0;
            startY3 = 0;
        }
    }, { passive: false });

    function handlePinchZoom3(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);

        const zoomFactor = newDistance / lastTouchDistance3;

        let newZoomLevel = zoomLevel3 * zoomFactor;
        newZoomLevel = Math.max(minZoom3, Math.min(maxZoom3, newZoomLevel));

        if (!container3) return;

        const zoomRect = container3.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - zoomRect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - zoomRect.top;

        const relX = (centerX - offsetX3) / zoomLevel3;
        const relY = (centerY - offsetY3) / zoomLevel3;

        zoomLevel3 = newZoomLevel;

        offsetX3 = centerX - relX * zoomLevel3;
        offsetY3 = centerY - relY * zoomLevel3;

        clampOffsets3();
        applyTransform3();

        lastTouchDistance3 = newDistance;
    }

    // ====================================================================
    // MOUSE EVENTS (mit Touch-Schutz)
    // ====================================================================

    targetElement.addEventListener('mousedown', function (e) {
        if (!canvasInitialized || isTouchActive3) return;

        e.preventDefault();

        const coords = getCanvasCoordinates(e);
        const mouseX = coords.x;
        const mouseY = coords.y;

        if (moveModeActive3) {
            isDragging3 = true;
            startX3 = e.clientX;
            startY3 = e.clientY;
            $(targetElement).css("cursor", "grabbing");
            return;
        }

        // Speichere Start-Position für Drag-Erkennung
        pointerDownPos = { x: mouseX, y: mouseY };
        hasMoved = false;

        handlePointerDown(mouseX, mouseY);
    });

    document.addEventListener('mousemove', function (e) {
        if (!canvasInitialized || isTouchActive3) return;

        if (isDragging3 && moveModeActive3) {
            const dx = e.clientX - startX3;
            const dy = e.clientY - startY3;
            offsetX3 += dx;
            offsetY3 += dy;
            startX3 = e.clientX;
            startY3 = e.clientY;
            clampOffsets3();
            applyTransform3();
            return;
        }

        const coords = getCanvasCoordinates(e);

        // Prüfe ob Bewegung stattgefunden hat
        if (pointerDownPos) {
            const distance = Math.sqrt(
                Math.pow(coords.x - pointerDownPos.x, 2) +
                Math.pow(coords.y - pointerDownPos.y, 2)
            );
            if (distance > DRAG_THRESHOLD) {
                hasMoved = true;
            }
        }

        handlePointerMove(coords.x, coords.y);
    });

    document.addEventListener('mouseup', function (e) {
        if (!canvasInitialized || isTouchActive3) return;

        isDragging3 = false;

        if (moveModeActive3) {
            $(targetElement).css("cursor", "grab");
        } else {
            $(targetElement).css("cursor", "default");
        }

        const coords = getCanvasCoordinates(e);
        handlePointerUp(coords.x, coords.y);

        setTimeout(() => {
            isTouchActive3 = false;
        }, 100);
    });

    // ====================================================================
    // UNIFIED POINTER HANDLERS
    // ====================================================================

    function handlePointerDown(mouseX, mouseY) {
        // Bestehende Logik für Winkel-Bearbeitung
        if (selectedAngle3) {
            let clickedAnglePoint = checkAnglePointAtPosition(mouseX, mouseY);
            if (clickedAnglePoint && clickedAnglePoint.angle === selectedAngle3) {
                selectedAnglePoint3 = clickedAnglePoint.point;
                canvas_ready3 = true;
                movingWholeAngle3 = false;
                showAllPoints3();
                return;
            }

            if (isClickOnAngleLine(mouseX, mouseY, selectedAngle3)) {
                selectedAnglePoint3 = null;
                canvas_ready3 = true;
                movingWholeAngle3 = true;
                angleMovementOffset3 = { x: mouseX, y: mouseY };
                showAllPoints3();
                return;
            }

            selectedAngle3 = null;
            selectedAnglePoint3 = null;
            movingWholeAngle3 = false;
            showAllPoints3();
        }

        if (!selectedAngle3) {
            let clickedAnglePoint = checkAnglePointAtPosition(mouseX, mouseY);

            if (clickedAnglePoint) {
                selectedAngle3 = clickedAnglePoint.angle;
                selectedAnglePoint3 = clickedAnglePoint.point;
                canvas_ready3 = true;
                showAllPoints3();
            } else {
                // Starte Linie (wird in handlePointerUp entschieden ob Klick oder Drag)
                lineStartPoint3 = { x: getXPercent3(mouseX), y: getYPercent3(mouseY) };
                isDrawingLine3 = true;
            }
        }
    }

    function handlePointerMove(mouseX, mouseY) {
        // Temporäre Linie während des Zeichnens (nur bei Drag)
        if (isDrawingLine3 && lineStartPoint3 && hasMoved) {
            tempEndPoint3 = { x: getXPercent3(mouseX), y: getYPercent3(mouseY) };
            showAllPoints3();
        }

        // Winkel verschieben
        if (canvas_ready3 && selectedAngle3 && movingWholeAngle3) {
            const deltaX = mouseX - angleMovementOffset3.x;
            const deltaY = mouseY - angleMovementOffset3.y;

            const deltaXPercent = getXPercent3(deltaX);
            const deltaYPercent = getYPercent3(deltaY);

            for (let i = 0; i < selectedAngle3.points.length; i++) {
                selectedAngle3.points[i].x += deltaXPercent;
                selectedAngle3.points[i].y += deltaYPercent;
            }

            angleMovementOffset3.x = mouseX;
            angleMovementOffset3.y = mouseY;

            showAllPoints3();
        } else if (canvas_ready3 && selectedAngle3 && selectedAnglePoint3) {
            selectedAnglePoint3.x = getXPercent3(mouseX);
            selectedAnglePoint3.y = getYPercent3(mouseY);

            const index = selectedAngle3.points.indexOf(selectedAnglePoint3);
            if (index !== -1) {
                selectedAngle3.points[index] = selectedAnglePoint3;
            }

            showAllPoints3();
        }
    }

    function handlePointerUp(mouseX, mouseY) {
        if (isDrawingLine3 && lineStartPoint3) {
            let lineEndPoint = { x: getXPercent3(mouseX), y: getYPercent3(mouseY) };

            // UNTERSCHEIDUNG: War es ein Drag (Linie) oder ein Klick (Punkt)?
            if (hasMoved) {
                // DRAG → Linie zeichnen für Winkel (Original-Methode)
                console.log("Linie beendet:", lineStartPoint3, "->", lineEndPoint);

                const newLine = {
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint3,
                    end: lineEndPoint,
                    partOfAngle: true
                };

                angleLines3.push(newLine);
                console.log("Winkel-Linien:", angleLines3.length);

                // Wenn 2 Linien vorhanden, erstelle Winkel
                if (angleLines3.length === 2) {
                    const intersection = getLineIntersection(angleLines3[0], angleLines3[1]);

                    if (intersection) {
                        // Bestimme die richtige Reihenfolge der Punkte basierend auf der Zeichenrichtung
                        // Linie 1: von start zu end
                        // Linie 2: von start zu end
                        // Schnittpunkt sollte in der Mitte sein

                        const line1Start = angleLines3[0].start;
                        const line1End = angleLines3[0].end;
                        const line2Start = angleLines3[1].start;
                        const line2End = angleLines3[1].end;

                        // Finde heraus, welche Endpunkte am weitesten vom Schnittpunkt entfernt sind
                        // Diese sollten die äußeren Punkte des Winkels sein
                        const distLine1Start = calculateDistanceBetweenPoints(line1Start, intersection);
                        const distLine1End = calculateDistanceBetweenPoints(line1End, intersection);
                        const distLine2Start = calculateDistanceBetweenPoints(line2Start, intersection);
                        const distLine2End = calculateDistanceBetweenPoints(line2End, intersection);

                        // Wähle die Endpunkte, die am weitesten vom Schnittpunkt entfernt sind
                        const point1 = (distLine1Start > distLine1End) ? line1Start : line1End;
                        const point3 = (distLine2Start > distLine2End) ? line2Start : line2End;

                        const angle = calculateAngle(point1, intersection, point3);

                        const newAngle = {
                            name: "Winkel",
                            type: "angle",
                            points: [point1, intersection, point3],
                            angle: angle
                        };

                        points3.values.push(newAngle);
                        saveJson3();
                        angleLines3 = [];
                        console.log("Winkel aus 2 Linien erstellt!");
                    } else {
                        alert("Die Linien schneiden sich nicht!");
                        angleLines3 = [];
                    }
                }
            } else {
                // KLICK → Punkt setzen für 3-Punkt Winkel
                const newPoint = {
                    x: getXPercent3(mouseX),
                    y: getYPercent3(mouseY)
                };
                angleCreationPoints.push(newPoint);

                console.log(`Punkt ${angleCreationPoints.length} gesetzt:`, newPoint);

                // Wenn 3 Punkte gesetzt sind, erstelle Winkel
                if (angleCreationPoints.length === MAX_ANGLE_POINTS) {
                    createAngleFromPoints();
                }
            }

            showAllPoints3();

            isDrawingLine3 = false;
            lineStartPoint3 = null;
            tempEndPoint3 = null;
            pointerDownPos = null;
            hasMoved = false;
        }

        if (canvas_ready3 && (movingWholeAngle3 || selectedAnglePoint3)) {
            saveJson3();
            canvas_ready3 = false;
            movingWholeAngle3 = false;
            selectedAnglePoint3 = null;
        }

        // Reset
        pointerDownPos = null;
        hasMoved = false;
    }

    // Erstelle Winkel aus den 3 gesammelten Punkten
    function createAngleFromPoints() {
        if (angleCreationPoints.length !== 3) return;

        const angle = calculateAngle(
            angleCreationPoints[0],
            angleCreationPoints[1],
            angleCreationPoints[2]
        );

        const newAngle = {
            name: "Winkel",
            type: "angle",
            points: [
                angleCreationPoints[0],
                angleCreationPoints[1],
                angleCreationPoints[2]
            ],
            angle: angle
        };

        points3.values.push(newAngle);
        saveJson3();

        console.log("3-Punkt Winkel erstellt:", angle.toFixed(2) + "°");

        // Reset für nächsten Winkel
        angleCreationPoints = [];
    }

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================

    function checkAnglePointAtPosition(mouseX, mouseY) {
        let point_arr = points3.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'angle' && obj.points?.length === 3) {
                for (let j = 0; j < obj.points.length; j++) {
                    let anglePoint = obj.points[j];
                    let absX = getXAbsolute3(anglePoint.x);
                    let absY = getYAbsolute3(anglePoint.y);

                    if (isPointNear3(mouseX, mouseY, { x: absX, y: absY })) {
                        return { angle: obj, point: anglePoint, pointIndex: j };
                    }
                }
            }
        }
        return null;
    }

    function isClickOnAngleLine(mouseX, mouseY, angle) {
        if (!angle.points || angle.points.length !== 3) return false;

        const line1 = {
            start: angle.points[0],
            end: angle.points[1]
        };

        const line2 = {
            start: angle.points[1],
            end: angle.points[2]
        };

        const onLine1 = isPointOnLineExcludingEndpoints(mouseX, mouseY, line1);
        const onLine2 = isPointOnLineExcludingEndpoints(mouseX, mouseY, line2);

        return onLine1 || onLine2;
    }

    function isPointOnLineExcludingEndpoints(mouseX, mouseY, line) {
        const startAbs = {
            x: getXAbsolute3(line.start.x),
            y: getYAbsolute3(line.start.y)
        };
        const endAbs = {
            x: getXAbsolute3(line.end.x),
            y: getYAbsolute3(line.end.y)
        };

        if (isPointNear3(mouseX, mouseY, startAbs) || isPointNear3(mouseX, mouseY, endAbs)) {
            return false;
        }

        return isPointOnLine(mouseX, mouseY, line);
    }

    function getLineIntersection(l1, l2) {
        let x1 = getXAbsolute3(l1.start.x), y1 = getYAbsolute3(l1.start.y);
        let x2 = getXAbsolute3(l1.end.x), y2 = getYAbsolute3(l1.end.y);
        let x3 = getXAbsolute3(l2.start.x), y3 = getYAbsolute3(l2.start.y);
        let x4 = getXAbsolute3(l2.end.x), y4 = getYAbsolute3(l2.end.y);

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return null;

        const px = ((x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4)) / denom;
        const py = ((x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4)) / denom;

        return {
            x: getXPercent3(px),
            y: getYPercent3(py)
        };
    }

    function calculateDistanceBetweenPoints(p1, p2) {
        const x1 = getXAbsolute3(p1.x);
        const y1 = getYAbsolute3(p1.y);
        const x2 = getXAbsolute3(p2.x);
        const y2 = getYAbsolute3(p2.y);

        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // ====================================================================
    // BUTTON: ABBRECHEN
    // ====================================================================

    if (document.getElementById("cancel-btn")) {
        document.getElementById("cancel-btn").addEventListener("click", function() {
            if (angleCreationPoints.length > 0) {
                console.log("3-Punkt Winkel-Erstellung abgebrochen");
                angleCreationPoints = [];
                showAllPoints3();
            }
            if (angleLines3.length > 0) {
                console.log("Linien-Winkel-Erstellung abgebrochen");
                angleLines3 = [];
                showAllPoints3();
            }
        });
    }

    // ====================================================================
    // ZOOM CONTROLS
    // ====================================================================

    if (document.getElementById("zoom_in3")) {
        document.getElementById("zoom_in3").addEventListener("click", () => {
            zoomAtCenter3(true);
        });
    }

    if (document.getElementById("zoom_out3")) {
        document.getElementById("zoom_out3").addEventListener("click", () => {
            zoomAtCenter3(false);
        });
    }

    if (document.getElementById("reset_zoom3")) {
        document.getElementById("reset_zoom3").addEventListener("click", () => {
            zoomLevel3 = 1;
            offsetX3 = 0;
            offsetY3 = 0;
            clampOffsets3();
            applyTransform3();
        });
    }

    if (document.getElementById("move_mode3")) {
        document.getElementById("move_mode3").addEventListener("click", function () {
            moveModeActive3 = !moveModeActive3;
            $(this).toggleClass("active");

            if (moveModeActive3) {
                $(targetElement).css("cursor", "grab");
            } else {
                $(targetElement).css("cursor", "default");
            }
        });
    }

    function zoomAtCenter3(zoomIn = true) {
        if (!container3) return;

        const containerRect = container3.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        const relX = (centerX - offsetX3) / zoomLevel3;
        const relY = (centerY - offsetY3) / zoomLevel3;

        let newZoomLevel = zoomIn
            ? Math.min(maxZoom3, zoomLevel3 + zoomStep3)
            : Math.max(minZoom3, zoomLevel3 - zoomStep3);

        if (newZoomLevel === zoomLevel3) return;

        zoomLevel3 = newZoomLevel;
        offsetX3 = centerX - relX * zoomLevel3;
        offsetY3 = centerY - relY * zoomLevel3;

        clampOffsets3();
        applyTransform3();
    }

    // ====================================================================
    // DRAWING FUNCTIONS
    // ====================================================================

    function drawLine(start, end, color) {
        ctx3.beginPath();
        ctx3.moveTo(getXAbsolute3(start.x), getYAbsolute3(start.y));
        ctx3.lineTo(getXAbsolute3(end.x), getYAbsolute3(end.y));
        ctx3.strokeStyle = color;
        ctx3.lineWidth = lineWidth3;
        ctx3.stroke();

        ctx3.fillStyle = color;
        ctx3.beginPath();
        ctx3.arc(getXAbsolute3(start.x), getYAbsolute3(start.y), linePointSize3, 0, Math.PI * 2, true);
        ctx3.fill();
        ctx3.closePath();

        ctx3.beginPath();
        ctx3.arc(getXAbsolute3(end.x), getYAbsolute3(end.y), linePointSize3, 0, Math.PI * 2, true);
        ctx3.fill();
        ctx3.closePath();
    }

    function drawAngle(points, color) {
        for (let i = 0; i < points.length - 1; i++) {
            drawLine(points[i], points[i + 1], color);
        }

        const angle = calculateAngle(points[0], points[1], points[2]);
        displayAngle(angle, points[1], color);
    }

    function calculateAngle(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

        const dotProduct = v1.x * v2.x + v1.y * v2.y;
        const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
        const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

        const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
        return (angleRad * 180) / Math.PI;
    }

    function displayAngle(angle, point, color) {
        const absX = getXAbsolute3(point.x);
        const absY = getYAbsolute3(point.y);

        ctx3.fillStyle = color || "#18ceff";
        ctx3.font = "14px Arial";
        ctx3.fillText(angle.toFixed(2) + "°", absX + 10, absY - 10);
    }

    function isPointNear3(x3, y3, point3) {
        const distance3 = Math.sqrt((x3 - point3.x) ** 2 + (y3 - point3.y) ** 2);
        const tolerance = ('ontouchstart' in window) ? 25 : 10;
        return distance3 < tolerance;
    }

    function getXPercent3(x3) {
        return (x3 / canvas3.width) * 100;
    }

    function getYPercent3(y3) {
        return (y3 / canvas3.height) * 100;
    }

    function getXAbsolute3(xpercent3) {
        return (canvas3.width * xpercent3) / 100;
    }

    function getYAbsolute3(ypercent3) {
        return (canvas3.height * ypercent3) / 100;
    }

    function saveJson3() {
        console.log("Speichere Student Profil mit Canvas-Größe:", canvas3.width, canvas3.height);
        $.ajax({
            type: "POST",
            url: "writeprofilResult.php",
            data: {
                json: JSON.stringify(points3),
                filename: JSON.stringify(filename3)
            },
            success: function () {
                console.log("Student Profil Daten gespeichert!");
                showAllPoints3();
            }
        });
    }

    // ====================================================================
    // DELETE FUNCTIONALITY
    // ====================================================================

    if (document.getElementById("delete-btn-profil")) {
        document.getElementById("delete-btn-profil").addEventListener("click", function() {
            if (selectedAngle3) {
                deleteAngle(selectedAngle3);
                selectedAngle3 = null;
                selectedAnglePoint3 = null;
                showAllPoints3();
            }
        });
    }

    function deleteAngle(angleToDelete) {
        console.log("Lösche Winkel:", angleToDelete);

        const anglePoints = angleToDelete.points;

        points3.values = points3.values.filter(point => point !== angleToDelete);

        points3.values = points3.values.filter(point => {
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

        saveJson3();
    }
});