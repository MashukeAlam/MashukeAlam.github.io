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

init();



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
          div.class = "q-cl";
          // border: 2px solid red;
          // padding: 10px;
          // border-radius: 25px;
          div.style.cssText = 'border: 2px solid #aaf0ed;padding: 10px;border-radius: 15px;margin:10px;background-image: linear-gradient(to bottom right, #0cfabf, #73ffef);'
      		desc.innerHTML = "" + snap[i]['desc'];
          desc.style.cssText = 'font-family: serif;color: #4e5c5a'
          desc.align = 'center';
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
