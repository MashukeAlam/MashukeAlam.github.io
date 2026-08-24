// var statRes;
//
// var settingsStat = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/statistics',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY'
//   }
// }
// var settingsHist = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/history?country=Bangladesh',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY'
//   }
// }
// var settingsCountr = {
//   async: true,
//   crossDomain: true,
//   url: 'https://covid-193.p.rapidapi.com/countries',
//   method: 'GET',
//   headers: {
//     'x-rapidapi-host': 'covid-193.p.rapidapi.com',
//     'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY'
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