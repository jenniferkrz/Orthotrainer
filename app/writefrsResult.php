<?php
$json = $_POST['json'];
$file = 'frs_results/' . json_decode($_POST['filename']);



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