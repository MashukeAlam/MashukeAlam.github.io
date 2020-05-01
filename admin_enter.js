console.log('Admin_Enter.js Loaded');

let time = -1;

setInterval(seeIfAdmin(event), 1000);

function seeIfAdmin(event) {
    
    if(event.ctrlKey) {
        if(time == -1) {
            time = new Date().getTime();
            //console.log(time);
        }
        //console.log(new Date().getMilliseconds());
        
        console.log(new Date().getTime() - time);
    }    
}
