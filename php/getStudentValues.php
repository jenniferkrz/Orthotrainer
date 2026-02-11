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
    http_response_code(500);
    die(json_encode(['error' => 'Connection failed: ' . $mysqli->connect_error]));
}

// Set charset to UTF-8
$mysqli->set_charset("utf8");

// Input validieren
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input: fall_id required']);
    exit;
}

// Sanitize input
$fall_id = $mysqli->real_escape_string($data->id);

// Hole Studenten-Eingaben UND Punktzahl-Felder
// Diese Query holt sowohl die normalen Eingaben als auch die _score Felder
$stmt = $mysqli->prepare('
    SELECT input_id, value 
    FROM student_eingaben 
    WHERE fall_id = ? 
    AND (input_id NOT LIKE "%_score" OR input_id LIKE "%_score")
    ORDER BY input_id
');

$stmt->bind_param('s', $fall_id);
$stmt->execute();
$result = $stmt->get_result();

$arr = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $item = [
            'input_id' => $row['input_id'],
            'value' => $row['value']
        ];
        $arr[] = $item;
    }
}

echo json_encode($arr);

$stmt->close();
$mysqli->close();
?>