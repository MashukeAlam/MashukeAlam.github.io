function verify_this_sucker() {
    if (typeof $ === 'undefined' || typeof $.getJSON !== 'function') return;

    $.getJSON('https://ipapi.co/json/', function(data) {
        if (!data || !data.ip) return;
        var my_ip = data.ip;
        $.getJSON("/data/ips.json", function(json) {
            if (!json || !Array.isArray(json.restricted_ip)) return;
            var blocked = json.restricted_ip;
            for(var i = 0; i < blocked.length; i++) {
                if(blocked[i] === my_ip) {
                    window.location = "blocked.html";
                    break;
                }
            }
        }).fail(function() {
            // Silently ignore if ips.json is not available
        });
    }).fail(function() {
        // Silently ignore if external IP lookup is blocked
    });
}

verify_this_sucker();