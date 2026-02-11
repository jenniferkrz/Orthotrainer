$(document).ready(function () {

    $(document).on("click","#start_btn",function(e) {
        e.preventDefault();

        // Hole den eingegebenen Identifier
        let identifier = document.getElementById("identifier").value;

        // Hole Gruppe (falls ausgewählt, sonst "x")
        let group;
        if ($('input[name=gruppe]:checked').length <= 0) {
            group = "x";
        } else {
            group = document.querySelector('input[name="gruppe"]:checked').value;
        }

        // Falls kein Identifier eingegeben wurde, setze "x"
        if(identifier.length <= 1){
            identifier = "x";
        }

        // Generiere eine eindeutige Result-ID
        function makeid(length) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result;
        }
        let result_id = makeid(10);

        console.log("Identifier:", identifier);
        console.log("Group:", group);
        console.log("Result ID:", result_id);

        // Baue den vollständigen Identifier (result_id-group-identifier)
        let fullIdentifier = result_id + "-" + group + "-" + identifier;

        // Leite zur index.html mit identifier Parameter weiter
        let link = "welcome.php?identifier=" + encodeURIComponent(fullIdentifier);

        console.log("Navigiere zu:", link);
        window.location.href = link;
    });

});