<?php
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

$mysqli = new mysqli($servername, $username, $password, $database);

if ($mysqli->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $mysqli->connect_error]));
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(["error" => "Fall ID fehlt"]);
    exit;
}

$fall_id = $mysqli->real_escape_string($data->id);

// Hole den Patientennamen und das Alter aus der Cases-Tabelle
$query = "SELECT title, age FROM Cases WHERE id = '$fall_id'";
$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(["error" => $mysqli->error]);
    exit;
}

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        "title" => $row['title'],
        "age" => $row['age']
    ]);
} else {
    echo json_encode(["error" => "Fall nicht gefunden"]);
}

$mysqli->close();
?>