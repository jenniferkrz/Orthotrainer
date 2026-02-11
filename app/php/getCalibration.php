<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

$mysqli = new mysqli($servername, $username, $password, $database);

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(['status' => 'Error', 'message' => 'DB connection failed: ' . $mysqli->connect_error]);
    exit;
}

// Fall-ID aus GET-Parameter
$fall_id = isset($_GET['fall_id']) ? intval($_GET['fall_id']) : 0;

if ($fall_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'Error', 'message' => 'Invalid or missing fall_id']);
    exit;
}

// Kalibrierung aus Cases-Tabelle laden
$sql = 'SELECT frs_kalibrierung FROM Cases WHERE id = ?';
$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'Error', 'message' => 'Prepare failed: ' . $mysqli->error]);
    exit;
}

$stmt->bind_param('i', $fall_id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status' => 'Error', 'message' => 'Execute failed: ' . $stmt->error]);
    $stmt->close();
    $mysqli->close();
    exit;
}

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['status' => 'Error', 'message' => 'Fall not found']);
    $stmt->close();
    $mysqli->close();
    exit;
}

$row = $result->fetch_assoc();
$stmt->close();
$mysqli->close();

// Kalibrierung kann NULL sein wenn noch nicht gesetzt
$frs_kalibrierung = $row['frs_kalibrierung'];

echo json_encode([
    'status' => 'OK',
    'fall_id' => $fall_id,
    'frs_kalibrierung' => $frs_kalibrierung !== null ? floatval($frs_kalibrierung) : null
]);