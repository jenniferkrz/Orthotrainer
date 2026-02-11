$(document).ready(function () {

        const zoomTarget = document.getElementById("zoomTarget");
        const container = document.getElementById("container");

    window.moveModeActive = false;


        let zoomLevel = 0.8;
        const zoomStep = 0.1;
        const maxZoom = 3;
        const minZoom = 0.5;
        let offsetX = 0;
        let offsetY = 0;

        let isDragging = false;
        let startX = 0;
        let startY = 0;

        function applyTransform() {
        zoomTarget.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
        zoomTarget.style.transformOrigin = "top left";
    }

        function clampOffsets() {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const contentWidth = zoomTarget.offsetWidth * zoomLevel;
        const contentHeight = zoomTarget.offsetHeight * zoomLevel;

        const minOffsetX = containerWidth - contentWidth;
        const minOffsetY = containerHeight - contentHeight;

        offsetX = Math.min(0, Math.max(minOffsetX, offsetX));
        offsetY = Math.min(0, Math.max(minOffsetY, offsetY));
    }

        function zoomAt(mouseX, mouseY, zoomIn) {
        const relX = (mouseX - offsetX) / zoomLevel;
        const relY = (mouseY - offsetY) / zoomLevel;

        const newZoomLevel = zoomIn
        ? Math.min(maxZoom, zoomLevel + zoomStep)
        : Math.max(minZoom, zoomLevel - zoomStep);

        if (newZoomLevel === zoomLevel) return;

        zoomLevel = newZoomLevel;

        offsetX = mouseX - relX * zoomLevel;
        offsetY = mouseY - relY * zoomLevel;

        clampOffsets();
        applyTransform();
    }

        // Mouse wheel zoom
        zoomTarget.addEventListener("wheel", function (e) {
        e.preventDefault();
        const rect = zoomTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        zoomAt(mouseX, mouseY, e.deltaY < 0);
    }, { passive: false });

        // Buttons
    document.getElementById("zoom_in3").addEventListener("click", () => {
        zoomAt(container.clientWidth / 2, container.clientHeight / 2, true);

        // 👉 Move-Mode aktivieren
        if (!window.moveModeActive) {
            window.moveModeActive = true;
            $('#move_mode3').addClass("active");
            $('#zoomTarget').css("cursor", "grab");

            // Auswahl aufheben
            $(".frs_point").removeClass("active");
            if (typeof selectedPoint !== "undefined") selectedPoint = null;
            if (typeof selectedLine !== "undefined") selectedLine = null;
            if (typeof selected !== "undefined") selected = null;
            if (typeof canvas_ready !== "undefined") canvas_ready = false;

            if (typeof showAllPoints === "function") showAllPoints();
        }
    });

        document.getElementById("zoom_out3").addEventListener("click", () => {
        zoomAt(container.clientWidth / 2, container.clientHeight / 2, false);
    });

        document.getElementById("reset_zoom3").addEventListener("click", () => {
        zoomLevel = 0.8;
        offsetX = 0;
        offsetY = 0;
        applyTransform();
    });

        // Drag/Pan
    zoomTarget.addEventListener("mousedown", (e) => {
        if (!moveModeActive) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        zoomTarget.style.cursor = "grabbing";
    });


    document.addEventListener("mouseup", () => {
        isDragging = false;
        if (moveModeActive) {
            zoomTarget.style.cursor = "grab";
        } else {
            zoomTarget.style.cursor = "default";
        }
    });


    document.addEventListener("mousemove", (e) => {
        if (!isDragging || !moveModeActive) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        offsetX += dx;
        offsetY += dy;

        startX = e.clientX;
        startY = e.clientY;

        clampOffsets();
        applyTransform();
    });


    $('#move_mode3').on('click', function () {
        window.moveModeActive = !window.moveModeActive;

        // Visuelles Feedback
        if (window.moveModeActive) {
            $(this).addClass("active");
            $('#zoomTarget').css("cursor", "grab");
        } else {
            $(this).removeClass("active");
            $('#zoomTarget').css("cursor", "default");
        }

        // 🔁 Immer zurücksetzen – egal ob aktiv oder deaktiviert
        $(".frs_point").removeClass("active");
        selectedPoint = null;
        selectedLine = null;
        selected = null;
        canvas_ready = false;
        showAllPoints();
    });



    // Initial transform
        applyTransform();


});
