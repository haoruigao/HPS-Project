function setup() {
	width = document.getElementById('game-container').offsetWidth - 100;
	containerHeight = window.innerHeight;
	height = width * 3 / 4 - width / 6;

	canvas = createCanvas(width, Math.max(height, containerHeight * 3 / 4)); // ~4:3 aspect ratio
	canvas.parent('game-container');

	button = createButton('Next');
	button.position(width - 150, height - 50);
	button.parent('game-container');
	button.attribute('class', 'btn btn-success');
	button.attribute('id', 'next_button');
	button.mousePressed(before_test);
	console.log("steup");
}

var game;

var num_players = 2;
var num_rounds = 13;
var message = '';

function before_test(){
	for (let i = 1; i <= 2; i ++){
		if (game.player_list[i-1].card == -1){
			alert(document.getElementById("player_"+ i + "_name").value + " please confirm a card first");
			return;
		}
		if (game.player_list[i-1].decision == -1){
			alert(document.getElementById("player_"+ i + "_name").value + " please select compete or discard");
			return;
		}
	}
	nextTurn();
}

function converter(card_value){
	if (card_value == 11){
		return 'J';
	}
	if (card_value == 12){
		return 'Q';
	}
	if (card_value == 13){
		return 'K';
	}
	if (card_value == 14){
		return 'A';
	}
	if (card_value == 15){
		return '2';
	}
	return card_value;
}

function resetGame() {
	if (confirm("Start a new game?") == true) {
		window.location.reload();
	}
}

function startGame() {

	console.log("starting the game");

	$("#num_players").attr("disabled", "disabled");
	$("#num_rounds").attr("disabled", "disabled");
	$("#game_start").attr("disabled", "disabled");

	game = new Game();
	initial_players();
	//	var x = document.getElementById('score_table').rows[1].cells;
	//	x[0].innerHTML = 150;
}

function get_list(player_index) {
	var values = [];
	for (let i = 3; i < 16; i ++){
		if (game.player_list[player_index].card_list[i-3]){
			values.push(i);
		}
	}
	return values;
}

function update_player_choice(player_index) {
	var values = [];
	for (let i = 3; i < 16; i ++){
		if (game.player_list[player_index].card_list[i-3]){
			values.push(i);
		}
	}
	var cur_select = document.getElementById("select"+(player_index+1).toString());
 
	for (const val of values)
	{
		var option = document.createElement("option");
		option.value = val;
		option.text = converter(val);
		cur_select.appendChild(option);
	}
}

