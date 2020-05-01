// var statRes;

// var settingsStat = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/statistics',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': '90d317fc49msh564e16f50b822d3p1aaee0jsnc63c76e50fb6'
//   }
// }
// var settingsHist = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/history?country=Bangladesh',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': '90d317fc49msh564e16f50b822d3p1aaee0jsnc63c76e50fb6'
//   }
// }
// var settingsCountr = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/countries',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': '90d317fc49msh564e16f50b822d3p1aaee0jsnc63c76e50fb6'
//   }
// }

// function statCheck () {
//   $.ajax(settingsStat).done(function (response) {
//     return response
//   })
// }

// $.ajax(settingsHist).done(function (response) {
//   console.log(response)
// })

// $.ajax(settingsCountr).done(function (response) {
//   console.log(response)
// })

// console.log(statCheck())










YUI().use('yql', function(Y) {

    Y.YQL('select * from weather.forecast where location=90210', function(r) {
        //r now contains the result of the YQL Query
		//use the YQL Developer console to learn
		//what data is coming back in this object
		//and how that data is structured.
    });

});