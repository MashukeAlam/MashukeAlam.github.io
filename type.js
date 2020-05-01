let QUOTES = ["The ink of the scholar is more holy than the blood of the martyr.",
    "The beginning of wisdom is a definition of terms. ",
    "What a lot of things there are a man can do without.",
    "I cannot teach anybody anything. I can only make them think.",
    "Slanderers do not hurt me because they do not hit me.",
    "He who is not contented with what he has, would not be contented with what he would like to have.",
    "If a man is proud of his wealth, he should not be praised until it is known how he employs it.",
    "Where there is reverence there is fear, but there is not reverence everywhere that there is fear, because fear presumably has a wider extension than reverence.",
    "They are not only idle who do nothing, but they are idle also who might be better employed.",
    "Our prayers should be for blessings in general, for God knows best what is good for us.",
    "I only wish that ordinary people had an unlimited capacity for doing harm; then they might have an unlimited power for doing good.",
    "How many are the things I can do without!",
    "I was really too honest a man to be a politician and live.",
    "Ordinary people seem not to realize that those who really apply themselves in the right way to philosophy are directly and of their own accord preparing themselves for dying and death.",
    "A system of morality which is based on relative emotional values is a mere illusion, a thoroughly vulgar conception which has nothing sound in it and nothing true.",
    "By all means marry. If you get a good wife you will become happy, and if you get a bad one you will become a philosopher.",
    "Nature has given us two ears, two eyes, and but one tongue-to the end that we should hear and see more than we speak.",
    "In childhood be modest, in youth temperate, in adulthood just, and in old age prudent.",
    "The end of life is to be like God, and the soul following God will be like Him.",
    "We are in fact convinced that if we are ever to have pure knowledge of anything, we must get rid of the body and contemplate things by themselves with the soul by itself.",
    "No man undertakes a trade he has not learned, even the meanest; yet everyone thinks himself sufficiently qualified for the hardest of all trades, that of government.",
    "The only good is knowledge and the only evil is ignorance.",
    "The nearest way to glory is to strive to be what you wish to be thought to be.",
    "Be slow to fall into friendship; but when thou art in, continue firm and constant."]




var p = document.getElementById("quotes2Type");
var box = document.getElementById("typebox");
var typed = document.getElementById("typed");
var btn = document.getElementById("btn");
var sec = document.getElementById("seconds");
let currentWord;
let currentIndx;
let selectedQuote = [];
let SPACE = 32;
let RETURN = 13;
var PERSON;
var TIME = 0;
var str;
var timer;

//FIREBASE
var db = firebase.database();
var REF = db.ref('scores_typing');
var playersInfo = [];

box.value = "";
box.style.width = window.innerWidth;
function Player(name, score) {
    this.name = name;
    this.score = score;
}

function init() {
    box.value = "";
    var indx = Math.floor(Math.random() * QUOTES.length);
    p.innerHTML = QUOTES[indx];
    selectedQuote = QUOTES[indx].split(" ");
    currentIndx = 0;
    currentWord = selectedQuote[currentIndx];
    box.focus();
}

box.onkeyup = function (e) {
    var key = e.keyCode;

    //console.log('alhamdulillah');

    if (key == RETURN) {

        
            var finalType = str;
            finalType = finalType.replace(/\s+$/, '');
            //console.log(finalType);
            
            if (finalType == p.innerHTML) {
                typed.innerHTML = "";
                typed.style.color = "green";
                str = "";
                box.value = "";
                clearInterval(timer);
                let wpm = Math.floor(selectedQuote.length / (TIME / 60));
                PERSON = prompt("Done! \n Your performance was " + wpm + " WPM", "");
                typed.innerHTML = finalType;
                if(PERSON != null) {
                    submitScoreBabe(wpm);
                } 
            } else {
                var end = finalType.split(" ");
                for(var i =0; i < selectedQuote.length; i++) {
                    var matched = end[i] == selectedQuote[i];
                    if(!matched) {
                        //console.log(end[i], selectedQuote[i]);
                        var color = "red";
                        var errSpan = "<span style = 'background-color: " + color + ";'>" + selectedQuote[i] + "</span>";
                        //break;
                        typed.innerHTML += errSpan + " ";
                    }else {
                        typed.innerHTML += end[i] + " ";
                    }
                }
            }
            //console.log(finalType);

        
    } else {
        str = this.value;
    }
}

function clicked() {
    init();
    btn.style.visibility = "hidden";
    timer = setInterval(() => {
        TIME++;
        sec.innerHTML = TIME + " seconds";
    }, 1000);
}

function humiliate() {
    typed.style.backgroundColor = "red";
    typed.style.fontStyle = "bold | italic";
    typed.innerHTML = "Hey cheater! Don't copy paste damn it!\nThis page will reload after 5 seconds.";
    setTimeout(() => {
        window.location.reload(false);
    }, 5000);
    return false;
}
function submitScoreBabe(x) {
    //console.log('here');
    
    var data2Push = {
        name: PERSON,
        browser: navigator.userAgent,
        score: x
    }
    REF.push(data2Push); 
    REF.on('value', gotdata, errdata);
    
    function gotdata(data) {
        var s = data.val();
        var keys = Object.keys(s);
        //console.log(keys);

        for(var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var name = s[k].name;
            var point = s[k].score;
            //console.log(name, point);
            var p = new Player(name, point);
            playersInfo.push(p);
        }
        
        playersInfo.sort(comp);
        //console.log(playersInfo);
        makeTable(playersInfo);        
    }

    function errdata(err) {
        console.log(err);
        
    }
}

function makeTable(a) {
    //console.log(a);
    
    for(var i = a.length - 1; i >= 0; i--) {
        var p = document.createElement('p');
        p.style.marginBottom = 6;
        p.style.marginLeft = 6;
        p.style.fontSize = 12;
        var rank = a.length - i;
        if(a[i].name == PERSON) {
            p.style.backgroundColor = "pink";
        } else {
            p.style.backgroundColor = "white";
        }
        p.innerHTML ="Rank #" + rank +  ": |Name: " + a[i].name + "   | Score: " + a[i].score + "WPM";
        if(a.length - i <= 3) {
                p.style.color = "green";
                p.style.fontStyle = "italic";
                p.style.fontWeight = "bold";
        }
        document.body.appendChild(p);
    }
   
}

function comp(a, b) {
    if(a.score > b.score) return 1;
    if(a.score < b.score) return -1;
    return 0;
}

