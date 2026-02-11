$(document).ready(function () {

    // Hole identifier aus URL-Parameter
    const urlParams = new URLSearchParams(window.location.search);
    const identifier = urlParams.get('identifier') || '';

    console.log("Identifier aus URL:", identifier);

    $(document).on("click", ".blue_case", function(e) {

        const fallId = $(e.target).attr("data-id");

        // Baue die URL mit identifier im Hash
        let link = "step_fall.html#" + fallId;

        // Füge identifier hinzu, falls vorhanden
        if (identifier) {
            link += "-" + identifier;
        }

        console.log("Navigiere zu:", link);
        window.location.href = link;
    });

});