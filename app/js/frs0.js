$(document).ready(function () {

    let calibrationActive = false;
    let calibrationClicks = [];
    let mmPerPixel = null;

    var fall = window.location.hash.substring(1).split("-")[1];
    console.log(fall);
    var filename = "frs_" + fall + ".json"

    window.moveModeActive = false;

    var fall_nummer = window.location.hash.substring(1).split("-")[0];

    var pointNames = $(".frs_point");
    var points;
    var pointSize = 2.5;
    const linePointSize = 2;
    const lineWidth = 2;
    let cursor_type = "point";
    window.selectedPoint = null;
    var selectedLine = null;
    var selectedAngle = null;
    var lineStartPoint = null;
    var isDrawingLine = false;
    var tempEndPoint = null;
    var anglePoints = [];
    var selected = null;
    var img = document.getElementById('linien_img1');
    var width = img.clientWidth;
    var height = img.clientHeight;
    var c = document.getElementById("frs_canvas");
    var ctx = c.getContext("2d");
    var canvas_ready = false;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // NEU: Variablen für Gesamtverschiebung der Linie
    let movingWholeLine = false;
    let lineMovementOffset = { x: 0, y: 0 };

    const zoomTarget = document.getElementById("zoomTarget");
    const canvas = document.getElementById("frs_canvas");

    let zoomLevel = 1;
    let offsetX = 0;
    let offsetY = 0;

    img.onload = function () {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        zoomLevel = getInitialZoomLevel();
        offsetX = 0;
        offsetY = 0;

        showAllPoints();
    };

    function applyTransform() {
        zoomTarget.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
    }

    function getRelativeMousePos(e) {
        const rect = zoomTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

    function getInitialZoomLevel() {
        const container = document.querySelector(".lines_container");
        const widthRatio = container.clientWidth / img.naturalWidth;
        const heightRatio = container.clientHeight / img.naturalHeight;
        return Math.min(widthRatio, heightRatio);
    }

    window.addEventListener("resize", () => {
        showAllPoints();
    });

    window.showAllPoints = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === "point") {
                let isSet = objp.x !== 0 || objp.y !== 0;

                let pointElem = $(pointNames[i]);
                if (isSet) {
                    pointElem.addClass("set");
                    if (pointElem.find(".checkmark").length === 0) {
                        pointElem.append('<span class="checkmark">✔️</span>');
                    }
                } else {
                    pointElem.removeClass("set");
                    pointElem.find(".checkmark").remove();
                }
            }

            if (objp.type === 'line') {
                let start = objp.start;
                let end = objp.end;
                drawLine(start, end, selectedLine === objp ? "red" : "#18ceff");
            } else if (objp.type === 'point') {
                ctx.fillStyle = (selectedPoint === objp) ? "red" : "#18ceff";
                ctx.beginPath();
                ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }

        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            drawLine(lineStartPoint, tempEndPoint, "#18ceff");
        }

        // NEU: Delete-Button Update
        updateDeleteButton();
    };

    // NEU: Delete-Button Logik
    function updateDeleteButton() {
        const deleteBtn = document.getElementById("delete-btn-frs");

        if (selectedPoint || selectedLine) {
            if (deleteBtn) {
                $(deleteBtn).addClass("active");
            }
        } else {
            if (deleteBtn) {
                $(deleteBtn).removeClass("active");
            }
        }
    }

    // NEU: Delete-Button Event Handler
    if (document.getElementById("delete-btn-frs")) {
        document.getElementById("delete-btn-frs").addEventListener("click", function() {
            if (selectedLine) {
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
                    $(".frs_point").removeClass("active");
                }
            }
            saveJson();
            showAllPoints();
        });
    }

    loadPoints();

    function loadPoints() {
        $.ajax({
            'async': false,
            'global': false,
            'cache': false,
            'url': "frs_muster.json",
            'dataType': "json",
            'success': function (data) {
                points = data;
                showAllPoints();
            }
        });
    }

    function deletePoint(pointToDelete) {
        console.log(pointToDelete);
        points.values = points.values.filter(function (point) {
            return point !== pointToDelete;
        });
        saveJson();
    }

    function deleteLine(lineToDelete) {
        console.log(lineToDelete);
        points.values = points.values.filter(function (point) {
            return point !== lineToDelete;
        });
        saveJson();
    }

    function deleteAngle(angleToDelete) {
        console.log(angleToDelete);
        points.values = points.values.filter(function (point) {
            return point !== angleToDelete;
        });
        saveJson();
    }

    // NEU: Hilfsfunktionen für Linien-Kollision
    function isPointOnLine(mouseX, mouseY, line) {
        const startAbs = {
            x: getXAbsolute(line.start.x),
            y: getYAbsolute(line.start.y)
        };
        const endAbs = {
            x: getXAbsolute(line.end.x),
            y: getYAbsolute(line.end.y)
        };

        const threshold = 5;

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

    function checkLineBodyAtPosition(mouseX, mouseY) {
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'line') {
                let startAbs = {
                    x: getXAbsolute(obj.start.x),
                    y: getYAbsolute(obj.start.y)
                };
                let endAbs = {
                    x: getXAbsolute(obj.end.x),
                    y: getYAbsolute(obj.end.y)
                };

                if (isPointNear(mouseX, mouseY, startAbs) || isPointNear(mouseX, mouseY, endAbs)) {
                    continue;
                }

                if (isPointOnLine(mouseX, mouseY, obj)) {
                    return obj;
                }
            }
        }
        return null;
    }

    function checkPointAtPosition(mouseX, mouseY) {
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'point') {
                let absX = getXAbsolute(obj.x);
                let absY = getYAbsolute(obj.y);

                if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) {
                    return { point: obj, index: i };
                }
            }
        }
        return null;
    }

    function checkLinePointAtPosition(mouseX, mouseY) {
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'line') {
                let startAbs = {
                    x: getXAbsolute(obj.start.x),
                    y: getYAbsolute(obj.start.y)
                };
                let endAbs = {
                    x: getXAbsolute(obj.end.x),
                    y: getYAbsolute(obj.end.y)
                };

                if (isPointNear(mouseX, mouseY, startAbs)) {
                    return { line: obj, point: obj.start, isStart: true };
                }

                if (isPointNear(mouseX, mouseY, endAbs)) {
                    return { line: obj, point: obj.end, isStart: false };
                }
            }
        }
        return null;
    }

    // MOUSEDOWN - Komplett überarbeitet
    c.addEventListener('mousedown', function (e) {
        if (window.moveModeActive) return;

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (cursor_type === "point") {
            // PUNKT-MODUS
            if (selectedPoint) {
                // Ein Punkt ist bereits ausgewählt
                let clickedPoint = checkPointAtPosition(mouseX, mouseY);

                if (clickedPoint && clickedPoint.point === selectedPoint) {
                    // Klick auf den bereits ausgewählten Punkt -> Deselektieren
                    selectedPoint = null;
                    selected = null;
                    $(".frs_point").removeClass("active");
                    showAllPoints();
                    return;
                }

                if (clickedPoint) {
                    // Klick auf einen anderen Punkt -> Diesen auswählen
                    selectedPoint = clickedPoint.point;
                    selected = selectedPoint;
                    canvas_ready = true;
                    window.isDraggingPoint = true;
                    $(".frs_point").removeClass("active");
                    $(pointNames[clickedPoint.index]).addClass("active");
                    showAllPoints();
                    return;
                }

                // Klick ins Leere -> Punkt an neue Position setzen
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true;
                showAllPoints();

            } else {
                // Kein Punkt ausgewählt
                let clickedPoint = checkPointAtPosition(mouseX, mouseY);

                if (clickedPoint) {
                    // Klick auf einen Punkt -> Auswählen und zum Verschieben bereit
                    selectedPoint = clickedPoint.point;
                    selected = selectedPoint;
                    canvas_ready = true;
                    window.isDraggingPoint = true;
                    $(".frs_point").removeClass("active");
                    $(pointNames[clickedPoint.index]).addClass("active");
                    showAllPoints();
                } else {
                    // Klick ins Leere ohne Auswahl -> nichts tun
                    selectedPoint = null;
                    selectedLine = null;
                    $(".frs_point").removeClass("active");
                    showAllPoints();
                }
            }

        } else if (cursor_type === "line") {
            // LINIEN-MODUS
            if (selectedLine) {
                // Eine Linie ist bereits ausgewählt
                let clickedLinePoint = checkLinePointAtPosition(mouseX, mouseY);

                if (clickedLinePoint && clickedLinePoint.line === selectedLine) {
                    // Klick auf einen Endpunkt der ausgewählten Linie
                    selectedPoint = clickedLinePoint.point;
                    canvas_ready = true;
                    movingWholeLine = false;
                    window.isDraggingPoint = true;
                    showAllPoints();
                    return;
                }

                if (isPointOnLine(mouseX, mouseY, selectedLine)) {
                    // Klick auf den Körper der ausgewählten Linie
                    canvas_ready = true;
                    movingWholeLine = true;
                    lineMovementOffset = {
                        x: mouseX,
                        y: mouseY
                    };
                    showAllPoints();
                    return;
                }

                // Klick woanders -> Deselektieren
                selectedPoint = null;
                selectedLine = null;
                selected = null;
                movingWholeLine = false;
                showAllPoints();

            } else {
                // Keine Linie ausgewählt
                let clickedLinePoint = checkLinePointAtPosition(mouseX, mouseY);

                if (clickedLinePoint) {
                    // Klick auf einen Linienendpunkt
                    selectedLine = clickedLinePoint.line;
                    selectedPoint = clickedLinePoint.point;
                    selected = selectedLine;
                    canvas_ready = true;
                    movingWholeLine = false;
                    window.isDraggingPoint = true;
                    showAllPoints();
                } else {
                    let clickedLine = checkLineBodyAtPosition(mouseX, mouseY);

                    if (clickedLine) {
                        // Klick auf einen Linienkörper
                        selectedLine = clickedLine;
                        selected = selectedLine;
                        canvas_ready = true;
                        movingWholeLine = true;
                        lineMovementOffset = {
                            x: mouseX,
                            y: mouseY
                        };
                        showAllPoints();
                    } else {
                        // Klick ins Leere -> Neue Linie beginnen
                        lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                        isDrawingLine = true;
                    }
                }
            }
        }
    });

    // MOUSEMOVE - Erweitert um Linienverschiebung
    c.addEventListener('mousemove', function (e) {
        if (window.moveModeActive) return;

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (isDrawingLine && lineStartPoint) {
            tempEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
            showAllPoints();
        }

        if (canvas_ready && selectedLine && movingWholeLine) {
            const deltaX = mouseX - lineMovementOffset.x;
            const deltaY = mouseY - lineMovementOffset.y;

            const deltaXPercent = getXPercent(deltaX);
            const deltaYPercent = getYPercent(deltaY);

            selectedLine.start.x += deltaXPercent;
            selectedLine.start.y += deltaYPercent;
            selectedLine.end.x += deltaXPercent;
            selectedLine.end.y += deltaYPercent;

            lineMovementOffset.x = mouseX;
            lineMovementOffset.y = mouseY;

            showAllPoints();
        } else if (canvas_ready && selectedPoint) {
            if (cursor_type === "point" || (cursor_type === "line" && selectedLine)) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);

                if (selectedLine) {
                    if (selectedPoint === selectedLine.start) {
                        selectedLine.start = selectedPoint;
                    } else {
                        selectedLine.end = selectedPoint;
                    }
                }

                showAllPoints();
            }
        }
    });

    // MOUSEUP - Erweitert
    c.addEventListener('mouseup', function (e) {
        if (window.moveModeActive) return;
        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (isDrawingLine && lineStartPoint) {
            let lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                points.values.push({
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint,
                    end: lineEndPoint
                });

                saveJson();
                showAllPoints();
            } else {
                selectedPoint = null;
                selectedLine = null;
                selected = null;
                showAllPoints();
                console.log("Start- und Endpunkt sind identisch. Keine Linie erstellt.");
            }

            isDrawingLine = false;
            lineStartPoint = null;
            tempEndPoint = null;
        }

        if (canvas_ready) {
            // Nur speichern, NICHT nochmal Position setzen wenn ganze Linie verschoben wurde
            if (selectedPoint && !movingWholeLine) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
            }
            saveJson();
            canvas_ready = false;
            movingWholeLine = false;
            showAllPoints();
        }

        window.isDraggingPoint = false;
    });

    function drawLine(start, end, color) {
        ctx.beginPath();
        ctx.moveTo(getXAbsolute(start.x), getYAbsolute(start.y));
        ctx.lineTo(getXAbsolute(end.x), getYAbsolute(end.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(getXAbsolute(start.x), getYAbsolute(start.y), linePointSize, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(getXAbsolute(end.x), getYAbsolute(end.y), linePointSize, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();
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
        const absX = getXAbsolute(point.x);
        const absY = getYAbsolute(point.y);

        ctx.fillStyle = color;
        ctx.font = "14px Arial";
        ctx.fillText(angle.toFixed(2) + "°", absX + 10, absY - 10);
    }

    function isPointNear(x, y, point) {
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        return distance < pointSize + 5;
    }

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
        console.log(filename);
        $.ajax({
            type: "POST",
            url: "writefrsResult.php",
            data: {
                json: JSON.stringify(points),
                filename: JSON.stringify(filename)
            },
            success: function () {
                console.log("Daten gespeichert!");
            }
        });
    }

    function selectPoint(i){
        let point_arr = points.values;
        if(i >= 0 && i <= point_arr.length){
            let obj = point_arr[i];
            selectedPoint = obj;
            selected = selectedPoint;
            showAllPoints();
        }
    }

    $("body").on("click", ".auswahl_tab", function (e) {
        cursor_type = $(e.target).attr("data-id");
        $(".auswahl_tab").removeClass("active");
        $(e.target).addClass("active");
        if(cursor_type === "line"){
            $(".frs_point").removeClass("active");
        }
        if (cursor_type !== "winkel") anglePoints = [];
        selectedPoint = null;
        selectedLine = null;
        selected = null;
        canvas_ready = false;
        moveModeActive = false;
        $("#move_mode3").removeClass("active");
        $("#zoomTarget").css("cursor", "default");
        showAllPoints();
    });

    $("body").on("click", ".frs_point", function (e) {
        moveModeActive = false;
        $("#move_mode3").removeClass("active");
        $("#zoomTarget").css("cursor", "default");
        if($(e.target).hasClass("active")){
            selectedPoint = null;
            selectedLine = null;
            selected = null;
            canvas_ready = false;
            showAllPoints();
            $(".frs_point").removeClass("active");
        }else{
            cursor_type = "point";
            selectedPoint = null;
            selectedLine = null;
            selected = null;
            canvas_ready = false;
            $(".auswahl_tab").removeClass("active");
            $($(".auswahl_tab")[0]).addClass("active");
            let dataIndex = $(e.target).attr("data-index");
            selectPoint(dataIndex);
            $(".frs_point").removeClass("active");
            $(e.target).addClass("active");
        }
    });

    $("body").on("click", ".nav_tab", function (e) {
        nav_type = $(e.target).attr("data-id");
        $(".nav_tab").removeClass("active");
        if(nav_type === "aufh"){
            $(".frs_point").removeClass("active");

            selectedPoint = null;
            selectedLine = null;
            selected = null;
            showAllPoints();
        }else if(nav_type === "einbl"){
            console.log($(e.target));
            if($(e.target).hasClass("clicked")){
                console.log("if");
                ctx.clearRect(0, 0, width, height);
                $(e.target).removeClass("clicked");
                $(e.target).html("Alles einblenden");
            }else{
                console.log("else");
                $(e.target).addClass("clicked");
                $(e.target).html("Alles ausblenden");

                showAllPoints();
            }
        }else{
            if (confirm("Sollen wirklich alle Punkte und Linien gelöscht werden?") == true) {
                points = {
                    "values": [
                        { "name": "N", "type": "point", "x": 0, "y": 0 },
                        { "name": "Pog", "type": "point", "x": 0, "y": 0 },
                        { "name": "S", "type": "point", "x": 0, "y": 0 },
                        { "name": "Spa", "type": "point", "x": 0, "y": 0 },
                        { "name": "Spp", "type": "point", "x": 0, "y": 0 },
                        { "name": "A", "type": "point", "x": 0, "y": 0 },
                        { "name": "B", "type": "point", "x": 0, "y": 0 },
                        { "name": "Me", "type": "point", "x": 0, "y": 0 },
                        { "name": "Ar", "type": "point", "x": 0, "y": 0 },
                        { "name": "Tgp", "type": "point", "x": 0, "y": 0 },
                        { "name": "Tga", "type": "point", "x": 0, "y": 0 },
                        { "name": "Go", "type": "point", "x": 0, "y": 0 },
                        { "name": "InOK1", "type": "point", "x": 0, "y": 0 },
                        { "name": "ApOK1", "type": "point", "x": 0, "y": 0 },
                        { "name": "InUK1", "type": "point", "x": 0, "y": 0 },
                        { "name": "ApUK1", "type": "point", "x": 0, "y": 0 },
                        { "name": "hPOcP", "type": "point", "x": 0, "y": 0 },
                        { "name": "vPOcP", "type": "point", "x": 0, "y": 0 },
                        { "name": "N'", "type": "point", "x": 0, "y": 0 },
                        { "name": "Pog'", "type": "point", "x": 0, "y": 0 },
                        { "name": "Ls", "type": "point", "x": 0, "y": 0 },
                        { "name": "Li", "type": "point", "x": 0, "y": 0 },
                        { "name": "Sn", "type": "point", "x": 0, "y": 0 },
                        { "name": "ProN", "type": "point", "x": 0, "y": 0 }
                    ]
                };
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                lineStartPoint = null;
                isDrawingLine = false;
                tempEndPoint = null;
                anglePoints = [];
                selected = null;
                $(".frs_point").removeClass("active");
                saveJson();
                showAllPoints();
            }
        }
    });

    $(document).on("click", "#value_btn", function (e) {
        let err = 0;
        let inputs = document.getElementsByTagName("input");
        for (let i = 0; i < inputs.length; i++) {
            if(inputs[i].value.length <= 0){
                if($($(inputs[i]).parent(".input_cont")[0]).hasClass("grey") || $($(inputs[i]).is(":disabled"))){
                    continue;
                }else{
                    alert("Bitte alle Felder ausfüllen!");
                    err = 1;
                    break;
                }
            }
        }

        if(err === 0){
            let obj = { id: window.location.hash.substring(1).split("-")[0] };
            let post_data = JSON.stringify(obj);
            $.ajax({
                type: "POST",
                url: 'php/getValues.php',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: post_data,
                type: "POST",
                success: function (result) {
                    selectedPoint = null;
                    selectedLine = null;
                    selectedAngle = null;
                    selected = null;
                    showAllPoints();
                    getFrsResults();
                    $("#next_btn").removeClass("inactive");
                    $("#value_btn").addClass("inactive");
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log(xhr.status);
                    console.log(thrownError);
                }
            });
        }
    });

    function getFrsResults(){
        var filename = "eingabe/frs" + fall_nummer + ".json"

        return (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'cache': false,
                'url': filename,
                'dataType': "json",
                'success': function (data) {
                    points = data;
                    showAllPointsResult(points);
                }
            });
        })();
    }

    function showAllPointsResult(pointsr) {
        let point_arr = pointsr.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                let start = objp.start;
                let end = objp.end;
                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red");
                } else {
                    drawLine(start, end, "#67ff18");
                }
            }else if (objp.type === 'point') {
                ctx.fillStyle = "#67ff18";
                if (selectedPoint && selectedPoint === objp) {
                    ctx.fillStyle = "red";
                }
                ctx.beginPath();
                ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }

        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            drawLine(lineStartPoint, tempEndPoint, "#67ff18");
        }
    }

    c.addEventListener("contextmenu", function (e) {
        e.preventDefault();

        const rect = c.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (c.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (c.height / rect.height);

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let obj = point_arr[i];

            if (obj.type === "point") {
                let absX = getXAbsolute(obj.x);
                let absY = getYAbsolute(obj.y);

                if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) {
                    if (confirm("Diesen Punkt wirklich löschen?")) {
                        obj.x = 0;
                        obj.y = 0;
                        selectedPoint = null;
                        $(".frs_point").removeClass("active");
                        saveJson();
                        showAllPoints();
                    }
                    return false;
                }
            }

            if (obj.type === "line") {
                let startAbs = {
                    x: getXAbsolute(obj.start.x),
                    y: getYAbsolute(obj.start.y)
                };
                let endAbs = {
                    x: getXAbsolute(obj.end.x),
                    y: getYAbsolute(obj.end.y)
                };

                if (isPointNear(mouseX, mouseY, startAbs) || isPointNear(mouseX, mouseY, endAbs)) {
                    if (confirm("Diese Linie wirklich löschen?")) {
                        deleteLine(obj);
                        selectedLine = null;
                        saveJson();
                        showAllPoints();
                    }
                    return false;
                }
            }
        }


        return false;
    });

    $(window).on("resize", function () {
        resizeCanvas();
    });

    function resizeCanvas() {
        width = img.clientWidth;
        height = img.clientHeight;
        c.width = width;
        c.height = height;
        showAllPoints();
    }

    // Touch Events - Erweitert
    canvas.addEventListener("touchstart", function (e) {
        if (window.moveModeActive || e.touches.length !== 1) return;
        e.preventDefault();

        const touch = e.touches[0];
        const { x: mouseX, y: mouseY } = getRelativeTouchPos(touch);

        if (cursor_type === "point") {
            let clickedPoint = checkPointAtPosition(mouseX, mouseY);

            if (clickedPoint) {
                selectedPoint = clickedPoint.point;
                canvas_ready = true;
                window.isDraggingPoint = true;

                $(".frs_point").removeClass("active");
                $(pointNames[clickedPoint.index]).addClass("active");

                showAllPoints();
            } else if (selectedPoint) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            }
        } else if (cursor_type === "line") {
            let clickedLinePoint = checkLinePointAtPosition(mouseX, mouseY);

            if (clickedLinePoint) {
                selectedLine = clickedLinePoint.line;
                selectedPoint = clickedLinePoint.point;
                selected = selectedLine;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else if (selectedLine && selectedPoint) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else {
                let clickedLine = checkLineBodyAtPosition(mouseX, mouseY);

                if (clickedLine) {
                    selectedLine = clickedLine;
                    selected = selectedLine;
                    canvas_ready = true;
                    movingWholeLine = true;
                    lineMovementOffset = {
                        x: mouseX,
                        y: mouseY
                    };
                    showAllPoints();
                } else {
                    selectedPoint = null;
                    selectedLine = null;
                    lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                    isDrawingLine = true;
                }
            }
        }
    }, { passive: false });

    canvas.addEventListener("touchmove", function (e) {
        if (window.moveModeActive || e.touches.length !== 1) return;
        e.preventDefault();

        const touch = e.touches[0];
        const { x: mouseX, y: mouseY } = getRelativeTouchPos(touch);

        if (isDrawingLine && lineStartPoint) {
            tempEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
            showAllPoints();
        }

        if (canvas_ready && selectedLine && movingWholeLine) {
            const deltaX = mouseX - lineMovementOffset.x;
            const deltaY = mouseY - lineMovementOffset.y;

            const deltaXPercent = getXPercent(deltaX);
            const deltaYPercent = getYPercent(deltaY);

            selectedLine.start.x += deltaXPercent;
            selectedLine.start.y += deltaYPercent;
            selectedLine.end.x += deltaXPercent;
            selectedLine.end.y += deltaYPercent;

            lineMovementOffset.x = mouseX;
            lineMovementOffset.y = mouseY;

            showAllPoints();
        } else if (canvas_ready && selectedPoint) {
            selectedPoint.x = getXPercent(mouseX);
            selectedPoint.y = getYPercent(mouseY);
            showAllPoints();
        }
    }, { passive: false });

    canvas.addEventListener("touchend", function (e) {
        if (window.moveModeActive) return;
        e.preventDefault();

        if (isDrawingLine && lineStartPoint) {
            const touch = e.changedTouches[0];
            const { x: mouseX, y: mouseY } = getRelativeTouchPos(touch);

            let lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                points.values.push({
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint,
                    end: lineEndPoint
                });

                saveJson();
                showAllPoints();
            }

            isDrawingLine = false;
            lineStartPoint = null;
            tempEndPoint = null;
        }

        if (canvas_ready && (selectedPoint || movingWholeLine)) {
            saveJson();
            canvas_ready = false;
            movingWholeLine = false;
        }

        window.isDraggingPoint = false;
    }, { passive: false });

    function getRelativeTouchPos(touch) {
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

});