var file = './LOG.txt'
const colorScheme = ['#87fc60', '#51ff17', '#2f8c0f']

function justDate (item) {
  return item.split('.')[0].slice(-2);
}

function justFullDate (item) {
    return item.split('.')[0];
}
function readFile (fileLocation) {
  $.get(fileLocation, txt => {
    var arr = txt.split('\n');
    var copied = Array.from(arr.map(justFullDate));
    // console.log(copied);
    
    document.getElementById('latest').innerHTML += "<strong>" + arr[0].replace('.', ' ') + "</strong> to <strong>" + arr[arr.length - 2].replace('.', ' ') + "</strong>";
    arr = arr.map(justDate);

    // console.warn(arr)
    var curr = arr[0]
    var currCount = 1
    var currDay = 0
    for (var i = 1; i < arr.length; i++) {
      if (curr === arr[i]) {
        currCount++
      } else {
        var color
        if (currCount == 1) {
          color = colorScheme[0]
        } else if (currCount == 2) {
          color = colorScheme[1]
        } else if (currCount >= 3) {
          color = colorScheme[2]
        }

        

        document.getElementById(
          currDay.toString()
        ).innerHTML += `<td title="${copied[i]}" bgcolor="${color}"></td>`
        curr = arr[i]
        currCount = 1
        currDay = (currDay + 1) % 7
        //console.log(currDay);
      }
    }
  })
}

// console.warn('Alhamdulillah')
readFile(file)
