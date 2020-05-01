var time = document.getElementById('declare');
var day = document.getElementById('day');
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const colors = [["green", "red"], ["green", "red", "yellow"], ["green", "pink", "purple", "red", "yellow", "orange"], ["green", "rgb(18, 215, 255)"]];
const special_dates = [[16, 11, 0, "Victory Day!"],
[26, 2, 1, "Independence Day!"],
[31, 11, 2, "Last Day!"],
[1, 0, 2, "New Year!"],
[16, 2, 3, "Happy Birthday!"]]
let i = 0;
let _d = new Date().getDate();
let _m = new Date().getMonth();
let _y = new Date().getFullYear();
let is_special = false;
let sp_ind = -1;
let color_ind = -1;
let day_cmnt = -1;

is_special = check(_d, _m);
if (is_special) {
    color_ind = special_dates[sp_ind][2];
    day_cmnt = special_dates[sp_ind][3];
}
//console.log(is_special);

setInterval(() => {

    let _h = new Date().getHours();
    let _mi = new Date().getMinutes();
    let _s = new Date().getSeconds();

    if (_h == 0 && _mi == 0 && _s == 0) {
        let _d = new Date().getDate();
        let _m = new Date().getMonth();
        let _y = new Date().getFullYear();
    }
    if (is_special) animate();
    time.innerHTML = _d + " " + months[_m] + ', ' + _y + ' ' + _h + ":" + _mi + ":" + _s;
    day.innerHTML = day_cmnt;
}, 1000);

function check(d, m) {
    let res = false;
    for (var i = 0; i < special_dates.length; i++) {
        if (special_dates[i][0] == d && special_dates[i][1] == m) {
            //console.log(true);
            sp_ind = i;
            res = true;
        }
        //console.log('gg');

    }
    return res;
}

function animate() {
    time.style.color = colors[color_ind][i++ % colors[color_ind].length];
}