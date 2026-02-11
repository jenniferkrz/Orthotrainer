$(document).ready(function() {

    console.log("logoNavigation.js geladen");

    // Fange Logo-Klick ab
    $(document).on("click", "#logo", function(e) {
        e.preventDefault();

        // Versuche identifier aus Hash zu holen (z.B. #7-Lbyr6rM0GV-x-hj-test-ident)
        const hash = window.location.hash.substring(1);
        const hashParts = hash.split("-");

        let identifier = '';

        // Wenn Hash mindestens 4 Teile hat: fallId-resultId-gruppe-identifier
        if (hashParts.length >= 4) {
            // Überspringe die ersten 3 Teile (fallId, resultId und gruppe)
            // Nimm alles ab Teil 3 (nur identifier)
            identifier = hashParts.slice(3).join("-");
        }
        // Alternativ: Versuche identifier aus URL-Parameter zu holen
        else {
            const urlParams = new URLSearchParams(window.location.search);
            identifier = urlParams.get('identifier') || '';
        }

        console.log("Extrahierter identifier:", identifier);

        // Navigiere zur index.php
        if (identifier) {
            window.location.href = "index.php?identifier=" + encodeURIComponent(identifier);
        } else {
            // Falls kein identifier gefunden wurde, gehe zu start.html
            window.location.href = "start.html";
        }
    });

});