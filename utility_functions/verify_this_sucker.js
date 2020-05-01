function verify_this_sucker() {

$.getJSON('https://ipapi.co/json/', function(data) {
    var my_ip = JSON.stringify( data['ip'] );
    //console.log(my_ip);
    $.getJSON("/data/ips.json", function(json) {
      console.log(json['restricted_ip']); // this will show the info it in firebug console
      //console.log('here');
      var blocked = json['restricted_ip'];
      for(var i = 0; i < blocked.length; i++) {
          if(JSON.stringify(blocked[i]) === my_ip) {
              window.location = "blocked.html"
          }
          
      }
    });

    
});


}

verify_this_sucker();