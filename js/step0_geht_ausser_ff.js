$(document).ready(function () {
    const filename = window.location.hash.substring(1).split("-")[1];
    const img = document.getElementById("linien_img1");
    const canvas = document.getElementById("lines1");
    const ctx = canvas.getContext("2d");
    const zoomTarget = document.getElementById("zoom_target1");
    const container = document.querySelector(".lines_container");
    $(zoomTarget).css("cursor", "default"); // Pfeil-Cursor

    let pointModeActive = true; // Standardmäßig aktiv
    let moveModeActive = false;

    let zoomLevel = 1;
    const zoomStep = 0.2;
    const maxZoom = 3;
    let minZoom = 1;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    let points = { values: [] };
    const pointSize = 4;
    let selectedPoint = null;
    let canvas_ready = false;

    // Neue Variable für Touch-Tracking
    let isTouchActive = false;
    let touchStartTime = 0;

    // Touch-Variablen für Pinch-Zoom
    let lastTouchDistance = null;
    let lastTouchCenter = null;

    img.onload = function () {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const widthRatio = containerWidth / img.naturalWidth;
        const heightRatio = containerHeight / img.naturalHeight;

        minZoom = Math.min(widthRatio, heightRatio);
        zoomLevel = 1;
        offsetX = 0;
        offsetY = 0;

        clampOffsets();
        applyTransform();
        showAllPoints();
    };

    // 🔍 Zoom und Pan
    function applyTransform() {
        zoomTarget.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
    }

    function clampOffsets() {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const contentWidth = containerWidth * zoomLevel;
        const contentHeight = containerHeight * zoomLevel;

        const maxOffsetX = 0;
        const maxOffsetY = 0;

        const minOffsetX = containerWidth - contentWidth;
        const minOffsetY = containerHeight - contentHeight;

        offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, offsetX));
        offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, offsetY));
    }

    document.getElementById("zoom_in").addEventListener("click", () => {
        zoomAtCenter(true);
    });

    document.getElementById("zoom_out").addEventListener("click", () => {
        zoomAtCenter(false);
    });

    document.getElementById("reset_zoom").addEventListener("click", () => {
        zoomLevel = 1;
        offsetX = 0;
        offsetY = 0;
        clampOffsets();
        applyTransform();
    });

    // ====================================================================
    // KORRIGIERTE KOORDINATENBERECHNUNG
    // ====================================================================

    /**
     * Berechnet die Canvas-Koordinaten aus Client-Koordinaten (Maus oder Touch)
     * Berücksichtigt Zoom und Pan korrekt
     */
    function getCanvasCoordinates(clientX, clientY) {
        const containerRect = container.getBoundingClientRect();

        // Position relativ zum Container
        const mouseXInContainer = clientX - containerRect.left;
        const mouseYInContainer = clientY - containerRect.top;

        // Transform rückrechnen: erst Offset abziehen, dann durch Zoom teilen
        const canvasX = (mouseXInContainer - offsetX) / zoomLevel;
        const canvasY = (mouseYInContainer - offsetY) / zoomLevel;

        // Auf Canvas-Koordinaten skalieren
        const scaleX = canvas.width / container.clientWidth;
        const scaleY = canvas.height / container.clientHeight;

        return {
            x: canvasX * scaleX,
            y: canvasY * scaleY
        };
    }

    // ====================================================================
    // VERBESSERTE TOUCH-EVENTS FÜR APPLE PENCIL
    // ====================================================================

    zoomTarget.addEventListener('touchstart', function (e) {
        isTouchActive = true;
        touchStartTime = Date.now();

        // Multi-Touch für Zoom/Pan
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            lastTouchCenter = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            return;
        }

        // Single Touch (Apple Pencil oder Finger)
        if (e.touches.length === 1 && !moveModeActive) {
            e.preventDefault(); // Verhindert ungewolltes Scrollen

            const touch = e.touches[0];
            const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

            selectedPoint = null;
            const point_arr = points.values;

            // Prüfe ob ein existierender Punkt getroffen wurde
            for (let i = point_arr.length - 1; i >= 0; i--) {
                let obj = point_arr[i];
                let absX = getXAbsolute(obj.x);
                let absY = getYAbsolute(obj.y);

                if (isPointNear(coords.x, coords.y, { x: absX, y: absY })) {
                    selectedPoint = obj;
                    canvas_ready = true;
                    console.log("Punkt ausgewählt:", obj.name);
                    updateDeleteButton();
                    return;
                }
            }

            // Kein Punkt getroffen -> neuen Punkt setzen
            if (pointModeActive || !moveModeActive) {
                addNewPoint(coords.x, coords.y);
            }
        } else if (e.touches.length === 1 && moveModeActive) {
            // Move Mode initialisieren
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            isDragging = true;
        }
    }, { passive: false });

    zoomTarget.addEventListener('touchmove', function (e) {
        e.preventDefault();

        // Multi-Touch Zoom
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            handlePinchZoom(e);
            return;
        }

        // Single Touch
        if (e.touches.length === 1) {
            const touch = e.touches[0];

            // Punkt verschieben
            if (canvas_ready && selectedPoint) {
                const coords = getCanvasCoordinates(touch.clientX, touch.clientY);

                selectedPoint.x = getXPercent(coords.x);
                selectedPoint.y = getYPercent(coords.y);

                showAllPoints();
                return;
            }

            // Pan im Move Mode
            if (moveModeActive && isDragging) {
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;

                offsetX += dx;
                offsetY += dy;

                startX = touch.clientX;
                startY = touch.clientY;

                clampOffsets();
                applyTransform();
            }
        }
    }, { passive: false });

    zoomTarget.addEventListener('touchend', function (e) {
        const touchDuration = Date.now() - touchStartTime;

        if (canvas_ready && selectedPoint) {
            canvas_ready = false;
            saveJson();
            console.log("Punkt gespeichert:", selectedPoint.name);
            selectedPoint = null;
        }

        // Reset Touch-Variablen
        if (e.touches.length === 0) {
            isTouchActive = false;
            isDragging = false;
            lastTouchDistance = null;
            lastTouchCenter = null;
            startX = 0;
            startY = 0;
        }
    }, { passive: false });

    // ====================================================================
    // MOUSE-EVENTS (nur wenn kein Touch aktiv)
    // ====================================================================

    zoomTarget.addEventListener("mousedown", (e) => {
        // Ignoriere Mouse-Events wenn Touch aktiv ist
        if (isTouchActive) {
            return;
        }

        e.preventDefault();

        const coords = getCanvasCoordinates(e.clientX, e.clientY);

        if (!moveModeActive) {
            selectedPoint = null;
            let point_arr = points.values;
            for (let i = point_arr.length - 1; i >= 0; i--) {
                let obj = point_arr[i];
                let absX = getXAbsolute(obj.x);
                let absY = getYAbsolute(obj.y);

                if (isPointNear(coords.x, coords.y, { x: absX, y: absY })) {
                    selectedPoint = obj;
                    updateDeleteButton();
                    break;
                }
            }

            if (selectedPoint) {
                canvas_ready = true;
            } else {
                addNewPoint(coords.x, coords.y);
            }

            $(zoomTarget).css("cursor", "default");
        } else {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            $(zoomTarget).css("cursor", "grabbing");
        }
    });

    zoomTarget.addEventListener('mousemove', function (e) {
        if (isTouchActive) {
            return;
        }

        // Punkt verschieben
        if (canvas_ready && selectedPoint) {
            const coords = getCanvasCoordinates(e.clientX, e.clientY);

            selectedPoint.x = getXPercent(coords.x);
            selectedPoint.y = getYPercent(coords.y);

            showAllPoints();
            return;
        }

        // Bild verschieben
        if (isDragging && moveModeActive) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            offsetX += dx;
            offsetY += dy;

            startX = e.clientX;
            startY = e.clientY;

            clampOffsets();
            applyTransform();
        }
    });

    document.addEventListener("mouseup", () => {
        if (canvas_ready && selectedPoint) {
            canvas_ready = false;
            selectedPoint = null;
            saveJson();
            $(zoomTarget).css("cursor", "default");
        }

        isDragging = false;
        if (moveModeActive) {
            $(zoomTarget).css("cursor", "grab");
        }

        // Reset Touch-Status nach kurzer Verzögerung
        setTimeout(() => {
            isTouchActive = false;
        }, 100);
    });

    // ====================================================================
    // CONTEXT MENU (Rechtsklick zum Löschen)
    // ====================================================================

    zoomTarget.addEventListener("contextmenu", function (e) {
        e.preventDefault();

        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        const point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];
            let absX = getXAbsolute(obj.x);
            let absY = getYAbsolute(obj.y);

            if (isPointNear(coords.x, coords.y, { x: absX, y: absY })) {
                points.values.splice(i, 1);
                showAllPoints();
                saveJson();
                updateDeleteButton();
                console.log("Punkt gelöscht:", obj.name);
                break;
            }
        }
    });

    // ====================================================================
    // WHEEL ZOOM
    // ====================================================================

    zoomTarget.addEventListener("wheel", function (e) {
        e.preventDefault();

        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        zoomAtPosition(mouseX, mouseY, e.deltaY < 0);
    }, { passive: false });

    // ====================================================================
    // BUTTON HANDLERS
    // ====================================================================

    $("#point1").on("click", function () {
        pointModeActive = true;
        moveModeActive = false;
        $(zoomTarget).css("cursor", "default");
        $("#point1").addClass("active");
        $("#move_mode").removeClass("active");
        console.log("Punkt-Modus aktiviert");
    });

    $("#move_mode").on("click", function () {
        moveModeActive = true;
        pointModeActive = false;
        $(zoomTarget).css("cursor", "grab");
        $("#move_mode").addClass("active");
        $("#point1").removeClass("active");
        console.log("Move-Modus aktiviert");
    });

    // ====================================================================
    // ZOOM FUNCTIONS
    // ====================================================================

    function zoomAtPosition(mouseX, mouseY, zoomIn = true) {
        const relX = (mouseX - offsetX) / zoomLevel;
        const relY = (mouseY - offsetY) / zoomLevel;

        let newZoomLevel = zoomIn
            ? Math.min(maxZoom, zoomLevel + zoomStep)
            : Math.max(minZoom, zoomLevel - zoomStep);

        if (newZoomLevel === zoomLevel) return;

        zoomLevel = newZoomLevel;

        offsetX = mouseX - relX * zoomLevel;
        offsetY = mouseY - relY * zoomLevel;

        pointModeActive = false;
        moveModeActive = true;
        $(zoomTarget).css("cursor", "grab");

        $("#point1").removeClass("active");
        $("#move_mode").addClass("active");

        clampOffsets();
        applyTransform();
    }

    function zoomAtCenter(zoomIn = true) {
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        const relX = (centerX - offsetX) / zoomLevel;
        const relY = (centerY - offsetY) / zoomLevel;

        let newZoomLevel = zoomIn
            ? Math.min(maxZoom, zoomLevel + zoomStep)
            : Math.max(minZoom, zoomLevel - zoomStep);

        if (newZoomLevel === zoomLevel) return;

        zoomLevel = newZoomLevel;

        offsetX = centerX - relX * zoomLevel;
        offsetY = centerY - relY * zoomLevel;

        pointModeActive = false;
        moveModeActive = true;
        $(zoomTarget).css("cursor", "grab");

        $("#point1").removeClass("active");
        $("#move_mode").addClass("active");

        clampOffsets();
        applyTransform();
    }

    function handlePinchZoom(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);

        const zoomFactor = newDistance / lastTouchDistance;

        let newZoomLevel = zoomLevel * zoomFactor;
        newZoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));

        const containerRect = container.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - containerRect.left;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - containerRect.top;

        const relX = (centerX - offsetX) / zoomLevel;
        const relY = (centerY - offsetY) / zoomLevel;

        zoomLevel = newZoomLevel;

        offsetX = centerX - relX * zoomLevel;
        offsetY = centerY - relY * zoomLevel;

        clampOffsets();
        applyTransform();

        lastTouchDistance = newDistance;
    }

    // ====================================================================
    // DRAWING FUNCTIONS
    // ====================================================================

    function showAllPoints() {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];
            ctx.fillStyle = "#18ceff";
            ctx.beginPath();
            ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
            ctx.fill();
        }

        drawLinesBetweenPoints();
        drawHorizontalLines();
        updateDeleteButton();
    }

    function drawLinesBetweenPoints() {
        let point_arr = points.values;
        let totalDistance = 0;

        for (let i = 0; i < point_arr.length - 1; i++) {
            let start = point_arr[i];
            let end = point_arr[i + 1];

            let startX = getXAbsolute(start.x);
            let startY = getYAbsolute(start.y);
            let endX = getXAbsolute(end.x);
            let endY = getYAbsolute(end.y);

            totalDistance += calculateDistance(startX, startY, endX, endY);
        }

        for (let i = 0; i < point_arr.length - 1; i++) {
            let start = point_arr[i];
            let end = point_arr[i + 1];

            let startX = getXAbsolute(start.x);
            let startY = getYAbsolute(start.y);
            let endX = getXAbsolute(end.x);
            let endY = getYAbsolute(end.y);

            let distance = calculateDistance(startX, startY, endX, endY);
            let percentage = ((distance / totalDistance) * 100).toFixed(2);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0494ca';
            ctx.stroke();

            ctx.fillStyle = "#0494ca";
            ctx.font = `30px Arial`;
            ctx.fillText(`${percentage}%`, (startX + endX) / 2 + 5, (startY + endY) / 2 - 5);
        }
    }

    function calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    function drawHorizontalLines() {
        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let point = point_arr[i];
            let startX = getXAbsolute(point.x);
            let startY = getYAbsolute(point.y);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(canvas.width, startY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ff5722';
            ctx.stroke();
        }
    }

    function isPointNear(x, y, point) {
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        // Größerer Toleranzbereich für Touch-Geräte
        const tolerance = ('ontouchstart' in window) ? 25 : 15;
        return distance < pointSize + tolerance;
    }

    function addNewPoint(mouseX, mouseY) {
        if (points.values.length < 4) {
            let newPoint = {
                name: 'Punkt ' + (points.values.length + 1),
                type: 'new',
                x: getXPercent(mouseX),
                y: getYPercent(mouseY)
            };

            points.values.push(newPoint);
            showAllPoints();
            saveJson();
            console.log("Neuer Punkt erstellt:", newPoint.name);
        } else {
            alert("Bei der En Face Aufnahme können maximal 4 Punkte gesetzt werden!");
        }
    }

    // ====================================================================
    // DELETE ALL POINTS BUTTON
    // ====================================================================

    function updateDeleteButton() {
        const deleteBtn = document.getElementById("delete-btn-enfance");

        if (points.values.length > 0) {
            if (deleteBtn) {
                $(deleteBtn).addClass("active");
            }
        } else {
            if (deleteBtn) {
                $(deleteBtn).removeClass("active");
            }
        }
    }

    // Delete Button Event Listener
    if (document.getElementById("delete-btn-enfance")) {
        document.getElementById("delete-btn-enfance").addEventListener("click", function() {
            if (points.values.length > 0) {
                // Bestätigungsdialog
                if (confirm("Möchten Sie wirklich alle Punkte löschen?")) {
                    points.values = [];
                    showAllPoints();
                    saveJson();
                    updateDeleteButton();
                    console.log("Alle Punkte gelöscht");
                }
            }
        });
    }

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================

    function getXPercent(x) {
        return (x / canvas.width) * 100;
    }

    function getYPercent(y) {
        return (y / canvas.height) * 100;
    }

    function getXAbsolute(xpercent) {
        return (canvas.width * xpercent) / 100;
    }

    function getYAbsolute(ypercent) {
        return (canvas.height * ypercent) / 100;
    }

    function saveJson() {
        $.ajax({
            type: "POST",
            url: "writeenfaceResult.php",
            data: {
                json: JSON.stringify(points),
                filename: JSON.stringify(filename)
            },
            success: function () {
                console.log("Punkt gespeichert!");
                showAllPoints();
            }
        });
    }

    function loadPoints() {
        $.ajax({
            async: false,
            cache: false,
            url: "enface.json",
            dataType: "json",
            success: function (data) {
                points = data;
                showAllPoints();
            }
        });
    }

    // Initial laden
    loadPoints();
    updateDeleteButton();
});