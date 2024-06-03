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

$update = "";
foreach($data as $key=>$value) {
    if($key !== 'fall_id'){
        $update.= " WHEN input_id = '" . $key ."' THEN '" . $value . "'";   
    }

}
$query = "UPDATE Fields SET value = (CASE " .  rtrim($update, ",") . "ELSE value END ) WHERE fall_id = ". $data->fall_id . "";

//echo json_encode($query);

 if ($mysqli->query($query)) {
    if (mysqli_errno() == 1062) {
        echo json_encode('duplicate');
    }else{
        echo json_encode('Updated');
    }
}  else{
    if (mysqli_errno() == 1062) {
        echo json_encode('duplicate');
    }else{
        echo json_encode($mysqli->error);
    }
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