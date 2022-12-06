<?php
	// check command line arguments
	if($argc < 1 || !is_numeric($argv[1])) {
		echo("[ERROR] Please provide port number\n");
		echo("[ERROR] Example command: php server.php 5000\n");
		exit(-1);
	}

	// start server
	echo("[LOG] Starting server at localhost:$argv[1]\n");

	// open, bind, and begin listening on socket
	$socket = socket_create(AF_INET, SOCK_STREAM, 0);
	socket_bind($socket, 'localhost', $argv[1]);
	// socket_bind($socket, '0.0.0.0', $argv[1]);
	socket_listen($socket, 3);

	$connections;
	$observed = false;
	if($argc == 5 && $argv[4] == "-o") {
		// log status
		echo("[LOG] Waiting for Observer\n");

		// blocking call waiting for connection
		$connections[0] = socket_accept($socket);

		// extra communication to identify client (see comment below for more details on websocket exchange)
		$identification = socket_read($connections[0], 5000);
		if(strpos($identification, "Sec-WebSocket-Key:") !== false) {
			preg_match('#Sec-WebSocket-Key: (.*)\r\n#', $identification, $matches);
			$key = base64_encode(pack('H*', sha1($matches[1] . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
			$headers = "HTTP/1.1 101 Switching Protocols\r\n";
			$headers .= "Upgrade: websocket\r\n";
			$headers .= "Connection: Upgrade\r\n";
			$headers .= "Sec-WebSocket-Version: 13\r\n";
			$headers .= "Sec-WebSocket-Accept: $key\r\n\r\n";
			socket_write($connections[0], $headers, strlen($headers));
			$observed = true;
		}
	}

	// wait for two connections to continue
	$is_websocket;
	$name;
	for($i = 1; $i <= 2; $i++) {
		// log status
		echo("[LOG] Waiting for Player $i\n");

		// blocking call waiting for connection
		$connections[$i] = socket_accept($socket);

		// do extra communication to identify client
		// if a websocket is being used we need to do a handshake
		// all other clients can send whatever they want as long as it doesn't contain "Sec-WebSocket-Key:"
		// identification code based on https://medium.com/@cn007b/super-simple-php-websocket-example-ea2cd5893575
		$identification = socket_read($connections[$i], 5000);
		if(strpos($identification, "Sec-WebSocket-Key:") !== false) {
			preg_match('#Sec-WebSocket-Key: (.*)\r\n#', $identification, $matches);
			$key = base64_encode(pack('H*', sha1($matches[1] . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
			$headers = "HTTP/1.1 101 Switching Protocols\r\n";
			$headers .= "Upgrade: websocket\r\n";
			$headers .= "Connection: Upgrade\r\n";
			$headers .= "Sec-WebSocket-Version: 13\r\n";
			$headers .= "Sec-WebSocket-Accept: $key\r\n\r\n";
			socket_write($connections[$i], $headers, strlen($headers));
			$is_websocket[$i] = true;
			$name[$i] = "Webclient $i";

			// log connection
			echo("[LOG] Player $i connected via websocket\n\n");
		} else {
			$is_websocket[$i] = false;

			$name[$i] = str_replace(array(" ", "\r", "\n"), '', $identification);


			// log connection
			echo("[LOG] Player $i connected via TCP\n\n");
		}
	}

	// send a message to a client over a socket or websocket
	function send_message($client, $message, $is_web) {
		if($is_web) {
			socket_write($client, chr(129) . chr(strlen($message)) . $message);
		} else {
			socket_send($client, $message, strlen($message), 0);
		}
	}

	// compliant masking and decoding based on https://gist.github.com/dg/6205452
	function web_decode($frame) {
		$decoded_frame = "";
		for ($i = 6; $i < strlen($frame); $i++) {
			$decoded_frame .= $frame[$i] ^ $frame[2 + ($i - 2) % 4];
		}
		return $decoded_frame;
	}

	// initialize game
    $results[1] = 0;
    $results[2] = 0;
    $cur_turn[1] = array_fill(1, 2, 0);
    $cur_turn[2] = array_fill(1, 2, 0);
    $num_cards = 26;
	$cards[1] = array_fill(1, 13, true);
	$cards[2] = array_fill(1, 13, true);
	$current_player = 1;

	// send initial data to both players
	send_message($connections[1], "1 \n", $is_websocket[1]);
	send_message($connections[2], "2 \n", $is_websocket[2]);

	// send initial data to observer
	if($observed) {send_message($connections[0], "$name[1] $name[2] \n", true);}

	// both players now have 2 minutes each remaining (120 seconds)
	$time_remaining[1] = 120 * 1000000000;
	$time_remaining[2] = 120 * 1000000000;
	$time_start = hrtime(true);

	// play game
	while($num_cards > 0) {

		// blocking operation waiting for command
		// set a timeout on this operation
		// we will be nice here and round up to account for latency.
		// Ex. if a player has 73.4 seconds remaining, we will give them 74
		socket_set_option($connections[$current_player], SOL_SOCKET, SO_RCVTIMEO,
											array('sec' => intval($time_remaining[$current_player] / 1000000000),
														'usec'=> 0));
		$command = socket_read($connections[$current_player], 1024);

		// in the event of a timeout, forcefully end the game
		// this is done by sending 0 to the current player, -1 to the other player, closing the socket, and exiting
		if(!$command) {
			// send messages to players and close socket
			send_message($connections[$current_player], "0\n", $is_websocket[$current_player]);
			$current_player = ($current_player == 2 ? 1 : 2);
			send_message($connections[$current_player], "-1\n", $is_websocket[$current_player]);

			// send update to observer
			if($observed) {send_message($connections[0], "0\n", true);}

			socket_close($socket);

			// log results
			echo("[LOG] TIMEOUT\n");
			echo("[INFO] PLAYER $current_player WINS!\n\n");

			// exit program
			exit;
		}

		// if coming from a websocket, decode recieved packet
		if($is_websocket[$current_player]) {
			$command = web_decode($command);
		}

		// split and interpret command
		$command = str_replace(array("\r", "\n"), '', $command);
		$command_parts = explode(" ", $command);

		// perform actions based on command and log results
		if($command_parts[0] == "getstate") {
			// send message
			send_message($connections[$current_player], "$num_cards $results[$current_player]\n", $is_websocket[$current_player]);
			
			// log results
			echo("[LOG] -- SENDING STATE --\n");
			echo("[INFO] Current Player: $current_player\n");
			echo("[INFO] Player's hand:");
			for($i = 1; $i <= 13; $i++) {
                $tmp = $i + 2;
				if($cards[$current_player][$i]) {echo(" $tmp");}
			}
			echo("\n");
			echo("[INFO] Move time remaining: $time_remaining[$current_player] microseconds\n\n");
		} else if($command_parts[0] == "sendmove" && $cards[$current_player][$command_parts[1]-2]) {
			// apply timer
			$time_remaining[$current_player] -= hrtime(true) - $time_start;

			// apply move
			$num_cards -= 1;
			$cards[$current_player][$command_parts[1]-2] = false;
            // needs to compare
            if($num_cards % 2 == 0) {
                // log results
                echo("[LOG] -- APPLYING MOVE --\n");
                $cur_turn[$current_player][1] = $command_parts[1];
                $cur_turn[$current_player][2] = $command_parts[2];
                // someone drop
                if ($cur_turn[1][2] == -1 || $cur_turn[2][2] == -1){
                    // both drops
                    if ($cur_turn[1][2] == -1 && $cur_turn[2][2] == -1){
                        echo("[INFO] Both player drop card, player 1: {$cur_turn[1][1]}, player 2: {$cur_turn[2][1]}\n");
                    }
                    # player 1 drop
                    else if ($cur_turn[1][2] == -1){
                        $results[2] += $cur_turn[2][1];
                        echo("[INFO] Player 1 drop card, player 1: {$cur_turn[1][1]}, player 2: {$cur_turn[2][1]}\n");
                    }
                    # player 2 drop
                    else {
                        $results[1] += $cur_turn[1][1];
                        echo("[INFO] Player 2 drop card, player 1: {$cur_turn[1][1]}, player 2: {$cur_turn[2][1]}\n");
                    }
                }
                else{
                    echo("[INFO] Both compete, player 1: {$cur_turn[1][1]}, player 2: {$cur_turn[2][1]}\n");
                    if ($cur_turn[1][1] > $cur_turn[2][1]){
                        $results[1] += $cur_turn[1][1] + $cur_turn[2][1];
                    }
                    else if ($cur_turn[1] < $cur_turn[2]){
                        $results[2] += $cur_turn[2][1] + $cur_turn[1][1];
                    }
                }
                echo("[INFO] PLAYER 1 score: $results[1], PLAYER 2 score: $results[2]\n");
                echo("\n");
                # start over new round
                $cur_turn[1][1] = 0;
                $cur_turn[2][1] = 0;
                
            }
            else{
                $cur_turn[$current_player][1] = $command_parts[1];
                $cur_turn[$current_player][2] = $command_parts[2];
            }


			// send update to observer
			if($observed) {send_message($connections[0], "$time_remaining[$current_player]\n", true);}

			// Alternate players and display the message if the game isn't over
			$current_player = ($current_player == 2 ? 1 : 2);
			//if($num_cards > 0) {echo("[INFO] ===[PLAYER $current_player's TURN]===\n");}

			// start timer for next player
			$time_start = hrtime(true);
		} else {
			// log command
			echo("[LOG] Invalid command: \"$command\"\n\n");
		}
		// update player time remaining
		$time_remaining[$current_player] -= hrtime(true) - $time_start;
		$time_start = hrtime(true);
	}

	// send both players either 0 or negative number of stones left
	// useful for graceful quitting
	send_message($connections[1], "$num_cards $results[1]\n", $is_websocket[1]);
	send_message($connections[2], "$num_cards $results[2]\n", $is_websocket[2]);

	// print result
    echo("\n[LOG] -- Result -- \n\n");
	if($num_cards == 0) {
        if($results[1] > $results[2]){
            echo("[INFO] PLAYER 1 score: $results[1], PLAYER 2 score: $results[2]\n");
            echo("[INFO] PLAYER 1 WINS!\n\n");
        }
        else if($results[1] < $results[2]){
            echo("[INFO] PLAYER 1 score: $results[1], PLAYER 2 score: $results[2]\n");
            echo("[INFO] PLAYER 2 WINS!\n\n");
        }
        else{
            echo("[INFO] PLAYER 1 score: $results[1], PLAYER 2 score: $results[2]\n");
            echo("[INFO] Draw\n\n");
        }
	} else {
		echo("[INFO] not zero \n\n");
	}

	// close socket
	socket_close($socket);
?>
