<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

// Create connection
$mysqli = new mysqli($servername, $username, $password, $database);

// Check connection
if ($mysqli->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $mysqli->connect_error]));
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(["error" => "Fall ID fehlt"]);
    exit;
}

$fall_id = $mysqli->real_escape_string($data->id);

// Query für Fall-Informationen aus Cases-Tabelle
$query = "SELECT
            title,
            description,
            age,
            anamnese,
            dental_entw,
            skelettal_entw
          FROM Cases
          WHERE id = '$fall_id'
          LIMIT 1";

$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(["error" => $mysqli->error]);
    exit;
}

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Fall nicht gefunden"]);
    exit;
}

$fall = $result->fetch_assoc();

// Gebe Fall-Daten zurück
echo json_encode([
    'title' => $fall['title'],
    'description' => $fall['description'],
    'age' => $fall['age'],
    'anamnese' => $fall['anamnese'],
    'dental_entw' => $fall['dental_entw'],
    'skelettal_entw' => $fall['skelettal_entw']
]);

$mysqli->close();
?>