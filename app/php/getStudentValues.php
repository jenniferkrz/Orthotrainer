<?php
header('Content-Type: application/json');

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
$result_id = isset($data->result_id) ? $mysqli->real_escape_string($data->result_id) : '';
$gruppe = isset($data->gruppe) ? $mysqli->real_escape_string($data->gruppe) : '';
$identifier = isset($data->identifier) ? $mysqli->real_escape_string($data->identifier) : '';

// WHERE-Bedingung für Results aufbauen
$where_results = "fall_id = '$fall_id'";
if (!empty($result_id)) {
    $where_results .= " AND result_id = '$result_id'";
}
if (!empty($gruppe)) {
    $where_results .= " AND gruppe = '$gruppe'";
}
if (!empty($identifier)) {
    $where_results .= " AND identifier = '$identifier'";
}

// Kombinierte Query für Studenten-Eingaben UND Punktzahlen
$query = "SELECT 
            field_id as input_id,
            input as value
          FROM Results
          WHERE $where_results
          
          UNION ALL
          
          SELECT 
            input_id,
            value
          FROM Fields
          WHERE fall_id = '$fall_id'
          AND input_id LIKE '%_score'
          
          ORDER BY input_id";

$result = $mysqli->query($query);

if (!$result) {
    echo json_encode(["error" => $mysqli->error, "query" => $query]);
    exit;
}

$studentValues = array();

while ($row = $result->fetch_assoc()) {
    $studentValues[] = array(
        'input_id' => $row['input_id'],
        'value' => $row['value']
    );
}

echo json_encode($studentValues);

$mysqli->close();
?>