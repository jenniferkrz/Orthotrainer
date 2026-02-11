<?php
$json = $_POST['json'];
$resid = $_POST['resid'];

$file = "frs_results/frs_" . str_replace('"', "", $resid) . ".json";


/* sanity check */
if (json_decode($json) != null)
{
    $file = fopen($file,'w+');
    fwrite($file, $json);
    fclose($file);
}
else
{
    echo 'error';
}
?>