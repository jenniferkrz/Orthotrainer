<?php
require_once __DIR__ . '/php/config.php';


// Create connection
$mysqli = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$data = json_decode(file_get_contents("php://input"));

$fields = "(fall_id, result_id, gruppe, identifier, field_id, input) ";
$values = "(";
$value_list = '';

foreach($data as $key=>$value) {
    if($key !== 'fall_id' && $key !== 'result_id' && $key !== 'gruppe' && $key !== 'identifier'){

        $value_list.= "('" . $data->fall_id . "', '" .$data->result_id . "' , '" .$data->gruppe . "' , '" .$data->identifier . "', '". $key . "', '". $value."'),";
    }
}
$value_list = substr_replace($value_list, '', -1);

$query = "INSERT INTO Results " . $fields ." VALUES ". $value_list .";";

//echo json_encode($query);

 if ($mysqli->query($query)) {

        echo json_encode('Inserted');

}  else{

        echo json_encode($mysqli->error);

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