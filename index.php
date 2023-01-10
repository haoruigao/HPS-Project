<?php
// Filename of your index page
$index = "game.html";
// Metadata
$game = "Beat Or Bomb";
$team = "Mad Tacos";
$instruction = <<<EOD

<p> <strong> Overview: </strong> </p>
<p> Welcome to Beat Or Bomb! <br>
    
This is a two-player interactive card game. As in many card games and in
particular the game of War, in each round, each player chooses one card
to play. Unlike other card games, each player can choose whether to
compete or to give up a card. Points will be calculated and accumulated
after each round. At the end of the game, the player with the most
points will become the winner. A tie is possible though unlikely. Now,
let's go over the specific rules. <p>

<p> <strong> Rules: </strong> </p>
<ul> 
    <li> When the game starts, each player will be given the same set of cards from 2 to A (Joker not included), one of each. The value of each card equals the numerical value on the card except for
    J, Q, K, A and 2 whose values are 11, 12, 13, 14 and 15. Note that card 2 has the highest value (this unusual rule is unlike the usual situation in which card 2 is has
    the smallest value). </li>
    <li> At each round, each player will choose one card from their set to play, and they can decide whether they want to compete with this card or to give up. This process will be private meaning
    each player will not see the decision made by their opponent. After the decision, the card will be removed from the player's playing set. </li>
    <li> After both players have made their decisions, the points will be calculated as follows: </li>

<ul>
    <li>
    If both players chose to compete, the player with a larger-value card wins and will be awarded with
    points equal to their card value as well as their opponent's. For example, if player A and player B both decided to compete, player A had card 6 and player B had card J, then player B
    wins and will be awarded with 11 + 6 = 17 points from this round whereas player A does not get any points. </li>
    <li>
    If both players chose to give up, then neither player will get any points. </li>
    <li>
    If player A chose to compete and player B chose to give up, then player A will be awarded with points equal to their card value whereas player B does not get any points. </li>
</ul>
    <li> After both players have played all their cards, the player with more points will be the winner. </li>
</ul>


<p> <strong> Note: </strong> For best experience, maximize window as much as possible. </p>
EOD;

// Size of the popup window
$width = 940;
$height = 1000;
// If your score is sortable, 1 if higher score is better, -1 if smaller score is better, 0 otherwise.
$scoring = 0;

include '../../template.php';
