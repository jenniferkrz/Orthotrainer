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

 $query = 'SELECT * FROM Cases;';


$result = $mysqli->query($query);

if (mysqli_num_rows($result) > 0) {
    $arr = [];
    while ($row = $result->fetch_assoc()) {
        $case = new Fall();
        $case->id = $row['id'];
        $case->title = $row['title'];
        $case->description = $row['description'];
        $case->model = $row['model'];
        $case->active = $row['active'];
        $arr[] = $case;
    }
    echo json_encode($arr);
}


class Fall
{
    public $id;
    public $title;
    public $description;
    public $model;
    public $active;
}

?>