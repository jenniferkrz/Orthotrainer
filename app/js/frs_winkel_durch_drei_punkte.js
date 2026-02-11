$(document).ready(function () {

    var fall = window.location.hash.substring(1).split("-")[1];
    console.log(fall);
    var filename = "frs_" + fall + ".json"

    window.moveModeActive = false;


    var points;
    var pointSize = 2.5;
    let cursor_type = "winkel";
    window.selectedPoint = null;
    window.selectedLine = null;
    window.selectedAngle = null;
    var lineStartPoint = null;
    var isDrawingLine = false;
    var tempEndPoint = null; // Für temporäre Linie
    var anglePoints = []; // Liste für die drei Punkte des Winkels
    var selected = null; // Variable für den aktuell ausgewählten Punkt, Linie oder Winkel
    var img = document.getElementById('linien_img1');
    var width = img.clientWidth;
    var height = img.clientHeight;
    var c = document.getElementById("frs_canvas");
    var ctx = c.getContext("2d");
    var canvas_ready = true;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    window.showAllPoints = function () {
        ctx.clearRect(0, 0, width, height); // Canvas löschen

        let point_arr = points.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                let start = objp.start;
                let end = objp.end;
                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red");  // Markiere die Linie rot
                } else {
                    drawLine(start, end, "#18ceff");
                }
            } else if (objp.type === 'angle') {
                if (selectedAngle && selectedAngle === objp) {
                    drawAngle(objp.points, "red");  // Markiere den Winkel rot
                } else {
                    drawAngle(objp.points, "#67ff18");
                }
            } else {
                ctx.fillStyle = "#18ceff";
                if (selectedPoint && selectedPoint === objp) {
                    ctx.fillStyle = "red";  // Markiere den Punkt rot
                }
                ctx.beginPath();
                ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }

        // Temporäre Linie zeichnen, falls vorhanden
        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            drawLine(lineStartPoint, tempEndPoint, "#18ceff");
        }

        // Falls ein Punkt, Linie oder Winkel ausgewählt wurde, zeige den Lösch-Button
        if (selected) {

        }
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
                showAllPoints();
            }
        });
    }





    function deletePoint(pointToDelete) {
        console.log(pointToDelete);
        // Entferne den Punkt aus der Liste
        points.values = points.values.filter(function (point) {
            return point !== pointToDelete;
        });
        saveJson();  // Speichere die geänderten Daten
    }

    function deleteLine(lineToDelete) {
        console.log(lineToDelete);
        // Entferne die Linie aus der Liste
        points.values = points.values.filter(function (point) {
            return point !== lineToDelete;
        });
        saveJson();  // Speichere die geänderten Daten
    }

    function deleteAngle(angleToDelete) {
        console.log(angleToDelete);
        // Entferne den Winkel aus der Liste
        points.values = points.values.filter(function (point) {
            return point !== angleToDelete;
        });
        saveJson();  // Speichere die geänderten Daten
    }

    c.addEventListener('mousedown', function (e) {
        if (window.moveModeActive) return;
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        if (cursor_type === "line") {

            // Logik für Linien-Endpunkte
            selectedPoint = null;
            selectedLine = null;
            checkIfSelected(mouseX, mouseY);

            if (selectedLine) {
                canvas_ready = true;
                showAllPoints();
            } else {
                lineStartPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                isDrawingLine = true;
            }


        } else if (cursor_type === "winkel") {

            selectedPoint = null;
            selectedLine = null;
            selectedAngle = null;

            checkIfSelected(mouseX, mouseY);
            console.log(selectedAngle);

            if (selectedAngle) {
                canvas_ready = true;
                showAllPoints();
            } else {
                console.log(selectedAngle);
                console.log("test");
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                selected = null;
                //showAllPoints();
                if (anglePoints.length < 3) {
                    const newPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };
                    anglePoints.push(newPoint);

                    ctx.fillStyle = "#67ff18";
                    ctx.beginPath();
                    ctx.arc(mouseX, mouseY, pointSize, 0, Math.PI * 2, true);
                    ctx.fill();

                    if (anglePoints.length > 1) {
                        drawLine(anglePoints[anglePoints.length - 2], anglePoints[anglePoints.length - 1], "#67ff18");
                    }

                    if (anglePoints.length === 3) {
                        const angle = calculateAngle(anglePoints[0], anglePoints[1], anglePoints[2]);
                        displayAngle(angle, anglePoints[1]);

                        points.values.push({
                            name: 'Winkel',
                            type: 'angle',
                            points: anglePoints
                        });

                        saveJson();
                        anglePoints = [];
                    }

                }
            }

        } else if (cursor_type === "point") {
            // Punktbewegungslogik
            if (selectedPoint) {
                selectedPoint.x = getXPercent(mouseX);
                selectedPoint.y = getYPercent(mouseY);

                canvas_ready = true;
                showAllPoints(); // Canvas aktualisieren
                saveJson(); // Änderungen speichern
            } else {
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                checkIfSelected(mouseX, mouseY);

                if (selectedPoint) {
                    canvas_ready = true;
                    showAllPoints();
                } else {
                    console.log("Kein Punkt ausgewählt.");
                }
            }
        }
    });
    
    function checkIfSelected(mouseX, mouseY){
        let point_arr = points.values;
        console.log(cursor_type);

        // Check if a point is selected
        for (let i = point_arr.length - 1; i >= 0; i--) {
            let obj = point_arr[i];
            let absX = getXAbsolute(obj.x);
            let absY = getYAbsolute(obj.y);

            if (isPointNear(mouseX, mouseY, { x: absX, y: absY }) && cursor_type === "point") {
                $(".frs_point").removeClass("active");
                selectedPoint = obj;
                selected = selectedPoint;
                break;
            }
        }

        // Check if a line's start or end point is selected
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

        // Check if an angle's point is selected
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
                            selected = selectedAngle;  // Speichern des ausgewählten Winkels
                            break;
                        }
                    }
                }
            }
            console.log("Kein Winkel angeklickt");
        }
    }

    c.addEventListener('mousemove', function (e) {
        if (window.moveModeActive) return;
        if (isDrawingLine && lineStartPoint) {
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            tempEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) }; // Temporäres Endpunkt aktualisieren
            showAllPoints(); // Zeichnet temporäre Linie neu
        }

        if (canvas_ready && selectedPoint) {
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;

            // Verschiebe den ausgewählten Punkt
            selectedPoint.x = getXPercent(mouseX);
            selectedPoint.y = getYPercent(mouseY);

            // Wenn eine Linie ausgewählt wurde, aktualisiere deren Endpunkte
            if (selectedLine) {
                if (selectedPoint === selectedLine.start) {
                    selectedLine.start = selectedPoint;
                } else {
                    selectedLine.end = selectedPoint;
                }
            }

            // Wenn ein Winkel ausgewählt wurde, aktualisiere dessen Punkte
            if (selectedAngle) {
                const index = selectedAngle.points.indexOf(selectedPoint);
                if (index !== -1) {
                    selectedAngle.points[index] = selectedPoint;
                }
            }

            showAllPoints();
        }
    });

    c.addEventListener('mouseup', function (e) {
        if (window.moveModeActive) return;
        if (isDrawingLine && lineStartPoint) {
            const mouseX = e.offsetX;
            const mouseY = e.offsetY;
            let lineEndPoint = { x: getXPercent(mouseX), y: getYPercent(mouseY) };

            // Überprüfen, ob Start- und Endpunkt unterschiedlich sind
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
            tempEndPoint = null; // Temporäre Linie zurücksetzen
        }

        if (canvas_ready && selectedPoint) {
            saveJson();
            canvas_ready = false;
        }
    });

    function drawLine(start, end, color) {
        ctx.beginPath();
        ctx.moveTo(getXAbsolute(start.x), getYAbsolute(start.y));
        ctx.lineTo(getXAbsolute(end.x), getYAbsolute(end.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Endpunkte
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

    function addNewPoint(mouseX, mouseY) {
        let newX = getXPercent(mouseX);
        let newY = getYPercent(mouseY);

        points.values.push({ name: 'Punkt', type: 'new', x: newX, y: newY });
        showAllPoints();
        saveJson();
    }

    function getXPercent(x) {
        return (x / width) * 100;
    }

    function getYPercent(y) {
        return (y / height) * 100;
    }

    function getXAbsolute(xpercent) {
        return (width * xpercent) / 100;
    }

    function getYAbsolute(ypercent) {
        return (height * ypercent) / 100;
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
        if(cursor_type === "line"){
            $(".frs_point").removeClass("active");
        }
        if (cursor_type !== "winkel") anglePoints = [];
        selectedPoint = null;
        selectedLine = null;
        selected = null;
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


    $("body").on("click", ".nav_tab", function (e) {
        nav_type = $(e.target).attr("data-id");
        $(".nav_tab").removeClass("active");
        console.log(nav_type);
        if(nav_type === "aufh"){
            $(".frs_point").removeClass("active");

            selectedPoint = null;
            selectedLine = null;
            selectedAngle = null;
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
                        {
                            "name": "N",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Pog",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "S",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Spa",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Spp",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "A",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "B",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Me",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Ar",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Tgp",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Tga",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Go",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "InOK1",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "ApOK1",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "InUK1",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "ApUK1",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "hPOcP",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "vPOcP",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "N'",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Pog'",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Ls",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Li",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "Sn",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        },
                        {
                            "name": "ProN",
                            "type": "point",
                            "x": 0,
                            "y": 0
                        } ]
                };
                selectedPoint = null;
                selectedLine = null;
                selectedAngle = null;
                lineStartPoint = null;
                isDrawingLine = false;
                tempEndPoint = null; // Für temporäre Linie
                anglePoints = []; // Liste für die drei Punkte des Winkels
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
            //Anzahl der Datenbankeinträge abfragen und im Subheader angeben
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


    //Results
    function getFrsResults(){

        return (function () {
            var json = null;
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
        })();

    }


    function showAllPointsResult(pointsr) {
        //ctx.clearRect(0, 0, width, height); // Canvas löschen

        let point_arr = pointsr.values;

        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                let start = objp.start;
                let end = objp.end;
                if (selectedLine && selectedLine === objp) {
                    drawLine(start, end, "red");  // Markiere die Linie rot
                } else {
                    drawLine(start, end, "#18ceff");
                }
            } else if (objp.type === 'angle') {
                if (selectedAngle && selectedAngle === objp) {
                    drawAngle(objp.points, "red");  // Markiere den Winkel rot
                } else {
                    drawAngle(objp.points, "#67ff18");
                }
            } else {
                ctx.fillStyle = "#18ceff";
                if (selectedPoint && selectedPoint === objp) {
                    ctx.fillStyle = "red";  // Markiere den Punkt rot
                }
                ctx.beginPath();
                ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
                ctx.fill();
            }
        }

        // Temporäre Linie zeichnen, falls vorhanden
        if (isDrawingLine && lineStartPoint && tempEndPoint) {
            drawLine(lineStartPoint, tempEndPoint, "#18ceff");
        }

        // Falls ein Punkt, Linie oder Winkel ausgewählt wurde, zeige den Lösch-Button
        if (selected) {

        }
    }






});
