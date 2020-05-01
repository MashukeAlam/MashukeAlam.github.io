var db = firebase.database();
var ref = db.ref('visitor-count');
var currentVisitorCount = 0;


function increment(updateVal, time, reset) {
    
    if(reset) {
        updateVal = 1;
    }

    firebase.database().ref().child('/visitor-count')
    .update({nums : updateVal});

    firebase.database().ref().child('/visitor-count')
    .update({recentTime :  time});

    document.getElementById('visitor-count').innerHTML = updateVal + " visitors today";

   
    
}

function getValueFromFirebase() {
    ref.once('value', function (snapshot) {
        let snap = snapshot.val();
        currentVisitorCount = snap['nums'];
        var resetOrNot = (snap['recentTime'] == 'PM' && getAmPm() == 'AM') ? 1 : 0;
        increment(currentVisitorCount+1, getAmPm(), resetOrNot);
    });
}

function getAmPm() {
    var hours = new Date().getHours();
    var ampm = (hours >= 12) ? "PM" : "AM";
    return ampm;
}

getValueFromFirebase();


