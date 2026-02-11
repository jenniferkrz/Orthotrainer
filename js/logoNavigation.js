$(document).ready(function () {

    var fall = window.location.hash.substring(1).split("-")[1];
    console.log(fall);
    var filename = "frs_" + fall + ".json"

    window.moveModeActive = false;

    var points;
    var pointSize = 2.5;
    let cursor_type = "winkel";
    let showAngles = true;

    window.selectedPoint = null;
    window.selectedLine = null;
    window.selectedAngle = null;
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
    var canvas_ready = false; // GEÄNDERT: Startet mit false

    const zoomTarget = document.getElementById("zoomTarget");
    const canvas = document.getElementById("frs_canvas");

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    function getRelativeMousePos(e) {
        const rect = zoomTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

    window.showAllPoints = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // GEÄNDERT: canvas.width/height

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                // Prüfen, ob diese Linie Teil eines Winkels ist
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

                // Wenn die Linie Teil eines Winkels ist und Winkel ausgeblendet sind: überspringen
                if (isPartOfAngle && !showAngles) {
                    continue;
                }

                // Wenn die Linie Teil eines Winkels ist: nicht separat zeichnen
                if (isPartOfAngle) {
                    continue;
                }

                let start = objp.start;
                let end = objp.end;

                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red");
                } else {
                    drawLine(start, end, "#18ceff");
                }
            }

            else if (objp.type === 'angle') {
                if (!showAngles) continue;

                if (selectedAngle && selectedAngle === objp) {
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

        // Temporäre Linie in grün anzeigen
        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            drawLine(lineStartPoint, tempEndPoint, "#67ff18");
        }

        // Aktuell gezeichnete Winkel-Linien anzeigen
        if (cursor_type === "winkel" && angleLines.length > 0) {
            for (let line of angleLines) {
                drawLine(line.start, line.end, "#67ff18");
            }
        }
    };

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
                showAllPoints();
            }
        });
    }

    function pointsMatch(p1, p2) {
        return Math.abs(p1.x - p2.x) < 0.0001 && Math.abs(p1.y - p2.y) < 0.0001;
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
        console.log("Deleting angle:", angleToDelete);

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

    // MOUSEDOWN - mit direktem Canvas-Klick
    c.addEventListener('mousedown', function (e) {
        if (window.moveModeActive) return;
        if (e.button !== 0) return;

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (cursor_type === "line") {
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
                selectedPoint = null;
                selectedLine = null;
                lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                isDrawingLine = true;
            }
        }

        else if (cursor_type === "winkel") {
            let clickedAnglePoint = checkAnglePointAtPosition(mouseX, mouseY);

            if (clickedAnglePoint) {
                selectedAngle = clickedAnglePoint.angle;
                selectedPoint = clickedAnglePoint.point;
                selected = selectedAngle;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else if (selectedAngle && selectedPoint) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else {
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                isDrawingLine = true;
            }
        }

        else if (cursor_type === "point") {
            let clickedPoint = checkPointAtPosition(mouseX, mouseY);

            if (clickedPoint) {
                selectedPoint = clickedPoint.point;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else if (selectedPoint) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else {
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                showAllPoints();
            }
        }
    });

    // NEUE FUNKTION: Prüft ob an einer Position ein normaler Punkt ist
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

    // NEUE FUNKTION: Prüft ob an einer Position ein Linien-Endpunkt ist
    function checkLinePointAtPosition(mouseX, mouseY) {
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'line') {
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

    // NEUE FUNKTION: Prüft ob an einer Position ein Winkel-Punkt ist
    function checkAnglePointAtPosition(mouseX, mouseY) {
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];

            if (obj.type === 'angle' && obj.points?.length === 3) {
                for (let j = 0; j < obj.points.length; j++) {
                    let anglePoint = obj.points[j];
                    let absX = getXAbsolute(anglePoint.x);
                    let absY = getYAbsolute(anglePoint.y);

                    if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) {
                        return { angle: obj, point: anglePoint, pointIndex: j };
                    }
                }
            }
        }
        return null;
    }

    function checkIfSelected(mouseX, mouseY){
        let point_arr = points.values;

        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];
            let absX = getXAbsolute(obj.x);
            let absY = getYAbsolute(obj.y);

            if (isPointNear(mouseX, mouseY, { x: absX, y: absY }) && cursor_type === "point") {
                selectedPoint = obj;
                selected = selectedPoint;
                break;
            }
        }

        if (!selectedPoint) {
            for (let i = point_arr.length - 1; i >= 0; i--) {
                let obj = point_arr[i];
                if (obj.type === 'line' && cursor_type === "line") {
                    let start = obj.start;
                    let end = obj.end;
                    if (isPointNear(mouseX, mouseY, { x: getXAbsolute(start.x), y: getYAbsolute(start.y) })) {
                        selectedLine = obj;
                        selectedPoint = start;
                        selected = selectedLine;
                        break;
                    } else if (isPointNear(mouseX, mouseY, { x: getXAbsolute(end.x), y: getYAbsolute(end.y) })) {
                        selectedLine = obj;
                        selectedPoint = end;
                        selected = selectedLine;
                        break;
                    }
                }
            }
        }

        if (!selectedPoint && !selectedLine) {
            for (let i = point_arr.length - 1; i >= 0; i--) {
                let obj = point_arr[i];
                if (obj.type === 'angle' && cursor_type === "winkel") {
                    let anglePoints = obj.points;
                    for (let j = 0; j < anglePoints.length; j++) {
                        let anglePoint = anglePoints[j];
                        if (isPointNear(mouseX, mouseY, { x: getXAbsolute(anglePoint.x), y: getYAbsolute(anglePoint.y) })) {
                            selectedAngle = obj;
                            selectedPoint = anglePoint;
                            selected = selectedAngle;
                            break;
                        }
                    }
                }
            }
        }
    }

    // MOUSEMOVE - Live-Update
    c.addEventListener('mousemove', function (e) {
        if (window.moveModeActive) return;

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);

        if (isDrawingLine && lineStartPoint) {
            tempEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
            showAllPoints();
        }

        if (canvas_ready && selectedPoint) {
            selectedPoint.x = getXPercent(mouseX);
            selectedPoint.y = getYPercent(mouseY);

            if (selectedLine) {
                if (selectedPoint === selectedLine.start) {
                    selectedLine.start = selectedPoint;
                } else {
                    selectedLine.end = selectedPoint;
                }
            }

            if (selectedAngle) {
                const index = selectedAngle.points.indexOf(selectedPoint);
                if (index !== -1) {
                    selectedAngle.points[index] = selectedPoint;
                }
            }

            showAllPoints();
        }
    });

    // MOUSEUP - Speichern
    c.addEventListener('mouseup', function (e) {
        if (window.moveModeActive) return;

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);
        const lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

        if (isDrawingLine && lineStartPoint) {
            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                const newLine = {
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint,
                    end: lineEndPoint,
                    isNew: true
                };

                if (cursor_type === "winkel") {
                    newLine.partOfAngle = true;
                    angleLines.push(newLine);

                    // WICHTIG: Nicht sofort zu points.values hinzufügen!

                    if (angleLines.length === 2) {
                        const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                        if (intersection) {
                            const angle = calculateAngle(
                                angleLines[0].start,
                                intersection,
                                angleLines[1].end
                            );

                            const newAngle = {
                                name: "Winkel",
                                type: "angle",
                                points: [angleLines[0].start, intersection, angleLines[1].end],
                                angle: angle
                            };

                            points.values.push(newAngle);
                            saveJson();
                            showAllPoints();

                            if (!showAngles) {
                                drawAngle(newAngle.points, "#67ff18");
                            }
                        }
                        angleLines = [];
                    }
                } else {
                    points.values.push(newLine);
                    saveJson();
                    showAllPoints();
                }
            }

            isDrawingLine = false;
            lineStartPoint = null;
            tempEndPoint = null;
        }

        if (canvas_ready && selectedPoint) {
            saveJson();
        }

        canvas_ready = false;
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

        return {
            x: getXPercent(px),
            y: getYPercent(py)
        };
    }

    function drawLine(start, end, color) {
        ctx.beginPath();
        ctx.moveTo(getXAbsolute(start.x), getYAbsolute(start.y));
        ctx.lineTo(getXAbsolute(end.x), getYAbsolute(end.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(getXAbsolute(start.x), getYAbsolute(start.y), 3, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(getXAbsolute(end.x), getYAbsolute(end.y), 3, 0, Math.PI * 2, true);
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
        let absX = getXAbsolute(point.x);
        let absY = getYAbsolute(point.y);

        const offsetX = 10;
        const offsetY = -10;

        let textX = absX + offsetX;
        let textY = absY + offsetY;

        textX = Math.max(5, Math.min(canvas.width - 30, textX));
        textY = Math.max(15, Math.min(canvas.height - 5, textY));

        ctx.fillStyle = color || "#67ff18";
        ctx.font = "14px Arial";
        ctx.fillText(angle.toFixed(2) + "°", textX, textY);
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
        $.ajax({
            type: "POST",
            url: "writefrs.php",
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
        $('#zoomTarget').css("cursor", "default");

        window.moveModeActive = false;
        $('#move_mode3').removeClass("active");
        cursor_type = $(e.target).attr("data-id");
        $(".auswahl_tab").removeClass("active");
        $(e.target).addClass("active");

        selectedPoint = null;
        selectedLine = null;
        selectedAngle = null;
        selected = null;
        canvas_ready = false;

        if (cursor_type !== "winkel") angleLines = [];
        showAllPoints();
    });

    $("body").on("click", ".frs_point", function (e) {
        if($(e.target).hasClass("active")){
            selectedPoint = null;
            selectedLine = null;
            selected = null;
            showAllPoints();
            $(".frs_point").removeClass("active");
        }else{
            cursor_type = "point";
            selectedPoint = null;
            selectedLine = null;
            selected = null;
            $(".auswahl_tab").removeClass("active");
            $($(".auswahl_tab")[0]).addClass("active");
            let dataIndex = $(e.target).attr("data-index");
            selectPoint(dataIndex);
            $(".frs_point").removeClass("active");
            $(e.target).addClass("active");
        }
    });

    $("body").on("click", "#einbl", function (e) {
        const $btn = $(e.currentTarget);
        showAngles = !showAngles;

        if (!showAngles) {
            $btn.removeClass("clicked");
            $btn.html('<i class="fa fa-eye"></i>');
        } else {
            $btn.addClass("clicked");
            $btn.html('<i class="fa fa-eye-slash"></i>');
        }

        showAllPoints();
    });

    $("body").on("click", ".nav_tab", function (e) {
        nav_type = $(e.target).attr("data-id");
        $(".nav_tab").removeClass("active");

        if(nav_type === "aufh"){
            $(".frs_point").removeClass("active");
            selectedPoint = null;
            selectedLine = null;
            selectedAngle = null;
            selected = null;
            showAllPoints();
        }else if(nav_type === "einbl"){
            if($(e.target).hasClass("clicked")){
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                $(e.target).removeClass("clicked");
                $(e.target).html("Alles einblenden");
            }else{
                $(e.target).addClass("clicked");
                $(e.target).html("Alles ausblenden");
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
        $.ajax({
            'async': false,
            'global': false,
            'cache': false,
            'url': "eingabe/frs6.json",
            'dataType': "json",
            'success': function (data) {
                points = data;
                showAllPointsResult(points);
            }
        });
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
                    drawLine(start, end, "#18ceff");
                }
            } else if (objp.type === 'angle') {
                if (selectedAngle && selectedAngle === objp) {
                    drawAngle(objp.points, "red");
                } else {
                    drawAngle(objp.points, "#67ff18");
                }
            } else {
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
            drawLine(lineStartPoint, tempEndPoint, "#18ceff");
        }
    }

    c.addEventListener("contextmenu", function (e) {
        e.preventDefault();

        const { x: mouseX, y: mouseY } = getRelativeMousePos(e);
        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let obj = point_arr[i];
            if (obj.type === "angle") {
                let anglePoints = obj.points;
                for (let j = 0; j < anglePoints.length; j++) {
                    let absX = getXAbsolute(anglePoints[j].x);
                    let absY = getYAbsolute(anglePoints[j].y);

                    if (isPointNear(mouseX, mouseY, { x: absX, y: absY })) {
                        if (confirm("Diesen Winkel wirklich löschen?")) {
                            deleteAngle(obj);
                            selectedAngle = null;
                            saveJson();
                            showAllPoints();
                        }
                        return false;
                    }
                }
            }
        }

        for (let i = 0; i < point_arr.length; i++) {
            let obj = point_arr[i];
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
                        saveJson();
                        showAllPoints();
                    }
                    return false;
                }
            }
        }

        return false;
    });

    // TOUCH EVENTS
    function getTouchPosition(e) {
        const rect = zoomTarget.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: (touch.clientX - rect.left) * (canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    c.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (window.moveModeActive) return;

        const { x, y } = getTouchPosition(e);

        if (cursor_type === "line") {
            let clickedLinePoint = checkLinePointAtPosition(x, y);

            if (clickedLinePoint) {
                selectedLine = clickedLinePoint.line;
                selectedPoint = clickedLinePoint.point;
                selected = selectedLine;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else {
                lineStartPoint = { x: getXPercent(x), y: getYPercent(y) };
                isDrawingLine = true;
            }
        }

        else if (cursor_type === "winkel") {
            let clickedAnglePoint = checkAnglePointAtPosition(x, y);

            if (clickedAnglePoint) {
                selectedAngle = clickedAnglePoint.angle;
                selectedPoint = clickedAnglePoint.point;
                selected = selectedAngle;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else {
                lineStartPoint = { x: getXPercent(x), y: getYPercent(y) };
                isDrawingLine = true;
            }
        }

        else if (cursor_type === "point") {
            let clickedPoint = checkPointAtPosition(x, y);

            if (clickedPoint) {
                selectedPoint = clickedPoint.point;
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
            } else if (selectedPoint) {
                selectedPoint.x = getXPercent(x);
                selectedPoint.y = getYPercent(y);
                canvas_ready = true;
                window.isDraggingPoint = true;
                showAllPoints();
                saveJson();
            }
        }
    }, { passive: false });

    c.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (window.moveModeActive) return;

        const { x, y } = getTouchPosition(e);

        if (isDrawingLine && lineStartPoint) {
            tempEndPoint = { x: getXPercent(x), y: getYPercent(y) };
            showAllPoints();
        }

        if (canvas_ready && selectedPoint) {
            selectedPoint.x = getXPercent(x);
            selectedPoint.y = getYPercent(y);
            showAllPoints();
        }
    }, { passive: false });

    c.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (window.moveModeActive) return;

        const { x, y } = getTouchPosition(e);
        const lineEndPoint = { x: getXPercent(x), y: getYPercent(y) };

        if (isDrawingLine && lineStartPoint) {
            if (lineStartPoint.x !== lineEndPoint.x || lineStartPoint.y !== lineEndPoint.y) {
                const newLine = {
                    name: 'Linie',
                    type: 'line',
                    start: lineStartPoint,
                    end: lineEndPoint,
                    isNew: true
                };

                if (cursor_type === "winkel") {
                    newLine.partOfAngle = true;
                    angleLines.push(newLine);

                    if (angleLines.length === 2) {
                        const intersection = getLineIntersection(angleLines[0], angleLines[1]);
                        if (intersection) {
                            const angle = calculateAngle(
                                angleLines[0].start,
                                intersection,
                                angleLines[1].end
                            );

                            const newAngle = {
                                name: "Winkel",
                                type: "angle",
                                points: [angleLines[0].start, intersection, angleLines[1].end],
                                angle: angle
                            };

                            points.values.push(newAngle);
                            saveJson();
                            showAllPoints();

                            if (!showAngles) {
                                drawAngle(newAngle.points, "#67ff18");
                            }
                        }
                        angleLines = [];
                    }
                } else {
                    points.values.push(newLine);
                    saveJson();
                    showAllPoints();
                }
            }

            isDrawingLine = false;
            lineStartPoint = null;
            tempEndPoint = null;
        }

        if (canvas_ready && selectedPoint) {
            saveJson();
            canvas_ready = false;
        }

        window.isDraggingPoint = false;
    }, { passive: false });
});