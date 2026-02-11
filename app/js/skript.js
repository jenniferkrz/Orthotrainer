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

    // Event-Handler für "Los geht's" Button
    $("#start_btn").on("click", function() {
        let targetUrl = "index.html";

        // Wenn identifier vorhanden ist, als URL-Parameter anhängen
        if (identifier) {
            targetUrl += "?identifier=" + encodeURIComponent(identifier);
        }

        console.log("Navigiere zu:", targetUrl);
        window.location.href = targetUrl;
    });

});