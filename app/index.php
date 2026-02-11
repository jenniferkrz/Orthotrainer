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

            // Wenn NICHT beide Seiten besucht wurden, zurück zu welcome.php
            if ($row['welcome_completed'] != 1 || $row['instruction_completed'] != 1) {
                header("Location: welcome.php?identifier=" . urlencode($identifier));
                exit;
            }
        } else {
            // Kein Eintrag gefunden = noch nicht besucht
            header("Location: welcome.php?identifier=" . urlencode($identifier));
            exit;
        }

        $stmt->close();
        $conn->close();
    }
} else {
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

    <style>
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
        .continue_btn{
            display: none!important;
        }
    </style>
</head>
<body>

<div id="wrapper">

    <div id="top">
        <a href="index.php" id="logo"><img class="logo_img" src="images/orthocampus_divers.svg"></a>
        <div class="avmz_logo"><img src="images/avmz_logo.svg"></div>
    </div>

    <!-- Breadcrumbs -->
    <div class="breadcrumbs">
        <div class="breadcrumb-item completed">
            <span class="breadcrumb-number">1</span>
            <span>Willkommen</span>
        </div>
        <span class="breadcrumb-separator">›</span>
        <a href="#" id="breadcrumb_instruction" class="breadcrumb-item completed">
            <span class="breadcrumb-number">2</span>
            <span>Anleitung</span>
        </a>
        <span class="breadcrumb-separator">›</span>
        <div class="breadcrumb-item active">
            <span class="breadcrumb-number">3</span>
            <span>App</span>
        </div>
    </div>

    <div id="list">
        <div class="list_top">
            <h2>Übungspatienten:</h2>
        </div>

        <div id="list_input"></div>

        <div class="list_top">
            <h2>Angefangene Fälle:</h2>
        </div>

        <div id="start_input"></div>
    </div>

</div>

<footer>
    <p>&copy; 2025 AVMZ</p>
</footer>

<script src="js/loadStartedCases.js?v=<?php echo time(); ?>"></script>

<script>
    $(document).ready(function () {
        // Hole identifier aus URL-Parameter
        const urlParams = new URLSearchParams(window.location.search);
        const identifier = urlParams.get('identifier') || '';

        console.log("Identifier aus URL:", identifier);

        // Setze den Link für Breadcrumb "Anleitung" mit identifier
        if (identifier) {
            $("#breadcrumb_instruction").attr("href", "skript.html?identifier=" + encodeURIComponent(identifier));
        } else {
            $("#breadcrumb_instruction").attr("href", "skript.html");
        }
    });
</script>

<script src="js/getCases.js"></script>
<script src="js/index.js"></script>

</body>
</html>