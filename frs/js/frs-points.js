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
                'url': "../frs1.json",
                'dataType': "json",
                'success': function (data) {
                    points = data;
                    let arr = data.values;
                    for (let i = 0; i < arr.length; i++) {
                        let obj = arr[i];
                        console.log(obj);
                        let x = obj.x;
                        let y = obj.y;
                        let name = obj.name;

                        $("#liste").append("<div class='point' data-index='" + i + "' data-x1='" + x + "' data-y1='" + y + "'>" + name + "<i class=\"fa fa-check-circle-o\" aria-hidden=\"true\"></i></div>");


                    }
                }
            });
        })();
    }


    $("#canvas").click(function (e) {
        console.log("click");
        getPosition(e);

    });


    function getPosition(event) {
        console.log(event);
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        console.log(x);
        console.log(y);

        checkCoordinates(x, y);
    }

    function checkCoordinates(x, y) {
        let point_arr = points.values;
        for (let i = 0; i < point_arr.length; i++) {
            let obj = point_arr[i];
            let px = obj.x;
            let py = obj.y;
            let name = obj.name;

            if(px <= x + 20 && px >= x -20){
                if(py <= y + 20 && py >= y -20){
                    console.log("YAY");
                    ctx.fillStyle = "#ff2626"; // Red color
                    ctx.beginPath();
                    ctx.arc(px, py, pointSize, 0, Math.PI * 2, true);
                    ctx.fill();

                    let liste = $(".point");
                    console.log(liste);
                    console.log($(liste[i]).html());
                    $(liste[i]).addClass("checked");
                }
            }


        }

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
                url: "writeJson.php",
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


        //points.values.push(obj);

        $.ajax({
            type: "POST",
            url: "writeJson.php",
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

