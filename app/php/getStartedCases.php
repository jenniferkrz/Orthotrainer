<?php
/**
 * Lädt alle angefangenen Fälle für einen Nutzer
 * Gruppiert nach Fall mit Patientenname aus Cases-Tabelle
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

if (!isset($data->identifier)) {
    echo json_encode(['error' => 'Missing identifier']);
    exit;
}

$identifier = $mysqli->real_escape_string($data->identifier);

// Query mit JOIN auf Cases-Tabelle für Patientennamen
$query = "
    SELECT 
        r.fall_id,
        r.result_id,
        COUNT(r.field_id) as answer_count,
        MAX(r.created) as last_edited,
        c.title as patient_name,
        c.age as patient_age
    FROM Results r
    LEFT JOIN Cases c ON r.fall_id = c.id
    WHERE r.identifier = ?
    GROUP BY r.fall_id, r.result_id
    ORDER BY r.fall_id ASC, last_edited DESC
";

$stmt = $mysqli->prepare($query);

if (!$stmt) {
    echo json_encode(['error' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param("s", $identifier);
$stmt->execute();
$result = $stmt->get_result();

// Gruppiere nach fall_id
$grouped = [];
while ($row = $result->fetch_assoc()) {
    $fall_id = $row['fall_id'];

    if (!isset($grouped[$fall_id])) {
        $grouped[$fall_id] = [
            'fall_id' => $fall_id,
            'patient_name' => $row['patient_name'] ?: 'Fall ' . $fall_id,
            'patient_age' => $row['patient_age'],
            'attempts' => []
        ];
    }

    $grouped[$fall_id]['attempts'][] = [
        'result_id' => $row['result_id'],
        'answer_count' => intval($row['answer_count']),
        'last_edited' => $row['last_edited']
    ];
}

// Konvertiere zu Array (für JSON)
echo json_encode(array_values($grouped));

$stmt->close();
$mysqli->close();
?>