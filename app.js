//console.log("alhamdulillah");

var point;

function getLinks() {
    $.get('https://cors.io/?https://github.com/MashukeAlam/VarsityCodes', function (response) {
        point = response.match(/\/MashukeAlam\/VarsityCodes\/blob\/master\/([^"]*)/g);
        for(var i = 0; i < point.length; i++) {
            var btn = document.createElement('button');
            var stringorigin = point[i].toString();
            btn.className = 'btn btn-success';
            btn.type = 'button';
            btn.innerHTML = point[i].toString().slice(38, );
            btn.style.marginBottom = 6;
            btn.style.marginLeft = 6;
            btn.onclick = function () {
                //console.log('worked Alhamdulillah');
                //console.log(stringorigin);
                
                window.open('https://github.com' + stringorigin, '_blank');
            }
            document.body.appendChild(btn);

            var newline = document.createElement('br');
            if(i % 5 == 0 && i != 0) document.body.appendChild(newline);            
        } 
    });
}

getLinks();