function initial_players() {
	for (let i = 1; i <= num_players; i++) {
		var player_div = document.createElement('div');
		player_div.style.width = '230px';
		player_div.style.display = 'inline-block';

		var la = document.createElement('label');
		la.innerHTML = document.getElementById("player_" + i + "_name").value;
		la.style.width = '50px';
		la.style.margin = '5px';
		player_div.appendChild(la);


		// var input_area = document.createElement('input');
		// input_area.setAttribute('id', 'input' + i.toString());
		// input_area.style.width = '65px';
		// input_area.style.margin = '5px';
		// player_div.appendChild(input_area);

		var values = get_list(i-1);
 
		var select = document.createElement("select");
		select.setAttribute('id', 'select' + i.toString());
	 
		for (const val of values)
		{
			var option = document.createElement("option");
			option.value = val;
			option.text = converter(val);
			select.appendChild(option);
		}

		player_div.appendChild(select);
		

		var button = document.createElement('button');
		button.setAttribute('id', 'button' + i.toString());
		button.style.width = '60px';
		button.style.height = '30px';
		button.style.marginLeft = '5px';
		button.style.marginRight = '30px';
		button.style.background = '#95CB97';
		button.innerHTML = 'confirm';
		button.onclick = function () {
			var face_val = document.getElementById('select' + i.toString()).value;
			if (face_val == "A"){
				face_val = 14;
			}
			else if (face_val == "2"){
				face_val = 15;
			}
			else if (face_val == "J"){
				face_val = 11;
			}
			else if (face_val == "Q"){
				face_val = 12;
			}
			else if (face_val == "K"){
				face_val = 13;
			}
			var card = parseInt(face_val);
			if (isNaN(card)) {
				// haven't entered a number
				alert("please enter a number");
				return;
			}
			if (face_val > 15 || face_val < 3) {
				// haven't entered a number
				alert("please enter a valid number");
				return;
			}

			if (game.player_list[i - 1].card_list[face_val-3] == false){
				// haven't entered a number
				alert("Duplicate, change card");
				return;
			}
			game.player_list[i - 1].card = card;
			//document.getElementById('input' + i.toString()).value = "decision?";
			//$("#input" + i.toString()).attr("disabled", "disabled");
			$("#button" + i.toString()).attr("disabled", "disabled");
			$("#discard" + i.toString()).removeAttr("disabled");
			$("#compete" + i.toString()).removeAttr("disabled");
		};
		player_div.appendChild(button);

		// Discard/Compete
		var discard = document.createElement('button');
		discard.setAttribute('id', 'discard' + i.toString());
		discard.style.width = '60px';
		discard.style.height = '30px';
		discard.style.marginLeft = '5px';
		discard.style.marginRight = '30px';
		discard.innerHTML = "Discard";
		discard.onclick = function () {
			if (game.player_list[i - 1].card == -1) {
				// haven't entered a number
				alert("please select a card first");
				return;
			}
			game.player_list[i - 1].decision = 0;
			$("#discard" + i.toString()).attr("disabled", "disabled");
			$("#compete" + i.toString()).attr("disabled", "disabled");
			// after press: clear it
			document.getElementById("select"+(i).toString()).innerHTML = "";
			// var options = cur_select.children;
			// for (let i = 0; i < options.length; i++){
			// 	var option = options[i];
			// 	console.log("start removing" + option);
			// 	cur_select.removeChild(option);
			// }	
		};
		$("#discard" + i.toString()).attr("disabled", "disabled");
		player_div.appendChild(discard);

		var compete = document.createElement('button');
		compete.setAttribute('id', 'compete' + i.toString());
		compete.style.width = '70px';
		compete.style.height = '30px';
		compete.style.marginLeft = '5px';
		compete.style.marginRight = '30px';
		compete.innerHTML = "Compete";

		compete.onclick = function () {
			if (game.player_list[i - 1].card == -1) {
				// haven't entered a number
				alert("please select a card first");
				return;
			}
			game.player_list[i - 1].decision = 1;
			$("#discard" + i.toString()).attr("disabled", "disabled");
			$("#compete" + i.toString()).attr("disabled", "disabled");
			// Send the info (store the info)
			document.getElementById("select"+(i).toString()).innerHTML = "";
		};
		$("#compete" + i.toString()).attr("disabled", "disabled");
		player_div.appendChild(compete);

		console.log("finish using discrad and competet" + i);

		document.getElementById('players').appendChild(player_div);
	}
}

function nextTurn() {
	// Reach the final state
	// Whichever rounds, we should check the result first
	var index_1 = 0;
	var index_2 = 1;
	var d_1 = parseInt(game.player_list[index_1].decision);
	var d_2 = parseInt(game.player_list[index_2].decision);
	var card_1 = parseInt(game.player_list[index_1].card);
	var card_2 = parseInt(game.player_list[index_2].card);
	// Compare value from last rounds
	if (d_1 == 0 && d_2 != 0) {
		game.player_list[index_2].score += card_2;
		game.message.update_message(document.getElementById("player_1_name").value + ' gave up card ' + converter(card_1) + '<br>' + document.getElementById("player_2_name").value + ' competed with card ' + converter(card_2) + 
		"<br>" + document.getElementById("player_1_name").value + " score: " + game.player_list[index_1].score + "<br>" + document.getElementById("player_2_name").value + " score: " + game.player_list[index_2].score);
	}
	else if (d_1 != 0 && d_2 == 0) {
		game.player_list[index_1].score += card_1;
		game.message.update_message(document.getElementById("player_1_name").value + ' competed with card ' + converter(card_1) + '<br>' + document.getElementById("player_2_name").value + ' gave up card ' + converter(card_2) + "<br>" + 
		document.getElementById("player_1_name").value + " score: " + game.player_list[index_1].score + "<br>" + document.getElementById("player_1_name").value + " score: " + game.player_list[index_2].score);
	}
	else if (d_1 != 0 && d_2 != 0){
		if (card_1 > card_2){
			game.player_list[index_1].score += card_1 + card_2;
		}
		else if (card_2 > card_1){
			game.player_list[index_2].score += card_1 + card_2;
		}
		game.message.update_message(document.getElementById("player_1_name").value + ' competed with card ' + converter(card_1) + "<br>" + document.getElementById("player_2_name").value + ' competed with card ' + converter(card_2) + "<br>" + 
		document.getElementById("player_1_name").value + " score: " + game.player_list[index_1].score + "<br>" + document.getElementById("player_2_name").value + " score: " + game.player_list[index_2].score);
	}
	else{
		game.message.update_message(document.getElementById("player_1_name").value + ' gave up card ' + converter(card_1) + '<br> ' + document.getElementById("player_2_name").value + ' gave up card ' + 
		converter(card_2) + "<br>" + document.getElementById("player_1_name").value + " score: " + game.player_list[index_1].score + "<br>" + document.getElementById("player_2_name").value + " score: " + game.player_list[index_2].score);
	}
	// update the score table, so people could refer to
	update_the_log(1, game.current_round, converter(card_1));
	update_the_log(2, game.current_round, converter(card_2));

	if (game.current_round == num_rounds) {
		// Reach the End
		if (game.player_list[index_1].score > game.player_list[index_2].score){
			game.message.update_message(document.getElementById("player_1_name").value + " wins!");
		}
		else if (game.player_list[index_1].score < game.player_list[index_2].score){
			game.message.update_message(document.getElementById("player_2_name").value  + " wins!");
		}
		else{
			game.message.update_message("Draw!");
		}
		for (let i = 0; i < num_players; i++) {
			var last_card = game.player_list[i].card;
			game.player_list[i].card_list[last_card-3] = false;
			game.player_list[i].decision = -1;
			game.player_list[i].card = -1;
		}

		update_player_choice(0);
		update_player_choice(1);
	}
	else {
		game.current_round += 1;

		for (let i = 0; i < num_players; i++) {
			var last_card = game.player_list[i].card;
			game.player_list[i].card_list[last_card-3] = false;
			game.player_list[i].decision = -1;
			game.player_list[i].card = -1;
		}

		update_player_choice(0);
		update_player_choice(1);

		for (let i = 1; i <= num_players; i++) {
			//document.getElementById('input' + i.toString()).value = '';
			//$("#input" + i.toString()).removeAttr("disabled");
			$("#button" + i.toString()).removeAttr("disabled");
		}

	}
}
function update_the_log(player, round, value){
	console.log("updating");
	var x = document.getElementById('score_table').rows[player].cells;
	console.log("var", x);
	console.log("round", round);
	x[round].innerHTML = value;
}

