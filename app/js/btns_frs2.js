$(document).ready(function () {
    console.log("XXX");

    // Parse den Hash nur EINMAL
    const hash = window.location.hash.substring(1);
    const hashParts = hash.split("-");

    const fall = hashParts[0];
    const res = hashParts[1];
    const group = hashParts[2];
    const identifier = hashParts.slice(3).join("-"); // Alles ab Index 3

    console.log("Parsed - Fall:", fall, "Res:", res, "Group:", group, "Identifier:", identifier);

    $(document).on("click",".step_container",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall;
        window.location.href = link;
    });

    $(document).on("click","#next_btn",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res + "-" + group + "-" + identifier;
        saveValues(link);
        // NICHT hier redirecten - das passiert nach erfolgreichem AJAX!
    });

    $(document).on("click","#next_btn_end",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res;
        window.location.href = link;
    });

    function saveValues(link){
        let inputs = document.getElementsByTagName("input");
        let textareas = document.getElementsByTagName("textarea");

        console.log(inputs);
        console.log(textareas);

        let obj = {};
        obj["fall_id"] = fall;
        obj["result_id"] = res;
        obj["gruppe"] = group;
        obj["identifier"] = identifier;

        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            obj[input.id] = input.value;
        }
        for (let i = 0; i < textareas.length; i++) {
            let input = textareas[i];
            obj[input.id] = input.value;
        }
        console.log(obj);
        let post_data = JSON.stringify(obj);
        console.log(post_data);

        $.ajax({
            type: "POST",
            url: 'js/saveValues.php',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: post_data,
            success: function (result) {
                console.log(result);
                if(result === "Inserted"){
                    window.location.href = link;  // ✅ NUR HIER der Redirect
                }else{
                    console.log(result);
                    alert("Leider ist ein Fehler aufgetreten, bitte Seite neu laden.");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });
    }
});