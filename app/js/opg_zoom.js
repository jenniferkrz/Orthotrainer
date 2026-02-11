$(document).ready(function () {
    const zoomTarget = document.getElementById("opg_img");
    const container = document.getElementById("zoom_target1");

    let zoomLevel = 1;
    const zoomStep = 0.1;
    const maxZoom = 3;
    const minZoom = 0.5;
    let offsetX = 0;
    let offsetY = 0;

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // Touch-Zoom Variablen
    let lastTouchDistance = null;
    let isTouchActive = false;

    container.style.touchAction = 'none';

    zoomTarget.style.maxWidth = "none";
    zoomTarget.style.width = "100%";
    zoomTarget.style.height = "auto";
    zoomTarget.style.display = "block";
    zoomTarget.style.userSelect = "none";
    zoomTarget.style.touchAction = "none";

    function applyTransform() {
        zoomTarget.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
        zoomTarget.style.transformOrigin = "top left";
    }

    function clampOffsets() {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const naturalWidth = zoomTarget.naturalWidth || zoomTarget.width;
        const naturalHeight = zoomTarget.naturalHeight || zoomTarget.height;

        const contentWidth = naturalWidth * zoomLevel;
        const contentHeight = naturalHeight * zoomLevel;

        const minOffsetX = containerWidth - contentWidth;
        const minOffsetY = containerHeight - contentHeight;

        offsetX = Math.min(0, Math.max(minOffsetX, offsetX));
        offsetY = Math.min(0, Math.max(minOffsetY, offsetY));
    }

    function zoomAt(mouseX, mouseY, zoomIn) {
        const rect = container.getBoundingClientRect();
        const relX = (mouseX - rect.left - offsetX) / zoomLevel;
        const relY = (mouseY - rect.top - offsetY) / zoomLevel;

        const newZoomLevel = zoomIn
            ? Math.min(maxZoom, zoomLevel + zoomStep)
            : Math.max(minZoom, zoomLevel - zoomStep);

        if (newZoomLevel === zoomLevel) return;

        zoomLevel = newZoomLevel;

        offsetX = mouseX - rect.left - relX * zoomLevel;
        offsetY = mouseY - rect.top - relY * zoomLevel;

        clampOffsets();
        applyTransform();
    }

    // ====================================================================
    // MOUSE EVENTS
    // ====================================================================

    // Zoom per Mausrad
    container.addEventListener("wheel", function (e) {
        if (isTouchActive) return;
        e.preventDefault();
        zoomAt(e.clientX, e.clientY, e.deltaY < 0);
    }, { passive: false });

    // Drag / Pan mit Maus
    container.addEventListener("mousedown", (e) => {
        if (isTouchActive) return;

        // Prüfe ob auf einen Button geklickt wurde
        if (e.target.closest('.zoom_controls') || e.target.closest('button')) {
            return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        zoomTarget.style.cursor = "grabbing";
    });

    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        zoomTarget.style.cursor = "grab";

        setTimeout(() => {
            isTouchActive = false;
        }, 100);
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging || isTouchActive) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        offsetX += dx;
        offsetY += dy;

        startX = e.clientX;
        startY = e.clientY;

        clampOffsets();
        applyTransform();
    });

    // ====================================================================
    // TOUCH EVENTS (iPad/Apple Pencil)
    // ====================================================================

    container.addEventListener("touchstart", function (e) {
        // Prüfe ob auf einen Button getippt wurde - SEHR WICHTIG!
        const target = e.target;
        if (target.closest('.zoom_controls') ||
            target.closest('button') ||
            target.tagName === 'BUTTON' ||
            target.closest('#zoom_in') ||
            target.closest('#zoom_out') ||
            target.closest('#reset_zoom') ||
            target.closest('#move_mode')) {
            // Button wurde berührt - NICHT als Touch für Bild behandeln
            return;
        }

        isTouchActive = true;

        // Zwei-Finger Pinch-Zoom
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            return;
        }

        // Ein-Finger Pan (nur wenn gezoomt)
        if (e.touches.length === 1 && zoomLevel > 1) {
            e.preventDefault();
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            zoomTarget.style.cursor = "grabbing";
        }
    }, { passive: false });

    container.addEventListener("touchmove", function (e) {
        // Zwei-Finger Pinch-Zoom
        if (e.touches.length === 2 && lastTouchDistance !== null) {
            e.preventDefault();

            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);

            const zoomFactor = newDistance / lastTouchDistance;

            // Zoom-Zentrum zwischen den beiden Fingern
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const rect = container.getBoundingClientRect();
            const relX = (centerX - rect.left - offsetX) / zoomLevel;
            const relY = (centerY - rect.top - offsetY) / zoomLevel;

            let newZoomLevel = zoomLevel * zoomFactor;
            newZoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoomLevel));

            zoomLevel = newZoomLevel;

            offsetX = centerX - rect.left - relX * zoomLevel;
            offsetY = centerY - rect.top - relY * zoomLevel;

            clampOffsets();
            applyTransform();

            lastTouchDistance = newDistance;
            return;
        }

        // Ein-Finger Pan
        if (isDragging && e.touches.length === 1) {
            e.preventDefault();

            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            offsetX += dx;
            offsetY += dy;

            startX = touch.clientX;
            startY = touch.clientY;

            clampOffsets();
            applyTransform();
        }
    }, { passive: false });

    container.addEventListener("touchend", function (e) {
        if (e.touches.length === 0) {
            isDragging = false;
            lastTouchDistance = null;
            zoomTarget.style.cursor = "grab";

            // Reset Touch-Status nach kurzer Verzögerung
            setTimeout(() => {
                isTouchActive = false;
            }, 100);
        }
    }, { passive: false });

    // ====================================================================
    // ZOOM BUTTONS
    // ====================================================================

    const zoomInBtn = document.getElementById("zoom_in");
    const zoomOutBtn = document.getElementById("zoom_out");
    const resetZoomBtn = document.getElementById("reset_zoom");
    const moveButton = document.getElementById("move_mode");

    // Verhindere dass Button-Touches das Bild bewegen
    function handleButtonTouch(callback) {
        return function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            callback();
        };
    }

    if (zoomInBtn) {
        // WICHTIG: touchstart auch abfangen um Drag zu verhindern
        zoomInBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { passive: false });

        // Touch-Events für iPad
        zoomInBtn.addEventListener('touchend', handleButtonTouch(() => {
            const rect = container.getBoundingClientRect();
            zoomAt(
                rect.left + container.clientWidth / 2,
                rect.top + container.clientHeight / 2,
                true
            );
        }), { passive: false });

        // Click-Events für Desktop
        zoomInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = container.getBoundingClientRect();
            zoomAt(
                rect.left + container.clientWidth / 2,
                rect.top + container.clientHeight / 2,
                true
            );
        });
    }

    if (zoomOutBtn) {
        // WICHTIG: touchstart auch abfangen um Drag zu verhindern
        zoomOutBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { passive: false });

        // Touch-Events für iPad
        zoomOutBtn.addEventListener('touchend', handleButtonTouch(() => {
            const rect = container.getBoundingClientRect();
            zoomAt(
                rect.left + container.clientWidth / 2,
                rect.top + container.clientHeight / 2,
                false
            );
        }), { passive: false });

        // Click-Events für Desktop
        zoomOutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = container.getBoundingClientRect();
            zoomAt(
                rect.left + container.clientWidth / 2,
                rect.top + container.clientHeight / 2,
                false
            );
        });
    }

    if (resetZoomBtn) {
        // WICHTIG: touchstart auch abfangen um Drag zu verhindern
        resetZoomBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { passive: false });

        // Touch-Events für iPad
        resetZoomBtn.addEventListener('touchend', handleButtonTouch(() => {
            zoomLevel = 1;
            offsetX = 0;
            offsetY = 0;
            clampOffsets();
            applyTransform();
        }), { passive: false });

        // Click-Events für Desktop
        resetZoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zoomLevel = 1;
            offsetX = 0;
            offsetY = 0;
            clampOffsets();
            applyTransform();
        });
    }

    // Move Mode Button (immer aktiv, nur visuell)
    if (moveButton) {
        moveButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, { passive: false });

        moveButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        moveButton.classList.add("active");
    }

    // Initialer Cursor
    $(zoomTarget).css("cursor", "grab");

    // Anfangstransformation anwenden
    applyTransform();
});