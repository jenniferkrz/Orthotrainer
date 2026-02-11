$(document).ready(function () {

    var sum1 = $(".sum1");
    var sum2 = $(".sum2");
    var sum3 = $(".sum3");

    $(".sum1").on("change keyup paste", function(e){
        summen1();
    });
    $(".sum2").on("change keyup paste", function(e){
        summen2();
    });
    $(".sum3").on("change keyup paste", function(e){
        summen3();
    });

    function summen1(){
        let summe = 0;
        for (let i = 0; i < sum1.length; i++) {
            summe = summe + Number(sum1[i].value.replace(/,/g, '.'));
        }
        document.getElementById('editsum1uk').value = summe.toFixed(2);
    }

    function summen2(){
        let summe = 0;
        for (let i = 0; i < sum2.length; i++) {
            summe = summe + Number(sum2[i].value.replace(/,/g, '.'));
        }
        document.getElementById('editsum2uk').value = summe.toFixed(2);
    }

    function summen3(){
        let summe = 0;
        for (let i = 0; i < sum3.length; i++) {
            summe = summe + Number(sum3[i].value.replace(/,/g, '.'));
        }
        document.getElementById('editsum3uk').value = summe.toFixed(2);
    }

});