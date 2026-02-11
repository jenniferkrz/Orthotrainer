<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "ortho_user";
$password = "ogCqGM*R3Pwhw8v";
$database = "kfo";

// Create connection
$mysqli = new mysqli($servername, $username, $password, $database);

// Check connection
if ($mysqli->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $mysqli->connect_error]));
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"));

// Akzeptiere sowohl 'id' als auch 'fall_id'
if (!isset($data->fall_id) && !isset($data->id)) {
    echo json_encode(["error" => "Fall ID fehlt"]);
    exit;
}

$fall_id = isset($data->fall_id) ? $mysqli->real_escape_string($data->fall_id) : $mysqli->real_escape_string($data->id);

// Query für Musterlösungen aus Fields-Tabelle
// Hole nur die Einträge OHNE _score im Namen (das sind die eigentlichen Musterlösungen)
$query = "SELECT 
            input_id, 
            value
          FROM Fields 
          WHERE fall_id = '$fall_id' 
          AND input_id NOT LIKE '%_score'
          ORDER BY input_id";

$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(["error" => $mysqli->error]);
    exit;
}

$musterloesung = array();

while ($row = $result->fetch_assoc()) {
    $musterloesung[] = array(
        'input_id' => $row['input_id'],
        'value' => $row['value']
    );
}

echo json_encode($musterloesung);

$mysqli->close();
?>