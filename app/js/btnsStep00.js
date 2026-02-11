$(document).ready(function () {

    // Parse den Hash korrekt
    const hash = window.location.hash.substring(1);
    const hashParts = hash.split("-");

    const fall = hashParts[0];
    const res = hashParts[1];
    const group = hashParts[2];
    // Alles ab Index 3 ist der identifier
    const identifier = hashParts.slice(3).join("-");

    console.log("Fall:", fall);
    console.log("Res:", res);
    console.log("Group:", group);
    console.log("Identifier:", identifier);

    $(document).on("click",".step_container",function(e) {

        let link = $(e.target).attr("data-href") + "#" + fall;

        window.location.href = link;

    });

    $(document).on("click","#next_btn",function(e) {

        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res + "-" + group + "-" + identifier;

        saveValues(link);
        //window.location.href = link;
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

        // Sammle Radio-Button-Gruppen
        let radioGroups = {};

        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];

            if (input.type === "radio") {
                // Radio-Button: nur speichern wenn checked
                if (!input.name) continue; // Überspringe Radio-Buttons ohne name

                if (!radioGroups[input.name]) {
                    radioGroups[input.name] = [];
                }
                radioGroups[input.name].push(input);
            } else {
                // Andere Input-Typen (text, number, etc.)
                if (input.id) {
                    obj[input.id] = input.value;
                }
            }
        }

        // Verarbeite Radio-Button-Gruppen
        for (let groupName in radioGroups) {
            let radios = radioGroups[groupName];
            let checkedRadio = radios.find(r => r.checked);

            // Speichere unter dem group-Namen (name-Attribut)
            obj[groupName] = checkedRadio ? checkedRadio.value : "";
        }

        // Textareas hinzufügen
        for (let i = 0; i < textareas.length; i++) {
            let input = textareas[i];
            if (input.id) {
                obj[input.id] = input.value;
            }
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
                    window.location.href = link;
                }else{
                    console.log(result);
                    //alert("Leider ist ein Fehler aufgetreten, bitte Seite neu laden.")
                }
            },
            error:  function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });

    }


});