$(document).ready(function () {

    var points;
    var pointSize = 5;

    var canvas_ready = false;
    var point1 = {x: 0, y: 0, full: false, index: -1, name: 0};

    var img = document.getElementById('image');
    var width = img.clientWidth;
    var height = img.clientHeight;


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
                        let name = obj.name;

                        if(x !== 0 && y !== 0){
                            $("#liste").append("<div class='point checked' data-index='" + i + "' data-x1='" + x + "' data-y1='" + y + "'>" + name + "<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i></div>");
                        }else{
                            $("#liste").append("<div class='point' data-index='" + i + "' data-x1='" + x + "' data-y1='" + y + "'>" + name + "<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i></div>");
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


        ctx.beginPath();
        ctx.arc($(this).attr("data-x1"), $(this).attr("data-y1"), pointSize, 0, Math.PI * 2, true);
        ctx.fill();


        $("#x1").html($(this).attr("data-x1"));
        $("#y1").html($(this).attr("data-y1"));

        canvas_ready = true;

        point1.index = $(this).attr("data-index");
        point1.name = $(this).html().split("<")[0];
    });


    $("#show").click(function (e) {
        if ($("#show").hasClass("active")) {
            ctx.clearRect(0, 0, width, height);
            $("#show").removeClass("active");

        } else {
            ctx.clearRect(0, 0, width, height);
            $(".point").removeClass("active");
            $("#x1").html("");
            $("#y1").html("");
            $("#anzeige").addClass("inactive");
            let point_arr = points.values;
            for (let i = 0; i < point_arr.length; i++) {
                let obj = point_arr[i];
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, pointSize, 0, Math.PI * 2, true);
                ctx.fill();

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
        console.log(event);
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        console.log(x);
        console.log(y);

        drawCoordinates(x, y);
    }

    function drawCoordinates(x, y) {

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
            "x": point1.x,
            "y": point1.y
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
                //window.location.reload();
            }
        });

    }
});