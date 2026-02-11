<?php
header('Content-Type: application/json; charset=utf-8');

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

$data = json_decode(file_get_contents("php://input"));

// Bereinige identifier - entferne "undefined" Teile
$identifier = '';
if (isset($data->identifier)) {
    $id_parts = explode('-', $data->identifier);
    $clean_parts = array_filter($id_parts, function($part) {
        return $part !== 'undefined' && $part !== '' && $part !== null;
    });
    $identifier = !empty($clean_parts) ? implode('-', $clean_parts) : '';
}

$fields = "(fall_id, result_id, gruppe, identifier, field_id, input)";
$value_list = '';

foreach($data as $key => $value) {
    if($key !== 'fall_id' && $key !== 'result_id' && $key !== 'gruppe' && $key !== 'identifier') {
        // Nur dentale Felder speichern
        if(in_array($key, ['midline_ok_dental', 'midline_uk_dental'])) {
            $escaped_fall_id = $mysqli->real_escape_string($data->fall_id);
            $escaped_result_id = $mysqli->real_escape_string($data->result_id);
            $escaped_gruppe = $mysqli->real_escape_string($data->gruppe);
            $escaped_identifier = $mysqli->real_escape_string($identifier);
            $escaped_key = $mysqli->real_escape_string($key);
            $escaped_value = $mysqli->real_escape_string($value);

            $value_list .= "('" . $escaped_fall_id . "', '" . $escaped_result_id . "', '" . $escaped_gruppe . "', '" . $escaped_identifier . "', '" . $escaped_key . "', '" . $escaped_value . "'),";
        }
    }
}

if (!empty($value_list)) {
    $value_list = substr_replace($value_list, '', -1);

    $query = "INSERT INTO Results " . $fields . " VALUES " . $value_list;

    if ($mysqli->query($query)) {
        echo json_encode(array('success' => true, 'message' => 'Inserted'));
    } else {
        echo json_encode(array('success' => false, 'error' => $mysqli->error));
    }
} else {
    echo json_encode(array('success' => false, 'error' => 'No valid fields to insert'));
}

$mysqli->close();
?>
