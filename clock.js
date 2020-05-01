console.log('alhamdulillah');




const minute = document.getElementById('min');
const second = document.getElementById('sec');
const q1 = document.getElementById('q11');
const q2 = document.getElementById('q12');
const q3 = document.getElementById('q13');
const pnts = document.getElementById('pnts');

let interval = 30;
let ans1, ans2, ans3;
let correct = 0;
let points = 0;

var timecounter = setInterval(() => {
    pnts.innerHTML = points;
    if(interval == 0) {
      clearInterval(timecounter);
    }
    if(interval % 10 == 0) {
      makeQuestion(interval)
    }
    if(correct == 3) {
      interval += 10;
      correct = 0;
    }
    second.innerHTML = --interval;
}, 1500);

function makeQuestion(sec) {
  
  //console.log('hit');
  let threshold = sec / 2 ;
  let min = threshold - 5;

  let a = Math.floor(Math.random() * (threshold - min + 1)) + min;
  let b = Math.floor(Math.random() * (threshold - 1 - min + 1)) + min;
  ans1 = a+b;
  //console.log(a, b, ans1);
  q1.innerHTML = a + " + " + b + "= ?";
  a = Math.floor(Math.random() * (threshold - min + 1)) + min;b = Math.floor(Math.random() * (threshold - 1 - min + 1)) + min;  console.log(a, b);
  q2.innerHTML = a + " + " + b + "= ?";
  ans2 = a+b;
  //console.log(a, b, ans2);
  a = Math.floor(Math.random() * (threshold - min + 1)) + min;
  b = Math.floor(Math.random() * (threshold - 1 - min + 1)) + min;  console.log(a, b);
  q3.innerHTML = a + " + " + b + "= ?";
  ans3 = a+b;
  //console.log(a, b, ans3);
}

function response1() {
  //console.log(ans1, interval);

  if(ans1 == interval) {
    //console.log('correct');
    points++;
    correct++;
  }else console.log('incorrect');
  
}

function response2() {
  //console.log(ans2, interval);

  if(ans2 == interval) {
    console.log('correct');
    correct++;
    points++;
  }else console.log('incorrect');
}

function response3() {
  console.log(ans3, interval);

  if(ans3 == interval) {
    console.log('correct');
    points++;
    correct++;
  }else console.log('incorrect');
  
}