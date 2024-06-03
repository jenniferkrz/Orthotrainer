$(document).ready(function () {

    var points;
    var pointSize = 10;

    var canvas_ready = false;
    var point1 = { x: 0, y: 0, full: false, index: -1, name: 0 };
    var point2 = { x: 0, y: 0, full: false, index: -1, name: 0 };


    var img = document.getElementById('image');
    var width = img.clientWidth;
    var height = img.clientHeight;

    var type = "";
    var fromXY, toXY;

    c = document.getElementById("canvas");
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    //$("#up").css("width", width);

    console.log(width);
    console.log(height);

    loadPoints();


    function loadPoints() {
        return (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'url': "../fall.json",
                'dataType': "json",
                'success': function (data) {
                    points = data;
                    let arr = data.values;
                    for (let i = 0; i < arr.length; i++) {
                        let obj = arr[i];
                        let x = obj.x;
                        let y = obj.y;
                        let x2 = obj.x2;
                        let y2 = obj.y2;
                        let type = obj.type;
                        let name = obj.name;

                        if (x !== 0 && y !== 0) {
                            $("#liste").append("<div class='point checked' data-index='" + i + "' data-x1='" + x + "' data-y1='" + y + "' data-x2='" + x2 + "'data-y2='" + y2 + "' data-type='" + type + "'>" + name + "<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i></div>");
                        } else {
                            $("#liste").append("<div class='point' data-index='" + i + "' data-x1='" + x + "' data-y1='" + y + "' data-x2='" + x2 + "'data-y2='" + y2 + "' data-type='" + type + "''>" + name + "<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i></div>");
                        }

                    }

                }
            });
        })();
    }

    $("body").on("click", ".point", function (e) {

        ctx.clearRect(0, 0, width, height);
        $("#anzeige").removeClass("inactive");
        $(".point").removeClass("active");
        $(this).addClass("active");

        if ($(this).attr("data-type") === 'line') {
            ctx.strokeStyle = "#18ceff"; // Blue color
            ctx.lineWidth = 4;
            ctx.beginPath(); // Start a new path
            ctx.moveTo($(this).attr("data-x1"), $(this).attr("data-y1")); // Move the pen to (30, 50)
            ctx.lineTo($(this).attr("data-x2"), $(this).attr("data-y2")); // Draw a line to (150, 100)
            ctx.stroke(); // Render the path

            point1.index = $(this).attr("data-index");
            point1.name = $(this).html().split("<")[0];
            point1.type = $(this).attr("data-type");
            type = 'line';
            c.onclick = clickHandler;
            c.onmousemove = moveHandler;
            reset();

        } else {
            ctx.fillStyle = "#18ceff"; // Blue color
            ctx.beginPath();
            ctx.arc($(this).attr("data-x1"), $(this).attr("data-y1"), pointSize, 0, Math.PI * 2, true);
            ctx.fill();
            $("#x1").html($(this).attr("data-x1"));
            $("#y1").html($(this).attr("data-y1"));

            canvas_ready = true;

            point1.index = $(this).attr("data-index");
            point1.name = $(this).html().split("<")[0];
            point1.type = $(this).attr("data-type");

            c.onclick = null;
            c.onmousemove = null;


            type = 'point';

        }

    });


    $("#show").click(function (e) {
        console.log("show");
        if ($("#show").hasClass("active")) {
            ctx.clearRect(0, 0, width, height);
            $("#show").removeClass("active");

        } else {
            ctx.clearRect(0, 0, width, height);
            $(".point").removeClass("active");
            $("#x1").html("");
            $("#y1").html("");
            $("#anzeige").addClass("inactive");
            console.log(points.values);
            let point_arr = points.values;
            for (let i = 0; i < point_arr.length; i++) {
                let obj = point_arr[i];
                console.log(obj.type);

                if (obj.type === 'line') {
                    ctx.strokeStyle = "#18ceff"; // Blue color
                    ctx.lineWidth = 4;
                    ctx.beginPath(); // Start a new path
                    ctx.moveTo(obj.x, obj.y); // Move the pen to (30, 50)
                    ctx.lineTo(obj.x2, obj.y2); // Draw a line to (150, 100)
                    ctx.stroke(); // Render the path

                } else {
                    let obj = point_arr[i];
                    ctx.fillStyle = "#18ceff"; // Blue color
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, pointSize, 0, Math.PI * 2, true);
                    ctx.fill();
                }


            }
            $("#show").addClass("active");
            point1.full = false;
            point1.index = -1;
        }

    });

    $("#neu").click(function (e) {
        canvas_ready = true;
        document.body.style.cursor = 'crosshair';
        $("#x1").html("");
        $("#x2").html("");
        $("#y1").html("");
        $("#y2").html("");
        $("#anzeige").removeClass("inactive");
        ctx.clearRect(0, 0, width, height);
        $(".point").removeClass("active");
    });


    $("#canvas").click(function (e) {
        console.log("click");
        if (canvas_ready) {
            getPosition(e);
        }
    });


    function getPosition(event) {

        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        drawCoordinates(x, y);

    }



    function drawCoordinates(x, y) {

        if (type === 'point')  {
            var ctx = document.getElementById("canvas").getContext("2d");
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = "#ff2626"; // Red color

            ctx.beginPath();
            ctx.arc(x, y, pointSize, 0, Math.PI * 2, true);
            ctx.fill();

            $("#x1").html(x);
            $("#y1").html(y);
            point1.x = x;
            point1.y = y;
            point1.full = true;
        }
    }


    $("#save").click(function (e) {
        let x1 = $("#x1").html();
        if (x1.length === 0 || x1 === "") {
            alert("Bitte Punkte markieren!");
        } else {
            saveJson();
        }


    });

    $("#delete").click(function (e) {

        let obj = {
            "value": 0,
            "name": point1.name,
            "x": 0,
            "y": 0
        };

        points.values[point1.index] = obj;
        if (point1.index !== -1) {
            $.ajax({
                type: "POST",
                url: "../writeJson.php",
                data: {
                    json: JSON.stringify(points)
                },
                success: function () {
                    ctx.clearRect(0, 0, width, height);
                    window.location.reload();
                }
            });
        }


    });

    function saveJson() {

        console.log(point1);

        let obj = {
            "name": point1.name,
            "type": point1.type,
            "x": point1.x,
            "y": point1.y,
            "x2": point2.x,
            "y2": point2.y
        };

        points.values[point1.index] = obj;

        console.log(points);

        $.ajax({
            type: "POST",
            url: "../writeJson.php",
            data: {
                json: JSON.stringify(points)
            },
            success: function (data) {
                console.log(data);
                ctx.clearRect(0, 0, width, height);
                window.location.reload(true);
            }
        });

    }

    function reset() {
        fromXY = {};
        toXY = {};
    }

    function moveHandler(e) {
        if (typeof fromXY.x !== "undefined") {
            toXY.x = e.clientX;
            toXY.y = e.clientY;
            draw();
        }
    }

    function draw() {
        clear();
        ctx.beginPath();
        ctx.moveTo(fromXY.x, fromXY.y);
        ctx.lineTo(toXY.x, toXY.y);
        ctx.stroke();
        ctx.closePath();



    }

    function moveHandler(e) {
        if (typeof fromXY.x !== "undefined") {
            toXY.x = e.clientX;
            toXY.y = e.clientY;
            draw();
        }
    }

    function clickHandler(e) {
        if (typeof fromXY.x === "undefined") {
            fromXY.x = e.clientX;
            fromXY.y = e.clientY;
        } else {
            console.log(fromXY);
            console.log(toXY);

            $("#x1").html(fromXY.x);
            $("#y1").html(fromXY.y);
            $("#x2").html(toXY.x);
            $("#y2").html(toXY.y);
            point1.x = fromXY.x;
            point1.y = fromXY.y;
            point2.x = toXY.x;
            point2.y = toXY.y;
            point1.full = true;
            reset();
        }
    }
    function clear() {
        ctx.clearRect(0, 0, c.width, c.height);
    }
});