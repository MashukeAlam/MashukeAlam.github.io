const database = firebase.firestore();
var gameRef = database.collection('user').doc('tictac');
var currentTurn = 'o';
var currentPlayer = 1;
var grid = [-1, -1, -1, -1, -1, -1, -1, -1, -1]

function print() {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var p = grid[i][j];
            ////console.log(p);
            ////console.log(" ");
        }
        //console.log('\n');

    }
}


var write = function (x) {
    gameRef.update({
        player : x
    }).then(function () {
        //console.log("Alhamdulillah", x);

    }).catch(function (err) {
        //console.log("Astagfirullah", err);

    });
}


var draw = function(g) {
    for (var i = 0; i < 9; i++) {
        if(g[i] === -1) continue;
        switch (i) {
            case 0:
                cell1.innerHTML = g[i];
                break;
            case 1:
                cell2.innerHTML = g[i];
                break;
            case 2:
                cell3.innerHTML = g[i];
                break;
            case 3:
                cell4.innerHTML = g[i];
                break;
            case 4:
                cell5.innerHTML = g[i];
                break;
            case 5:
                cell6.innerHTML = g[i];
                break;
            case 6:
                cell7.innerHTML = g[i];
                break;
            case 7:
                cell8.innerHTML = g[i];
                break;
            case 8:
                cell9.innerHTML = g[i];
                break;
            default:
                break;
        }
    }   
}


var read = function () {
    gameRef.onSnapshot(function (doc) {
        if (doc && doc.exists) {
            var data = doc.data().player;
            grid = data;
            //console.log(grid);
            
            draw(grid);
        }
    })
}

var checkAndUpdate = function (id) {
    document.getElementById(id).innerHTML = currentTurn;
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

}
//tictacccc
var cell1 = document.getElementById('row00');
var cell2 = document.getElementById('row01');
var cell3 = document.getElementById('row02');
var cell4 = document.getElementById('row10');
var cell5 = document.getElementById('row11');
var cell6 = document.getElementById('row12');
var cell7 = document.getElementById('row20');
var cell8 = document.getElementById('row21');
var cell9 = document.getElementById('row22');

document.getElementById('row00').addEventListener("click", function () {
    document.getElementById('row00').innerHTML = currentTurn;
    grid[0] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);
    //print();

});
document.getElementById('row01').addEventListener("click", function () {
    document.getElementById('row01').innerHTML = currentTurn;
    grid[1] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row02').addEventListener("click", function () {
    document.getElementById('row02').innerHTML = currentTurn;
    grid[2] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row10').addEventListener("click", function () {
    document.getElementById('row10').innerHTML = currentTurn;
    grid[3] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row11').addEventListener("click", function () {
    document.getElementById('row11').innerHTML = currentTurn;
    grid[4] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row12').addEventListener("click", function () {
    document.getElementById('row12').innerHTML = currentTurn;
    grid[5] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row20').addEventListener("click", function () {
    document.getElementById('row20').innerHTML = currentTurn;
    grid[6] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row21').addEventListener("click", function () {
    document.getElementById('row21').innerHTML = currentTurn;
    grid[7] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);

});
document.getElementById('row22').addEventListener("click", function () {
    document.getElementById('row22').innerHTML = currentTurn;
    grid[8] = currentTurn;
    write(grid)
    if (currentTurn === 'o') currentTurn = 'x';
    else currentTurn = 'o';
    //console.log(currentTurn);
    read();
});
write(grid)
read();

class cell {
    constructor(id) {
        this.value = null;
        this.id = id;
    }
    click(p) {
        this.value = p;
    }
}


///////
///////
///////
///////










var p;
var me;
var chatRef = database.collection('user').doc('chat');
var box = document.getElementById('chatBox');
var btn = document.getElementById("btn");

box.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        if (btn.innerHTML == "Submit Name") {
            var person = prompt("Please enter your name", "Harry Potter");
            if (person != null) {
                me = person;
            }
            btn.innerHTML = "Submit";
            //document.getElementById('myText').style.visibility = 'hidden';
            document.getElementById('chatBox').style.visibility = 'visible';

        } else if (btn.innerHTML == "Submit") {
            var str = document.getElementById("chatBox").value;
            writeChat(me + "::- " + str);
            document.getElementById("chatBox").value = "";
        }
    }
});

btn.addEventListener('click', function () {
    if (btn.innerHTML == "Submit Name") {
        var person = prompt("Please enter your name", "Harry Potter");
        if (person != null) {
            me = person;
        }
        btn.innerHTML = "Submit";
        //document.getElementById('myText').style.visibility = 'hidden';
        document.getElementById('chatBox').style.visibility = 'visible';

    } else if (btn.innerHTML == "Submit") {
        var str = document.getElementById("chatBox").value;
        writeChat(me + "::- " + str);
        document.getElementById("chatBox").value = "";
    }
});
var writeChatName = function (x) {
    chatRef.update({
        name: x
    }).then(function () {
        //console.log("Alhamdulillah", x);

    }).catch(function (err) {
        //console.log("Astagfirullah", err);
    });
}

var writeChat = function (x) {
    chatRef.update({
        chat: x
    }).then(function () {
        //console.log("Alhamdulillah", x);

    }).catch(function (err) {
        //console.log("Astagfirullah", err);
    });
}
var readChat = function () {
    chatRef.onSnapshot(function (doc) {
        if (doc && doc.exists) {
            var data = doc.data().chat;
            var who = data.split("::-");


            p = document.createElement('p');
            p.innerHTML = data
            p.style.marginBottom = 6;
            p.style.marginLeft = 6;

            if(who[0] === me) {
                p.style.color = "green";
            }else {
                console.log(who[0]);
                
                p.style.color = "red";
                p.style.fontStyle = "italic";
                p.style.fontWeight = "bold";
            }
            //console.log("Alhamdulillah Chat", data);
            document.body.appendChild(p);
            window.scrollTo(0, document.body.scrollHeight);
        }
    })
}


/*
function myFunction() {

    if(btn.innerHTML == "Submit Name") {
        var person = prompt("Please enter your name", "Harry Potter");
        if (person != null) {
            me = person;
        }
        btn.innerHTML = "Submit";
        //document.getElementById('myText').style.visibility = 'hidden';
        document.getElementById('chatBox').style.visibility = 'visible';

    } else if (btn.innerHTML == "Submit") {
        var str = document.getElementById("chatBox").value;
        writeChat(me + "::" + str);
        document.getElementById("chatBox").value = "";
    }
}*/
readChat();