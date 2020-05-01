var passLen, genpass, result;
var checkVals = [false, false, false, false];
console.log(passLen);

init()



function init() {
    passLen = document.getElementById('length').value;
    result = document.getElementById('result');
    checkVals[0] = document.getElementById('cap').checked;
    checkVals[1] = document.getElementById('sml').checked;
    checkVals[2] = document.getElementById('num').checked;
    checkVals[3] = document.getElementById('sym').checked;


    var CHARS = ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "1234567890", "!@#$%^&*()-"];
    var POSSIBLECHOICES = "";
    for (let index = 0; index < checkVals.length; index++) {
        if (checkVals[index]) POSSIBLECHOICES += CHARS[index];

    }
    generatePermutations(POSSIBLECHOICES, parseInt(passLen));
    //console.log(POSSIBLECHOICES);
}

function generatePermutations(choices, len) {
    var roughPass = "";
    var finalPass = "";
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    roughPass += Array(len).fill(choices).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');

    console.log("Rough Password: " + roughPass.length);
    finalPass = Array(len).fill(roughPass).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    console.log("Final Password: " + finalPass.length + "\nFinal Password: " + finalPass);

    return (result.innerHTML = finalPass);

}

function copyPass() {
     // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = result.innerHTML;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   // Remove temporary element
   document.body.removeChild(el);
    
}