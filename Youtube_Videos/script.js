var url = 'https://www.googleapis.com/youtube/v3/search?key='+config.API_KEY+'&channelId='+config.CHANNEL_ID+'&part=snippet,id&order=date&maxResults=20';


$.getJSON(url, function(json) {
    for(var i = 0; i < json['items'].length; i++) {
        var img_url = json['items'][i]['snippet']['thumbnails']['medium']['url'];
        var yt_vdo_title = json['items'][i]['snippet']['title'];
        var yt_vdo_desc = json['items'][i]['snippet']['description'];
        var publisheDate = json['items'][i]['snippet']['publishedAt'];
        var vdoID = json['items'][i]['id']['videoId'];
        var yt_vdo_url = "https://www.youtube.com/watch?v=" + vdoID;
        var onclick = "onclick=goto("+ "\"" + yt_vdo_url + "\"" +")";
        var custom_div = "<div style=\"background-color: rgb(130, 248, 140);display:flex; flex-direction: row; justify-content: center; align-items: center; padding: 10px; margin: 10px;\"><img " + onclick + " src=" + img_url + " style=\"padding: 20px;\"><div class=\"text\"><h2 style=\"font-size: 30px;\">"+ yt_vdo_title +"</h2></br><p style=\"font-size : 20px;\">"+ yt_vdo_desc +"</p></br>" + "<p>Published:" + publisheDate +"</p>" + "</div></div>";

        document.getElementById('cards').innerHTML += custom_div;
    }
});

function goto(url) {
    console.log('here');
    window.open(url);
}