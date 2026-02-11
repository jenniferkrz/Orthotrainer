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
        window.location.href = link;
    });

    $(document).on("click","#next_btn_end",function(e) {
        let link = $(e.target).attr("data-href") + "#" + fall + "-" + res;
        window.location.href = link;
    });

});