<?php
require_once __DIR__ . '/config.php';

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Connection failed']));
}

// Identifier aus GET-Parameter
$identifier = isset($_GET['identifier']) ? $_GET['identifier'] : '';

if (empty($identifier)) {
    echo json_encode(['success' => false, 'error' => 'Missing identifier']);
    exit;
}

$sql = "SELECT welcome_completed, instruction_completed FROM user_progress WHERE identifier = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $identifier);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'welcome_completed' => (int)$row['welcome_completed'],
        'instruction_completed' => (int)$row['instruction_completed']
    ]);
} else {
    echo json_encode([
        'success' => true,
        'welcome_completed' => 0,
        'instruction_completed' => 0
    ]);
}

$stmt->close();
$conn->close();
?>