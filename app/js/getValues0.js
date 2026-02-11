$(document).ready(function () {

    var jsonLines = {};

    //Canvas 1
    var cursorX1;
    var cursorY1;
    var canvas1 = document.getElementById("lines1"); //canvas, context, other vars etc
    var ctx1 = canvas1.getContext("2d");
    var img1 = document.getElementById('linien_img1');

    var width1 = img1.clientWidth;
    var height1 = img1.clientHeight;
    ctx1.canvas.width = width1;
    ctx1.canvas.height = height1;

    var firstClick1 = [0,0];
    var line_counter1 = 1;
    var lines1 = [];
    var from1 = [0,0];
    var to1 = [0,0];
    var intervalLoop1 = null;

    //Canvas 2
    var cursorX2;
    var cursorY2;
    var canvas2 = document.getElementById("lines2"); //canvas, context, other vars etc
    var ctx2 = canvas2.getContext("2d");
    var img2 = document.getElementById('linien_img2');

    var width2 = img2.clientWidth;
    var height2 = img2.clientHeight;
    ctx2.canvas.width = width2;
    ctx2.canvas.height = height2;

    var firstClick2 = [0,0];
    var line_counter2 = 1;
    var lines2 = [];
    var from2 = [0,0];
    var to2 = [0,0];
    var intervalLoop2 = null;

    //Canvas 3
    var cursorX3;
    var cursorY3;
    var canvas3 = document.getElementById("lines3"); //canvas, context, other vars etc
    var ctx3 = canvas3.getContext("2d");
    var img3 = document.getElementById('linien_img3');

    var width3 = img3.clientWidth;
    var height3 = img3.clientHeight;
    ctx3.canvas.width = width3;
    ctx3.canvas.height = height3;

    var firstClick3 = [0,0];
    var line_counter3 = 1;
    var lines3 = [];
    var from3 = [0,0];
    var to3 = [0,0];
    var intervalLoop3 = null;


    init();

    //Canvas 1

    function startDragLine1(e) {
        let rect1 = canvas1.getBoundingClientRect();
        let x = event.clientX - rect1.left;
        let y = event.clientY - rect1.top;
        firstClick1 = [x, y];
        console.log(firstClick1);

        //start the loop
        intervalLoop1 = setInterval(function(){
            ctx1.clearRect(0, 0, width1, height1);

            if(cursorX1 <= width1 && cursorX1 >= 0 && cursorY1 <= height1 && cursorY1 >= 0){
                console.log("if1");
                ctx1.beginPath();
                ctx1.moveTo(firstClick1[0], firstClick1[1]);
                ctx1.lineTo(cursorX1, cursorY1, 6);
                ctx1.lineWidth = 4;
                ctx1.strokeStyle = '#18ceff';
                ctx1.stroke();
                from1 = [firstClick1[0], firstClick1[1]];
                to1 = [cursorX1, cursorY1];
            }else{
                stopDragLine1();
            }
        },10);
    }
    function stopDragLine1(){
        clearInterval(intervalLoop1);
        let name = "Linie " + line_counter1;
        line_counter1++;

        let lineobj = {name: name, fromx: from1[0], fromy:from1[1] , tox:to1[0] , toy:to1[1]};
        lines1.push(lineobj);
        showAllLines1();
    }

    function init() {
        console.log("init");
        var rect1 = canvas1.getBoundingClientRect();
        var rect2 = canvas2.getBoundingClientRect();
        var rect3 = canvas3.getBoundingClientRect();



        document.onmousemove = function(e){
            cursorX1 = e.pageX - rect1.left;
            cursorY1 = e.pageY - rect1.top;
            cursorX2 = e.pageX - rect2.left;
            cursorY2 = e.pageY - rect2.top;
            cursorX3 = e.pageX - rect3.left;
            cursorY3 = e.pageY - rect3.top;
        };
        canvas1.addEventListener('mousedown', startDragLine1, false);
        canvas1.addEventListener('mouseup', stopDragLine1, false);
        canvas2.addEventListener('mousedown', startDragLine2, false);
        canvas2.addEventListener('mouseup', stopDragLine2, false);
        canvas3.addEventListener('mousedown', startDragLine3, false);
        canvas3.addEventListener('mouseup', stopDragLine3, false);

    }

    function showAllLines1(){
        console.log(lines1);
        ctx1.clearRect(0, 0, width1, height1);
        let html = "";
        for (let i = 0; i < lines1.length; i++) {
            ctx1.strokeStyle = "#18ceff";
            ctx1.fillStyle = "#18ceff";
            ctx1.lineWidth = 4;
            ctx1.beginPath(); // Start a new path
            ctx1.moveTo(lines1[i].fromx, lines1[i].fromy); // Move the pen to (30, 50)
            ctx1.lineTo(lines1[i].tox, lines1[i].toy); // Draw a line to (150, 100)
            ctx1.stroke(); // Render the path
            let kurz = "Linie " + i;
            ctx1.font = "12px Arial";
            ctx1.fillText(lines1[i].name, lines1[i].fromx + 5, lines1[i].fromy + 20);

            let txt = "<div class='line_txt'><div class='ltext'>"+lines1[i].name+"</div><div class='delete-line' data-id='"+i+"'><i data-id='"+i+"' class='fa fa-trash' aria-hidden='true'></i></div></div>";
            html = html + txt;
        }
        $("#liste1").html(html);
    }

    $("body").on("click", ".delete-line", function (e) {
        console.log(e.target);
        let array_index = $(e.target).data("id");
        console.log(array_index);

        lines1.splice(array_index, 1);
        showAllLines1();


    });

    //Canvas 2

    function startDragLine2(e) {
        console.log("2");
        let rect = canvas2.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        firstClick2 = [x, y];

        //start the loop
        intervalLoop2 = setInterval(function(){
            ctx2.clearRect(0, 0, width2, height2);
            if(cursorX2 <= ctx2.canvas.width && cursorX2 >= 0 && cursorY2 <= ctx2.canvas.height && cursorY2 >= 0){
                ctx2.beginPath();
                ctx2.moveTo(firstClick2[0], firstClick2[1]);
                ctx2.lineTo(cursorX2, cursorY2, 6);
                ctx2.lineWidth = 4;
                ctx2.strokeStyle = '#18ceff';
                ctx2.stroke();
                from2 = [firstClick2[0], firstClick2[1]];
                to2 = [cursorX2, cursorY2];
            }else{
                stopDragLine2();
            }
        },10);
    }
    function stopDragLine2(){
        console.log("2");

        clearInterval(intervalLoop2);
        let name = "Linie " + line_counter2;
        line_counter2++;

        let lineobj = {name: name, fromx: from2[0], fromy:from2[1] , tox:to2[0] , toy:to2[1]};

        lines2.push(lineobj);
        showAllLines2();
    }

    function showAllLines2(){
        console.log(lines2);

        console.log("2");

        ctx2.clearRect(0, 0, width2, height2);
        let html = "";
        for (let i = 0; i < lines2.length; i++) {
            ctx2.strokeStyle = "#18ceff";
            ctx2.fillStyle = "#18ceff";
            ctx2.lineWidth = 4;
            ctx2.beginPath(); // Start a new path
            ctx2.moveTo(lines2[i].fromx, lines2[i].fromy); // Move the pen to (30, 50)
            ctx2.lineTo(lines2[i].tox, lines2[i].toy); // Draw a line to (150, 100)
            ctx2.stroke(); // Render the path
            let kurz = "Linie " + i;
            ctx2.font = "12px Arial";
            ctx2.fillText(lines2[i].name, lines2[i].fromx + 5, lines2[i].fromy + 20);

            let txt = "<div class='line_txt'><div class='ltext'>"+lines2[i].name+"</div><div class='delete-line2' data-id='"+i+"'><i data-id='"+i+"' class='fa fa-trash' aria-hidden='true'></i></div></div>";
            html = html + txt;
        }
        $("#liste2").html(html);

    }

    $("body").on("click", ".delete-line2", function (e) {
        console.log("2");

        console.log(e.target);
        let array_index = $(e.target).data("id");
        console.log(array_index);

        lines2.splice(array_index, 1);
        showAllLines2();


    });

    //Canvas 3

    function startDragLine3(e) {
        console.log("3");
        let rect = canvas3.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        firstClick3 = [x, y];

        //start the loop
        intervalLoop3 = setInterval(function(){
            ctx3.clearRect(0, 0, width3, height3);
            console.log(cursorX3);
            console.log(width3);
            console.log(cursorY3);
            console.log(height3);
            if(cursorX3 <= width3 && cursorX3 >= 0 && cursorY3 <= height3 && cursorY3 >= 0){
                ctx3.beginPath();
                ctx3.moveTo(firstClick3[0], firstClick3[1]);
                ctx3.lineTo(cursorX3, cursorY3, 6);
                ctx3.lineWidth = 4;
                ctx3.strokeStyle = '#18ceff';
                ctx3.stroke();
                from3 = [firstClick3[0], firstClick3[1]];
                to3 = [cursorX3, cursorY3];
            }else{
                console.log("else3");
                stopDragLine3();
            }
        },10);
    }
    function stopDragLine3(){
        console.log("3");

        clearInterval(intervalLoop3);
        let name = "Linie " + line_counter3;
        line_counter3++;

        let lineobj = {name: name, fromx: from3[0], fromy:from3[1] , tox:to3[0] , toy:to3[1]};

        lines3.push(lineobj);
        showAllLines3();
    }

    function showAllLines3(){
        console.log("3");
        console.log(lines3);

        ctx3.clearRect(0, 0, width3, height3);
        let html = "";
        for (let i = 0; i < lines3.length; i++) {
            ctx3.strokeStyle = "#18ceff";
            ctx3.fillStyle = "#18ceff";
            ctx3.lineWidth = 4;
            ctx3.beginPath(); // Start a new path
            ctx3.moveTo(lines3[i].fromx, lines3[i].fromy); // Move the pen to (30, 50)
            ctx3.lineTo(lines3[i].tox, lines3[i].toy); // Draw a line to (150, 100)
            ctx3.stroke(); // Render the path
            let kurz = "Linie " + i;
            ctx3.font = "12px Arial";
            ctx3.fillText(lines3[i].name, lines3[i].fromx + 5, lines3[i].fromy + 20);

            let txt = "<div class='line_txt'><div class='ltext'>"+lines3[i].name+"</div><div class='delete-line3' data-id='"+i+"'><i data-id='"+i+"' class='fa fa-trash' aria-hidden='true'></i></div></div>";
            html = html + txt;
        }
        $("#liste3").html(html);

    }

    $("body").on("click", ".delete-line3", function (e) {
        console.log("3");

        console.log(e.target);
        let array_index = $(e.target).data("id");
        console.log(array_index);

        lines3.splice(array_index, 1);
        showAllLines3();

    });




    function loadResults() {
        return (function () {
            var json = null;
            $.ajax({
                'async': false,
                'global': false,
                'cache': false,
                'url': "eingabe/lines.json",
                'dataType': "json",
                'success': function (data) {
                    console.log(data);
                    jsonLines = data;

                    lines1 = data.data["0"];
                    lines2 = data.data["1"];
                    lines3 = data.data["2"];
                    console.log(lines1);
                    line_counter1 = data.data["0"].length;
                    line_counter2 = data.data["1"].length;
                    line_counter3 = data.data["2"].length;

                    showAllLines1();
                    showAllLines2();
                    showAllLines3();

                    //showAllPoints();

                }
            });
        })();
    }

    function saveJson() {

        console.log("save");

        let obj = {
            "0": lines1,
            "1": lines2,
            "2": lines3
        }
        jsonLines = {"data": obj}

        console.log(jsonLines);

        $.ajax({
            type: "POST",
            url: "writeJsonLineResults.php",
            data: {
                json: JSON.stringify(jsonLines),
                resid: JSON.stringify(window.location.hash.substring(1))

            },
            success: function (data) {
                console.log(data);
                //window.location.reload(true);

            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });
    }

    $("body").on("click", "#saveLines", function (e) {
        saveJson();

    });




    // VALUES

    $(document).on("click", "#value_btn", function (e) {

        let err = 0;
       let inputs = document.getElementsByTagName("input");
       for (let i = 0; i < inputs.length; i++) {
        if(inputs[i].value.length <= 0){
 
            if($($(inputs[i]).parent(".input_cont")[0]).hasClass("grey")){
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
                    for (let i = 0; i < result.length; i++) {
                        let res = result[i];
                        let id = "#" + res.input_id;
                        $(id).parent(".input_cont").after('<div class="loesung_cont"><div class="loesung">Musterlösung: ' + res.value + '</div></div>');
                    }
                    saveJson();
                    loadResults();
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
});



