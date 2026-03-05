<?php
$identifier = isset($_GET['identifier']) ? $_GET['identifier'] : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ortho Campus</title>
    <link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700&display=swap" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="js/logoNavigation.js"></script>

    <!-- Video.js CSS -->
    <link href="https://vjs.zencdn.net/7.20.3/video-js.css" rel="stylesheet">

    <!-- Video.js Core -->
    <script src="https://vjs.zencdn.net/7.20.3/video.min.js"></script>

    <!-- HLS Plugin für Chrome/Firefox -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/videojs-contrib-hls/5.15.0/videojs-contrib-hls.min.js"></script>

    <style>
        .embed-responsive {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
        }

        .embed-responsive .video-js {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
        }

        h2 {
            text-align: center;
        }

        /* Breadcrumbs Styling */
        .breadcrumbs {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px 0;
            margin: 0 auto;
            max-width: 600px;
        }

        .breadcrumb-item {
            display: flex;
            align-items: center;
            font-family: 'Public Sans', sans-serif;
            font-size: 14px;
            color: #999;
            text-decoration: none;
        }

        .breadcrumb-item.active {
            color: #333;
            font-weight: 600;
        }

        .breadcrumb-item.completed {
            color: #666;
            cursor: pointer;
            transition: color 0.2s ease;
        }

        .breadcrumb-item.completed:hover {
            color: #333;
        }

        .breadcrumb-separator {
            margin: 0 15px;
            color: #ccc;
        }

        .breadcrumb-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: #f0f0f0;
            color: #999;
            font-weight: 600;
            margin-right: 8px;
            font-size: 13px;
            transition: background-color 0.2s ease;
        }

        .breadcrumb-item.active .breadcrumb-number {
            background-color: #4A90E2;
            color: white;
        }

        .breadcrumb-item.completed .breadcrumb-number {
            background-color: #A8D5A8;
            color: white;
        }

        .breadcrumb-item.completed:hover .breadcrumb-number {
            background-color: #8FBC8F;
        }

        /* Download Button Styling */
        #download_btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #5CB85C;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            text-decoration: none;
            font-family: 'Public Sans', sans-serif;
            font-weight: 600;
            font-size: 16px;
            margin: 20px auto;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        #download_btn:hover {
            background-color: #4CAF50;
        }

        #download_btn i {
            margin-right: 8px;
        }

        .button-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
        }

        /* Footer Styling */
        footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: center;
            padding: 15px;
            background-color: #f5f5f5;
            border-top: 1px solid #e0e0e0;
            font-family: 'Public Sans', sans-serif;
            font-size: 14px;
            color: #666;
            z-index: 100;
        }

        footer p {
            margin: 0;
        }

        #wrapper {
            padding-bottom: 60px;
        }
    </style>
</head>
<body>

<div id="wrapper">

    <div id="top">
        <a href="index.php?identifier=<?php echo urlencode($identifier); ?>" id="logo"><img class="logo_img" src="images/orthocampus_divers2.svg"></a>
        <div class="avmz_logo"><img src="images/avmz_logo.svg"></div>
    </div>

    <!-- Breadcrumbs -->
    <div class="breadcrumbs">
        <a href="welcome.php?identifier=<?php echo urlencode($identifier); ?>" class="breadcrumb-item completed">
            <span class="breadcrumb-number">1</span>
            <span>Willkommen</span>
        </a>
        <span class="breadcrumb-separator">›</span>
        <div class="breadcrumb-item active">
            <span class="breadcrumb-number">2</span>
            <span>Anleitung</span>
        </div>
        <span class="breadcrumb-separator">›</span>
        <a href="index.php?identifier=<?php echo urlencode($identifier); ?>" class="breadcrumb-item">
            <span class="breadcrumb-number">3</span>
            <span>App</span>
        </a>
    </div>

    <div id="list">
        <h2>Anleitungsvideo & -skript</h2>
        <p>Bitte sehen Sie sich das Anleitungsvideo an! Es führt Sie Schritt für Schritt durch die Anwendung und erklärt die wichtigen Funktionen. <br>Zusätzlich können Sie das Anleitungsskript herunterladen und parallel zur Fallanalyse öffnen.</p>

        <div class="embed-responsive embed-responsive-16by9">
            <video id="flipped" class="embed-responsive-item video-js vjs-default-skin vjs-big-play-centered"
                   controls="" data-setup="{ &quot;playbackRates&quot;: [0.75, 1, 1.25, 1.5, 1.75, 2] }">
                <source
                        src="https://wms01-avmz.germanywestcentral.cloudapp.azure.com/kfo/_definst/mp4:KFO_Skript.mp4/playlist.m3u8"
                        type="application/x-mpegURL">
            </video>
        </div>

        <div class="button-container">
            <a href="documents/Orthotrainer_Anleitung.pdf" id="download_btn" download="OrthoTrainer_Anleitung.pdf">
                <i class="fas fa-download"></i>
                Anleitung als PDF herunterladen
            </a>
        </div>

        <div data-href="index.php" id="start_btn">Los geht's</div>
    </div>

</div>

<footer>
    <p>
        AVMZ, RWTH Aachen<br>
        Code: <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a> |
        Inhalte: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0</a>
    </p>
</footer>

<script>
    $(document).ready(function () {
        const urlParams = new URLSearchParams(window.location.search);
        const identifier = urlParams.get('identifier') || '';

        // Markiere Instruction-Seite als besucht
        if (identifier) {
            $.ajax({
                type: "POST",
                url: 'php/saveProgress.php',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    identifier: identifier,
                    page: 'instruction'
                }),
                success: function (result) {
                    console.log("Instruction-Fortschritt gespeichert:", result);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("Fehler beim Speichern:", thrownError);
                }
            });
        }

        // Event-Handler für "Los geht's" Button
        $("#start_btn").on("click", function() {
            let targetUrl = "index.php";

            if (identifier) {
                targetUrl += "?identifier=" + encodeURIComponent(identifier);
            }

            console.log("Navigiere zu:", targetUrl);
            window.location.href = targetUrl;
        });
    });
</script>

</body>
</html>