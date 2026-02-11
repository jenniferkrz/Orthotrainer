$(document).ready(function () {

    // Hole identifier aus URL-Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const identifier = urlParams.get('identifier') || '';

    console.log("Identifier aus URL:", identifier);

    // Wenn kein identifier vorhanden ist, zur start.html weiterleiten
    if (!identifier) {
        console.log("Kein identifier gefunden, leite zu start.html um");
        window.location.href = "start.html";
        return;
    }

    // Funktion zur Generierung einer eindeutigen Result-ID
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

    $(document).on("click", ".blue_case", function(e) {

        const fallId = $(e.target).attr("data-id");

        // Generiere eine neue Result-ID für diesen Fall
        let result_id = makeid(10);

        console.log("Fall ID:", fallId);
        console.log("Generierte Result ID:", result_id);

        // Baue die URL mit result_id, fallId und identifier
        let link = "step_fall.html#" + fallId;

        // Füge result_id, Gruppe x und identifier hinzu
        link += "-" + result_id + "-" + "x-" + identifier;

        console.log("Navigiere zu:", link);
        window.location.href = link;
    });

});