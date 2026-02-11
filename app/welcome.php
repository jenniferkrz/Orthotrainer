<?php
// Hole identifier aus URL
$identifier = isset($_GET['identifier']) ? $_GET['identifier'] : '';

require_once __DIR__ . '/php/config.php';

// Prüfe ob Nutzer bereits beide Seiten besucht hat
if (!empty($identifier)) {
    $conn = new mysqli($servername, $username, $password, $database);

    if (!$conn->connect_error) {
        $stmt = $conn->prepare("SELECT welcome_completed, instruction_completed FROM user_progress WHERE identifier = ?");
        $stmt->bind_param("s", $identifier);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();

            // Wenn beide Seiten besucht wurden, direkt zu index.html
            if ($row['welcome_completed'] == 1 && $row['instruction_completed'] == 1) {
                header("Location: index.php?identifier=" . urlencode($identifier));
                exit;
            }
        }

        $stmt->close();
        $conn->close();
    }
}else{
    // Kein identifier = zurück zu welcome.php
    header("Location: start.html");
    exit;
}
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
        #flipped{
            width: 100%;
        }
        h2{
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
        }

        .breadcrumb-item.active {
            color: #333;
            font-weight: 600;
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
        }

        .breadcrumb-item.active .breadcrumb-number {
            background-color: #4A90E2;
            color: white;
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

        /* Wrapper Padding für Footer */
        #wrapper {
            padding-bottom: 60px;
        }

        .embed-responsive {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
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
    </style>
</head>
<body>

<div id="wrapper">

    <div id="top">
        <a href="index.php" id="logo"><img class="logo_img" src="images/orthocampus_divers2.svg"></a>
        <div class="avmz_logo"><img src="images/avmz_logo.svg"></div>
    </div>

    <!-- Breadcrumbs -->
    <div class="breadcrumbs">
        <div class="breadcrumb-item active">
            <span class="breadcrumb-number">1</span>
            <span>Willkommen</span>
        </div>
        <span class="breadcrumb-separator">›</span>
        <div class="breadcrumb-item">
            <span class="breadcrumb-number">2</span>
            <span>Anleitung</span>
        </div>
        <span class="breadcrumb-separator">›</span>
        <div class="breadcrumb-item">
            <span class="breadcrumb-number">3</span>
            <span>App</span>
        </div>
    </div>

    <div id="list">
        <h2>Herzlich Willkommen beim Orthotrainer!</h2>
        <div class="embed-responsive embed-responsive-16by9">
            <video id="flipped" class="embed-responsive-item video-js vjs-default-skin vjs-big-play-centered"
                   controls="" data-setup="{ &quot;playbackRates&quot;: [0.75, 1, 1.25, 1.5, 1.75, 2] }">
                <source
                        src="https://wms01-avmz.germanywestcentral.cloudapp.azure.com/studienportal/_definst/mp4:OrthoTrainer_Trailer.mp4/playlist.m3u8"
                        type="application/x-mpegURL">
            </video>
        </div>

        <div data-href="skript.html" id="start_btn">Weiter</div>
    </div>

</div>

<footer>
    <p>&copy; 2025 AVMZ</p>
</footer>
<script>
    $(document).ready(function () {
        const urlParams = new URLSearchParams(window.location.search);
        const identifier = urlParams.get('identifier') || '';

        console.log("Identifier aus URL:", identifier);

        // Markiere Welcome-Seite als besucht
        if (identifier) {
            $.ajax({
                type: "POST",
                url: 'php/saveProgress.php',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    identifier: identifier,
                    page: 'welcome'
                }),
                success: function (result) {
                    console.log("Welcome-Fortschritt gespeichert:", result);
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("Fehler beim Speichern:", thrownError);
                }
            });
        }

        // Event-Handler für "Los geht's" Button
        $("#start_btn").on("click", function() {
            let targetUrl = "skript.html";

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