class Player {

	constructor() {
		this.card = -1;
		// decision = 1: compete; decision = 0: discard; decision = -1 nor decide
		this.decision = -1;
		this.score = 0;
		this.card_list = []
		for (let j = 3; j < 16; j++) {
			this.card_list.push(true);
		}
	}
}

class Scoreboard {

	constructor() {
		var ta = document.createElement('table');

		ta.setAttribute('id', 'score_table');
		ta.style.width = '800px';
		ta.style.border = '2px solid black';
		ta.style.textAlign = 'center';
		ta.style.fontSize = '20px';

		var header_tr = ta.insertRow();
		var head_td1 = header_tr.insertCell();
		head_td1.appendChild(document.createTextNode('Player'));
		head_td1.style.border = '1px solid black';
		
		for (let i = 1; i <= 13; i++){
			var head_td = header_tr.insertCell();
			head_td.appendChild(document.createTextNode('Round-'+i));
			head_td1.style.border = '1px solid black';
		}

		for (let i = 1; i <= num_players; i++) {
			var content_tr = ta.insertRow();
			var content_td1 = content_tr.insertCell();
			content_td1.appendChild(document.createTextNode(document.getElementById("player_" + i + "_name").value));
			content_td1.style.border = '1px solid black';

			for (let i = 1; i <= 13; i++){
				var head_td = content_tr.insertCell();
				head_td.appendChild(document.createTextNode(""));
				head_td.style.border = '1px solid black';
			}
		}

		document.getElementById('scoreboard').appendChild(ta);
	}

}

class Message {
	// Print the message: Player 1 gives: xx (Compete), Player 2 gives xx (Compete)
	// The current score is: Player 1: xx, Player 2: xx.

	constructor() {
		var el = document.getElementById("casino");
		el.innerHTML = "<img src=\'casino.png\' width=\'200px\' height=\'200px\'>";

		this.info = "Pleae select one card, and your decision to compete or discard";
		this.update_message(this.info);
	}

	update_message(info) {
		var el = document.getElementById("message");
		el.innerHTML = "<div class=\"bubble\"> <font size=\"+1\"> " + info + "</font></div>";
	}

}

class Game {

	constructor() {
		this.current_round = 1;
		this.message = new Message();
		this.scoreboard = new Scoreboard();
		this.player_list = [];
		for (let i = 0; i < num_players; i++) {
			var player = new Player();
			this.player_list.push(player);
		}
	}
}