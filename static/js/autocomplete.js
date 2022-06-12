function showResult(str) {
    if (str.length==0) {
        document.getElementById("livesearch").innerHTML="";
        document.getElementById("livesearch").style.border="0px";
        return;
    }
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.onreadystatechange=function() {
        if (this.readyState==4 && this.status==200) {
            var obj = JSON.parse(this.responseText)
            var o =""
            for (let i = 0; i < obj.predictions.length; i++) {
                o+="<div class='point' onclick='setHint(this)'>"+obj.predictions[i].description+"</div>"
            }
            document.getElementById("livesearch").innerHTML= o;
        }
    }
    xmlhttp.open("GET","/autocomplete?q="+str,true);
    xmlhttp.send();

}
function setHint(o){
    document.getElementById(`point`).value=o.innerText;
    document.getElementById("livesearch").innerHTML="";
}