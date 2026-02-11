<?php
$servername = "localhost";
$username = "ortho_user";
$password = "ogCqGM*R3Pwhw8v";
$database = "kfo";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Connection failed']));
}

// Daten empfangen
$data = json_decode(file_get_contents('php://input'), true);
$identifier = isset($data['identifier']) ? $data['identifier'] : '';
$page = isset($data['page']) ? $data['page'] : '';

if (empty($identifier) || empty($page)) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

// Bestimme welches Feld aktualisiert werden soll
$field = '';
if ($page === 'welcome') {
    $field = 'welcome_completed';
} elseif ($page === 'instruction') {
    $field = 'instruction_completed';
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid page']);
    exit;
}

// INSERT oder UPDATE
$sql = "INSERT INTO user_progress (identifier, $field) 
        VALUES (?, 1) 
        ON DUPLICATE KEY UPDATE $field = 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $identifier);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
$conn->close();
?>