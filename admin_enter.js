console.log('Admin_Enter.js Loaded');

let time = -1;

document.addEventListener('keydown', function(event) {
    seeIfAdmin(event);
});

function seeIfAdmin(event) {
    if (!event) return;
    if (event.ctrlKey) {
        if (time === -1) {
            time = new Date().getTime();
        }
        console.log(new Date().getTime() - time);
    }
}
