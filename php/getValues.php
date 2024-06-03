<?php
$servername = "localhost";
$username = "ortho_user";
$password = "ogCqGM*R3Pwhw8v";
$database = "kfo";


// Create connection
$mysqli = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$data = json_decode(file_get_contents("php://input"));


$query = 'SELECT * FROM Fields WHERE fall_id = ' . $data->id . ';';


$result = $mysqli->query($query);

if (mysqli_num_rows($result) > 0) {
    $arr = [];
    while ($row = $result->fetch_assoc()) {
        $case = new Field();
        $case->id = $row['id'];
        $case->title = $row['title'];
        $case->value = $row['value'];
        $case->unit = $row['unit'];
        $case->mandatory = $row['mandatory'];
        $case->fall_id = $row['fall_id'];
        $case->input_id = $row['input_id'];

        $arr[] = $case;
    }
    echo json_encode($arr);
}


class Field
{
    public $id;
    public $title;
    public $value;
    public $unit;
    public $mandatory;
    public $fall_id;
    public $input_id;



}

?>