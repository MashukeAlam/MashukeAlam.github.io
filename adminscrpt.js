var db = firebase.database();
var ref = db.ref('questions');
var QID = 0;
function submitShit() {
	QID++;
	console.log('ffffff')
	var bx = document.getElementById('typebox');
	console.log(bx.value);
	
	var nw_qs = {
		desc: bx.value,
		y_cnt:0,
		n_cnt:0,
		o_cnt:0,
		qid:QID
	}
	ref.child(QID).set(nw_qs);
}

ref.on('value', function(snapshot) {
      let snap = snapshot.val();
      for (i in snap){
       console.log("\n" + i);
       console.log(snap[i]['y_cnt'])
       QID = snap[i]['qid']     
      
  }
  });
