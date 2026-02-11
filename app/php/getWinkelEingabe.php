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

// Akzeptiere sowohl 'id' als auch 'fall_id'
if (!isset($data->fall_id) && !isset($data->id)) {
    echo json_encode(["error" => "Fall ID fehlt"]);
    exit;
}

$fall_id = isset($data->fall_id) ? $mysqli->real_escape_string($data->fall_id) : $mysqli->real_escape_string($data->id);

// Query für Musterlösung aus Fields-Tabelle (nur die mit 'winkel_' Präfix)
$query = "SELECT 
            input_id,
            value
          FROM Fields
          WHERE fall_id = '$fall_id'
          AND input_id LIKE 'winkel_%'
          ORDER BY input_id";

$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(["error" => $mysqli->error, "query" => $query]);
    exit;
}

$winkelValues = array();

while ($row = $result->fetch_assoc()) {
    $winkelValues[] = array(
        'input_id' => $row['input_id'],
        'value' => $row['value']
    );
}

// Debug: Gebe auch die Query-Info mit zurück
$response = array(
    'data' => $winkelValues,
    'debug' => array(
        'query' => $query,
        'count' => count($winkelValues),
        'fall_id' => $fall_id
    )
);

echo json_encode($response);

$mysqli->close();
?>