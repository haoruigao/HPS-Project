import sys
import socket
import time
import random

class Client():
    def __init__(self, port=5000):
        self.socket = socket.socket()
        self.port = port

        self.socket.connect(("localhost", port))

        # Send over the name
        self.socket.send("Python Client".encode("utf-8"))

        # Wait to get the ready message, which includes whether we are player 1 or player 2
        init_info = self.socket.recv(1024).decode().rstrip()

        self.player_num = int(init_info.split(" ")[0])

        # init random select
        self.randomlist = random.sample(range(3, 16), 13)
        
        print("Player Number: {player_num}"
              .format(player_num=self.player_num))
        

    def getstate(self):
        '''
        Query the server for the current state of the game and wait until a response is received
        before returning
        '''

        # Send the request
        self.socket.send("getstate".encode("utf-8"))

        # Wait for the response (hangs here until response is received from server)
        state_info = self.socket.recv(1024).decode().rstrip()

        # The information returned from the server is the number of cards and its current result

        num_cards = int(state_info.split(" ")[0])
        score = int(state_info.split(" ")[1])

        return num_cards, score

    def sendmove(self, move, drop):
        '''
        Send a move to the server to be executed. The server does not send a response / acknowledgement,
        so a call to getstate() afterwards is necessary in order to wait until the next move
        '''

        self.socket.send(f"sendmove {move} {drop}".encode("utf-8"))


    def generatemove(self, score):
        '''
        Given the state of the game as input, computes the desired move and returns it.
        NOTE: this is just one way to handle the agent's policy -- feel free to add other
          features or data structures as you see fit, as long as playgame() still runs!
        '''

        raise NotImplementedError

    def playgame(self):
        '''
        Plays through a game of Card Nim from start to finish by looping calls to getstate(),
        generatemove(), and sendmove() in that order
        '''

        while True:
            state, score = self.getstate()

            if int(state) <= 0:
                break

            move, drop = self.generatemove(score)

            self.sendmove(move, drop)

            time.sleep(0.1)        

        self.socket.close()


class IncrementPlayer(Client):
    '''
    Very simple client which just starts at the lowest possible move
    and increases its move by 1 each turn
    '''
    def __init__(self, port=5000):
        super(IncrementPlayer, self).__init__(port)
        self.i = 3
        self.drop = 0

    def generatemove(self, state):
        to_return = self.i
        to_drop = self.drop
        self.i += 1

        return to_return, to_drop
    
class MyPlayer(Client):
    '''
    Your custom solver!
    '''
    def __init__(self, port=5000):
        super(MyPlayer, self).__init__(port)
        self.index = 0

    def generatemove(self, score):

        move = self.randomlist[self.index]
        self.index += 1
        if random.random() < 0.2:
            drop = -1
            print("Drop the card", move)
        else:
            drop = 0
            print("Compete with card", move)
        
        '''
        TODO: put your solver logic here!
        '''
        
        return move, drop



if __name__ == '__main__':
    if len(sys.argv) == 1:
        port = 5000
    else:
        port = int(sys.argv[1])

    # Change IncrementPlayer(port) to MyPlayer(port) to use your custom solver
    client = MyPlayer(port)
    client.playgame()


