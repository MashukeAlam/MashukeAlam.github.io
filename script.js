	console.log('Alhamdulillah');
	
	var db = firebase.database();
	var ref = db.ref('questions');

	function yclk(id) {
		firebase.database().ref().child('/posts/' + newPostKey)
        .update();
	}

	function nclk() {
		
	}

	function oclk() {
		
	}

	ref.on('value', function(snapshot) {
      let snap = snapshot.val();
      for (i in snap){
           var div = document.createElement("DIV");
           var desc = document.createElement("H4");
           var ybtn = document.createElement("BUTTON");
           var nbtn = document.createElement("BUTTON");
           var obtn = document.createElement("BUTTON");
           console.log( snapshot.key)
      		div.id = snap[i]['qid'];
      		desc.innerHTML = "" + snap[i]['desc']
      		ybtn.innerHTML = "Yes " + snap[i]['y_cnt']
      		ybtn.id = snap[i]['qid'];
      		nbtn.id = snap[i]['qid'];
      		obtn.id = snap[i]['qid'];
      		nbtn.innerHTML = "No " + snap[i]['n_cnt']
      		obtn.innerHTML = "No opinion " + snap[i]['o_cnt']
      		ybtn.onclick = function() {
      			updateValY(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		nbtn.onclick = function() {
      			updateValN(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		obtn.onclick = function() {
      			updateValO(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		div.appendChild(desc);
      		div.appendChild(ybtn);
      		div.appendChild(nbtn);
      		div.appendChild(obtn);
      		document.getElementById('qs-votes').appendChild(div);
  }
  });




	function updateValY(id, btnid) {
		var now = parseInt(id.substring(4));
		now++;

		console.log(now, this.innerHTML)
		firebase.database().ref().child('/questions/' + btnid)
        .update({y_cnt: now});

        document.getElementById(btnid).innerHTML = "Yes " + now;
	}

	function updateValN(id, btnid) {
		var now = parseInt(id.substring(3));
		now++;

		console.log(now)
		firebase.database().ref().child('/questions/' + btnid)
        .update({n_cnt: now});
	}

	function updateValO(id, btnid) {
		var now = parseInt(id.substring(10));
		now++;

		console.log(now)
		firebase.database().ref().child('/questions/' + btnid)
        .update({o_cnt: now});
	}


	function init() {
		ref.on('value', function(snapshot) {
      let snap = snapshot.val();
      for (i in snap){
           var div = document.createElement("DIV");
           var desc = document.createElement("H4");
           var ybtn = document.createElement("BUTTON");
           var nbtn = document.createElement("BUTTON");
           var obtn = document.createElement("BUTTON");
           console.log( snapshot.key)
      		div.id = snap[i]['qid'];
      		desc.innerHTML = "" + snap[i]['desc']
      		ybtn.innerHTML = "Yes " + snap[i]['y_cnt']
      		ybtn.id = snap[i]['qid'];
      		nbtn.id = snap[i]['qid'];
      		obtn.id = snap[i]['qid'];
      		nbtn.innerHTML = "No " + snap[i]['n_cnt']
      		obtn.innerHTML = "No opinion " + snap[i]['o_cnt']
      		ybtn.onclick = function() {
      			updateValY(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		nbtn.onclick = function() {
      			updateValN(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		obtn.onclick = function() {
      			updateValO(this.innerHTML, this.id)
      			document.getElementById('qs-votes').innerHTML = "";
      			init();
      		}
      		div.appendChild(desc);
      		div.appendChild(ybtn);
      		div.appendChild(nbtn);
      		div.appendChild(obtn);
      		document.getElementById('qs-votes').appendChild(div);
  }
  });

	}