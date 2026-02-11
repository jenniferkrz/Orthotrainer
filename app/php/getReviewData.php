<?php
/**
 * Lädt Nutzerantworten + Musterlösungen für Review-Modus
 * Erwartet: { fall_id: 10, result_id: "QoFVPW4j6k" }
 * Liefert: Array mit input_id, user_input, solution, title
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

$mysqli = new mysqli($servername, $username, $password, $database);

if ($mysqli->connect_error) {
    echo json_encode(['error' => 'Connection failed: ' . $mysqli->connect_error]);
    exit;
}

$mysqli->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->fall_id) || !isset($data->result_id)) {
    echo json_encode(['error' => 'Missing fall_id or result_id']);
    exit;
}

$fall_id = intval($data->fall_id);
$result_id = $mysqli->real_escape_string($data->result_id);

// Query: Alle Musterlösungen für den Fall + dazu passende Nutzerantworten (falls vorhanden)
// Join über: Fields.input_id = Results.field_id
$query = "
    SELECT 
        f.input_id,
        f.title,
        f.value AS solution,
        f.unit,
        r.input AS user_input,
        r.created
    FROM Fields f
    LEFT JOIN Results r ON f.input_id = r.field_id 
        AND r.fall_id = f.fall_id 
        AND r.result_id = ?
    WHERE f.fall_id = ?
    ORDER BY f.id ASC
";

$stmt = $mysqli->prepare($query);

if (!$stmt) {
    echo json_encode(['error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param("si", $result_id, $fall_id);
$stmt->execute();
$result = $stmt->get_result();

$arr = [];
while ($row = $result->fetch_assoc()) {
    $item = [
        'input_id' => $row['input_id'],
        'title' => $row['title'],
        'solution' => $row['solution'],
        'unit' => $row['unit'],
        'user_input' => $row['user_input'],
        'created' => $row['created']
    ];
    $arr[] = $item;
}

echo json_encode($arr);

$stmt->close();
$mysqli->close();
?>