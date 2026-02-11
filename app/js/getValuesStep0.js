$(document).ready(function () {

    //Enface
    var points = {'values':[]};
    var pointSize = 4;
    var img = document.getElementById('linien_img1');
    var c = document.getElementById("lines1");
    var ctx = c.getContext("2d");

    // Warte bis Bild geladen ist, dann initialisiere Canvas
    img.onload = function() {
        ctx.canvas.width = img.naturalWidth;
        ctx.canvas.height = img.naturalHeight;
        console.log("Enface Canvas initialisiert:", ctx.canvas.width, ctx.canvas.height);
    };

    if (img.complete) {
        ctx.canvas.width = img.naturalWidth;
        ctx.canvas.height = img.naturalHeight;
    }

    //Profil
    var pointsP = {'values':[]};
    var pointSizeP = 4;
    var imgP = document.getElementById('linien_img3');
    var cP = document.getElementById("lines3");
    var ctxP = cP.getContext("2d");

    // Warte bis Profil-Bild geladen ist
    imgP.onload = function() {
        ctxP.canvas.width = imgP.naturalWidth;
        ctxP.canvas.height = imgP.naturalHeight;
        console.log("Profil Canvas initialisiert:", ctxP.canvas.width, ctxP.canvas.height);
    };

    if (imgP.complete) {
        ctxP.canvas.width = imgP.naturalWidth;
        ctxP.canvas.height = imgP.naturalHeight;
    }

    // ========================================
    // HAUPTFUNKTION: Lösungen anzeigen Button
    // ========================================
    $(document).on("click", "#value_btn", function (e) {
        let err = 0;
        let inputs = document.getElementsByTagName("input");

        for (let i = 0; i < inputs.length; i++) {
            if(inputs[i].value.length <= 0){
                if($($(inputs[i]).parent(".input_cont")[0]).hasClass("grey") || $($(inputs[i]).is(":disabled"))){
                    continue;
                } else {
                    alert("Bitte alle Felder ausfüllen!");
                    err = 1;
                    break;
                }
            }
        }

        if(err === 0){
            let fallId = window.location.hash.substring(1).split("-")[0];
            let obj = { id: fallId };
            let post_data = JSON.stringify(obj);

            // Hole nur Musterlösungen
            $.ajax({
                type: "POST",
                url: 'php/getValues.php',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: post_data,
                success: function (musterloesung) {
                    displaySolutions(musterloesung, fallId);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("Fehler beim Laden der Musterlösung:", xhr.status, thrownError);
                }
            });
        }
    });

    // ========================================
    // NUR MUSTERLÖSUNGEN ANZEIGEN
    // ========================================
    function displaySolutions(musterloesung, fallId) {
        let profilContainer = null;
        let profilValues = [];

        let nasolabialContainer = null;
        let nasolabialValues = [];

        // Erstelle Map für schnellen Zugriff
        let musterlösungMap = {};
        musterloesung.forEach(item => {
            musterlösungMap[item.input_id] = item.value;
        });

        // Verarbeite jedes Feld
        for (let i = 0; i < musterloesung.length; i++) {
            let res = musterloesung[i];
            let id = "#" + res.input_id;

            // Spezialbehandlung für Gesichtsprofil
            if (res.input_id === "gesichtsprofil_expl" || res.input_id === "gesichtsprofil_winkel") {
                profilValues.push(res.value);

                if (!profilContainer) {
                    profilContainer = $('<div class="loesung_profil_container"></div>');
                    $(id).parent(".input_cont").after(profilContainer);
                }
            }
            // Spezialbehandlung für Nasolabialwinkel
            else if (res.input_id === "nasolabialwinkel_expl" || res.input_id === "nasolabialwinkel_winkel") {
                nasolabialValues.push(res.value);

                if (!nasolabialContainer) {
                    nasolabialContainer = $('<div class="loesung_nasolabial_container"></div>');
                    $(id).parent(".input_cont").after(nasolabialContainer);
                }
            }
            // Standardfall für andere Felder - NUR Musterlösung
            else {
                $(id).parent(".input_cont").after(
                    `<div id="${res.input_id}" class="loesung_cont">
                        <div class="loesung">
                            <strong>Musterlösung:</strong> ${res.value}
                        </div>
                    </div>`
                );
            }
        }

        // Gesichtsprofil zusammenfassen
        if (profilValues.length > 0) {
            let output = profilValues.join(', ');

            profilContainer.html(
                `<div class="loesung">
                    <strong>Musterlösung:</strong> ${output}
                </div>`
            );
        }

        // Nasolabialwinkel zusammenfassen
        if (nasolabialValues.length > 0) {
            let output = nasolabialValues.join(', ');

            nasolabialContainer.html(
                `<div class="loesung">
                    <strong>Musterlösung:</strong> ${output}
                </div>`
            );
        }

        // Lade und zeige Musterlösungen für Zeichnungen
        getenfaceResult();
        getprofilResult();

        // Deaktiviere Canvas-Interaktion
        disableCanvasInteraction();

        $("#next_btn").removeClass("inactive");
        $("#value_btn").addClass("inactive");
    }

    // ========================================
    // CANVAS-INTERAKTION DEAKTIVIEREN
    // ========================================
    function disableCanvasInteraction() {
        // Enface Canvas deaktivieren
        const enfaceZoomTarget = document.getElementById("zoom_target1");
        const enfaceControls = document.querySelector(".lines_container .zoom_controls");
        const enfaceAuswahl = document.querySelector(".lines_container").closest(".image_line_container").querySelector(".auswahl");

        if (enfaceZoomTarget) {
            enfaceZoomTarget.style.pointerEvents = "none";
            enfaceZoomTarget.style.opacity = "0.8";
        }
        if (enfaceControls) {
            enfaceControls.style.display = "none";
        }
        if (enfaceAuswahl) {
            enfaceAuswahl.style.display = "none";
        }

        // Profil Canvas deaktivieren
        const profilZoomTarget = document.getElementById("zoom_target3");
        const profilControls = document.querySelector(".lines_container3 .zoom_controls");
        const profilAuswahl = document.querySelector(".lines_container3").closest(".image_line_container").querySelector(".auswahl");
        const deleteBtn = document.getElementById("delete-btn-profil");

        if (profilZoomTarget) {
            profilZoomTarget.style.pointerEvents = "none";
            profilZoomTarget.style.opacity = "0.8";
        }
        if (profilControls) {
            profilControls.style.display = "none";
        }
        if (profilAuswahl) {
            profilAuswahl.style.display = "none";
        }
        if (deleteBtn) {
            deleteBtn.style.display = "none";
        }

        console.log("Canvas-Interaktion deaktiviert");
    }

    // ========================================
    // ENFACE ZEICHNUNGSFUNKTIONEN (MUSTERLÖSUNG)
    // ========================================
    function getenfaceResult(){
        console.log("Lade Enface Musterlösung...");
        console.log("Canvas-Größe:", ctx.canvas.width, ctx.canvas.height);

        // Hole die Fall-ID aus der URL
        let fallId = window.location.hash.substring(1).split("-")[0];
        let musterlösungFile = "eingabe/enface" + fallId + ".json";

        console.log("Lade Musterlösung aus:", musterlösungFile);

        return (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'cache': false,
                'url': musterlösungFile,
                'dataType': "json",
                'success': function (data) {
                    console.log("Enface Musterlösung geladen:", data);
                    points = data;
                    showAllPointsEnface();
                },
                'error': function(xhr, status, error) {
                    console.error("Fehler beim Laden der Enface-Musterlösung:", error);
                    console.error("Versuchte Datei:", musterlösungFile);
                }
            });
        })();
    }

    function showAllPointsEnface() {
        // Canvas NICHT leeren - Studentenzeichnung bleibt sichtbar
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        let point_arr = points.values;

        // Zeige alle Musterlösungs-Punkte in GRÜN an
        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];
            ctx.fillStyle = "#67ff18";
            ctx.beginPath();
            ctx.arc(getXAbsolute(objp.x), getYAbsolute(objp.y), pointSize, 0, Math.PI * 2, true);
            ctx.fill();
        }

        // Zeichne Linien zwischen den Punkten
        drawLinesBetweenPoints();

        // Zeichne horizontale Linien von jedem Punkt aus
        drawHorizontalLines();
    }

    function drawLinesBetweenPoints() {
        let point_arr = points.values;

        // Gesamtlänge berechnen
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

        // Zeichne Linien und berechne prozentuale Länge
        for (let i = 0; i < point_arr.length - 1; i++) {
            let start = point_arr[i];
            let end = point_arr[i + 1];

            let startX = getXAbsolute(start.x);
            let startY = getYAbsolute(start.y);
            let endX = getXAbsolute(end.x);
            let endY = getYAbsolute(end.y);

            let distance = calculateDistance(startX, startY, endX, endY);
            let percentage = ((distance / totalDistance) * 100).toFixed(2);

            // Linie zeichnen
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#67ff18';
            ctx.stroke();

            // Prozentsatz anzeigen
            let midX = (startX + endX) / 2;
            let midY = (startY + endY) / 2;
            ctx.fillStyle = "#67ff18";
            ctx.font = "30px Arial";
            ctx.fillText(`${percentage}%`, midX + 5, midY - 5);
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
            ctx.lineTo(ctx.canvas.width, startY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#67ff18';
            ctx.stroke();
        }
    }

    function getXPercent(x) {
        return (x / ctx.canvas.width) * 100;
    }

    function getYPercent(y) {
        return (y / ctx.canvas.height) * 100;
    }

    function getXAbsolute(xpercent) {
        return (ctx.canvas.width * xpercent) / 100;
    }

    function getYAbsolute(ypercent) {
        return (ctx.canvas.height * ypercent) / 100;
    }

    // ========================================
    // PROFIL ZEICHNUNGSFUNKTIONEN (MUSTERLÖSUNG)
    // ========================================
    function getprofilResult() {
        console.log("Lade Profil Musterlösung...");
        console.log("Profil Canvas-Größe:", ctxP.canvas.width, ctxP.canvas.height);

        // Hole die Fall-ID aus der URL
        let fallId = window.location.hash.substring(1).split("-")[0];
        let musterlösungFile = "eingabe/profil" + fallId + ".json";

        console.log("Lade Profil-Musterlösung aus:", musterlösungFile);

        $.ajax({
            'async': false,
            'global': false,
            'cache': false,
            'url': musterlösungFile,
            'dataType': "json",
            'success': function (data) {
                console.log("Profil Musterlösung geladen:", data);
                pointsP = data;
                showAllPointsProfil();
            },
            'error': function(xhr, status, error) {
                console.error("Fehler beim Laden der Profil-Musterlösung:", error);
                console.error("Versuchte Datei:", musterlösungFile);
            }
        });
    }

    function showAllPointsProfil() {
        // Canvas NICHT leeren - Studentenzeichnung bleibt sichtbar
        // ctxP.clearRect(0, 0, ctxP.canvas.width, ctxP.canvas.height);

        let point_arr = pointsP.values;

        // Zeichne Musterlösungen in GRÜN darüber
        for (let i = 0; i < point_arr.length; i++) {
            let objp = point_arr[i];

            if (objp.type === 'line') {
                let start = objp.start;
                let end = objp.end;
                drawLineP(start, end, "#67ff18");
            } else if (objp.type === 'angle') {
                drawAngleP(objp.points, "#67ff18");
            } else {
                ctxP.fillStyle = "#67ff18";
                ctxP.beginPath();
                ctxP.arc(getXAbsoluteP(objp.x), getYAbsoluteP(objp.y), pointSizeP, 0, Math.PI * 2, true);
                ctxP.fill();
            }
        }
    }

    function drawLineP(start, end, color) {
        ctxP.beginPath();
        ctxP.moveTo(getXAbsoluteP(start.x), getYAbsoluteP(start.y));
        ctxP.lineTo(getXAbsoluteP(end.x), getYAbsoluteP(end.y));
        ctxP.strokeStyle = color;
        ctxP.lineWidth = 2;
        ctxP.stroke();

        ctxP.fillStyle = color;
        ctxP.beginPath();
        ctxP.arc(getXAbsoluteP(start.x), getYAbsoluteP(start.y), 3, 0, Math.PI * 2, true);
        ctxP.fill();
        ctxP.closePath();

        ctxP.beginPath();
        ctxP.arc(getXAbsoluteP(end.x), getYAbsoluteP(end.y), 3, 0, Math.PI * 2, true);
        ctxP.fill();
        ctxP.closePath();
    }

    function drawAngleP(points, color) {
        for (let i = 0; i < points.length - 1; i++) {
            drawLineP(points[i], points[i + 1], color);
        }

        const angle = calculateAngleP(points[0], points[1], points[2]);
        displayAngleP(angle, points[1], color);
    }

    function calculateAngleP(p1, p2, p3) {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

        const dotProduct = v1.x * v2.x + v1.y * v2.y;
        const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
        const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

        const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));
        return (angleRad * 180) / Math.PI;
    }

    function displayAngleP(angle, point, color) {
        const absX = getXAbsoluteP(point.x);
        const absY = getYAbsoluteP(point.y);

        ctxP.fillStyle = color;
        ctxP.font = "14px Arial";
        ctxP.fillText(angle.toFixed(2) + "°", absX + 10, absY - 10);
    }

    function getXPercentP(x) {
        return (x / ctxP.canvas.width) * 100;
    }

    function getYPercentP(y) {
        return (y / ctxP.canvas.height) * 100;
    }

    function getXAbsoluteP(xpercent) {
        return (ctxP.canvas.width * xpercent) / 100;
    }

    function getYAbsoluteP(ypercent) {
        return (ctxP.canvas.height * ypercent) / 100;
    }

});