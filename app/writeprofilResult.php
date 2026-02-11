<?php
$json = $_POST['json'];
$file = 'profilResults/' . json_decode($_POST['filename']) . '.json';

/* sanity check */
if (json_decode($json) != null)
{
    $file = fopen($file,'w+');
    fwrite($file, $json);
    fclose($file);
    echo 'success';
}
else
{
    echo 'error';
}
?>