//Asher Shores
//CST-210
//December 20th, 2020
//This is my own work

#include <iostream>
#include <random>
#include <stdio.h>
#include <stdlib.h>
using namespace std;
#include "menu_options.h"
#include "player.h"
#include "enemy.h"

//main member functions declared up here, but stored below main()
void pressEnterToContinue();
void hunt();
void check_valid_input_int(int type);
void check_valid_input_yn();
void player_death();
void town_options();
void visit_shop();

//global variables, mostly for easy io stuff, I know globals are BAD
int mats, input_int;
int main_area_var;
bool fight;
char input_char;
string current_weapon;

//creation of my important enemy polymorphic variables
//Instance of the enemy class, but reproducable in all the ways enemy class can
enemy* my_enemy = new enemy;

//creates my player instance and my menu struct instance
player myPlayer;
struct menu my_menu = {};

//Driver code main()
int main() {
//clear console
//cout << "\033[2J\033[0;0H";

//create instance of struct in menu_options.h file
//used to control general menu options throughout game
//also first step in loading chr or creating new dummy chr 

my_menu.start_menu();

// After returning from start_menu()
// player either has chosen to create new chr
//or old chr is loaded in, either case chr data is now
//contained in text.txt file

//creates instance of player class, loads in vals from text file,
//either saved or newly created

//first introductions
myPlayer.player_setup();
cout << "Welcome Adventurer, to Asherlan\n\n\n";
pressEnterToContinue();


//massive do loop for main area of game
// all gameplay flows through here  and the 5 options
do {
//stores menu options and dialog in menu_options
main_area_var = my_menu.main_area();

//main if statements for controlling gameplay
//Everything that can be in menu_options is
//Everything that requires multi -class interaction is in functions in main file
if (main_area_var == 1) {
  town_options();
} else if (main_area_var == 2) {
  mats = my_menu.gather_materials();
  myPlayer.updateMaterials(mats);
} else if (main_area_var == 3) {
  hunt();
} else if (main_area_var == 4) {
  myPlayer.checkProgress();
} else if (main_area_var == 5) {
  myPlayer.saveGame();
}


//runs forever
} while (true);




return 0;
}

//hunt functions
//allows for player and enemy interactions
void hunt() {

cout << "You initiated a hunt!";
cout << "\n\nYou head out on deeper into the woods...";
cout << "\nRiches and glory are yours for the taking";
cout << "\nbut if you are defeated you will lose half of your gold\n";

//creates my instance of the enemy instance made prior
//can be recreated infinitely in many ways for unlimited enemies
enemy* new_enemy;
new_enemy = dynamic_cast<enemy*>(my_enemy);

new_enemy->generateEnemyList();
new_enemy->generateEnemy();

cin.ignore();




cout << "\nA foe approaches, you draw your sword as you prepare to fight\n";

//gets enemy stats and player data
new_enemy->show_enemy();
int player_damage = myPlayer.getDamage();
int attack_damage;


//do loop until player or enemy dies
//__________
do {

  fight = true;

cout << "\n\nWhat do you chose to do?";
cout << "\n1. Stab  (100% Acc. / 1x damage) \n2. Slash (60% Acc. / 2x damage)";
cout << "\n3. Power (40% Acc. / 4x damage) \n4. Heal (Consume 1 health pot to regain 100 HP)\n";
check_valid_input_int(4);

//four player options in battle
//3 ways of attacking and a heal method
if (input_int == 1) {
  new_enemy->attack(1, player_damage);
} else if (input_int == 2) {
  new_enemy->attack(2, player_damage);
} else if (input_int == 3) {
  new_enemy->attack(3, player_damage);
} else if (input_int == 4){
  if (myPlayer.getPotions() > 0) {
    myPlayer.usePotion();
  myPlayer.setHealth(100);
  } else { cout << "Sorry, you don't appear to have any potions in stock";}
  continue;
}


//gets enemy hp in case they died
int enemyHP = new_enemy->getHealth();

if (enemyHP <= 0) {
  fight = false;
  continue;
}

//player gets attacked 
attack_damage = new_enemy->attack_player();
myPlayer.setHealth(-1 * attack_damage);


int playerHP = myPlayer.getHealth();
cout << "\nYou currently have " << playerHP << " HP";


//player dies method
if (playerHP <= 0) {
  player_death();
  return;
}

//loops until broken by death
} while (fight == true);
////__________

//uses enemy class to generate loot
cout << "\nWell done, Adventurer, " << new_enemy->getType()
<< " has been defeated";
int goldWon = new_enemy->winGold();
int matWon = new_enemy->winMaterials();
myPlayer.updateMaterials(matWon);
myPlayer.updateGold(goldWon);

//gives player loot
cout << "\n\nCongrats, you looted " << goldWon << " gold and " 
<< matWon << " materials\n\n";
pressEnterToContinue();
cin.ignore();

//delete enemy for reuse
delete new_enemy;
return;
}

//player death, updates gold loss, resets health, continues
void player_death() {

  cout << "\n\nOh no, you were defeated\n";
  myPlayer.updateGold(-1);
  myPlayer.setHealth(1000);
  pressEnterToContinue();
  cin.ignore();
  return;

}

//town options here, shop and tavern
void town_options() {

cout << "\033[2J\033[0;0H";
cout << "Welcome to Wayfarer Village\n";
cout << "\nThe town bustles with activity...";
cout << "\nWhat would you like to do here?";

cout << "\n\n1.\tGo to shop";
cout << "\n2.\tVisit the tavern";
cout << "\n3.\tLeave town\n\n";

check_valid_input_int(3);

//three options in town
if (input_int == 1) {
  visit_shop();
} else if (input_int == 2) {
  my_menu.visit_tavern();
  town_options();
} else if (input_int == 3) {
  return;
}

}

//visit shop, can buy hp or more total hp, upgrade weapons a few times and leave
void visit_shop() {
int level;
cout << "\033[2J\033[0;0H";
cout << "Welcome to the Shop!";
cout << "\n\nHere you can purchase useful items or upgrade your gear";
cout << "\nWhat would you like to do here?";

cout << "\n\n1.\tPurchase Health Potions (Heals you for 100 HP)";
cout << "\n2.\tUpgrade your weapon (increase base damage)";
cout << "\n3.\tReturn to town\n\n";

//checks input is valid
check_valid_input_int(3);

//way too long process for buying damn potions
if (input_int == 1) {
  cout << "'Alright,' says the storekeeper, 'how many of these suckers do ya need?'\n\n";
  cout << "1. One Health Potion (Costs 35G)\n";
  cout << "2. Five Health Potions (Costs 160G)\n";
  cout << "3. Ten Health Potions (Costs 300G)\n";
  cout << "4. 25 Health Potions (Costs 700G)\n";
  cout << "5. Purchase super Health Potion\n";
  cout << "6. Return to main shop\n";
  check_valid_input_int(6);
  if (input_int == 6) {
    visit_shop();
  } else if (input_int == 5) {
    cout << "\nThe Storekeeper quietly leans in...";
    cout << "\n'If ya want I can getcha extra special potions\nthat will greatly improve your chances in battle...?";
    cout << "\n\n1. Buy Super Potion\n2. Go back\n\n";
    check_valid_input_int(2);
    if (input_int == 2) { 
      visit_shop();   
      //multiple choices that are negative and throw you back in main shop
    } else if (input_int == 1) {
      myPlayer.getSuper();
      visit_shop();
    }

  } else {
  //updates in player class, since potions are private
  myPlayer.updatePotions(input_int);
  visit_shop();
    }
  }

//upgrades weapon, also in player class
if (input_int == 2) {
  cout << "\n\n'Alright,' says the storekeeper," 
  << "'ya wanna upgrade your weapon?'\n\n";

  current_weapon = myPlayer.getWeaponStr();
  cout << "You currently wield the " << current_weapon;
  cout << "\nWould you like to upgrade?\n\n";
  check_valid_input_yn();
  if (input_char == 'n' || input_char == 'N' ){
    cout << "Alright, come back when you're ready";
    cout << endl << endl;
    pressEnterToContinue();
    cin.ignore();
    visit_shop();
  } else {
    int current_damage = myPlayer.getDamage();
    myPlayer.upgradeWeapon(current_damage);
    visit_shop();
  }


}


 if (input_int == 3) {
  return;
}

return;
}





//simple method for breaking up the console log readouts
void pressEnterToContinue() {
  int c;
  printf( "Press ENTER to continue... " );
  fflush( stdout );
  do c = getchar(); while ((c != '\n') && (c != EOF));
}

//input checkers to help make sure the program doesn't crash all the time
void check_valid_input_yn() {
  bool inputFlag;

  do {
    cin >> input_char;
    //assume that input is valid
    inputFlag = true;

    //checks if input is valid
    if (input_char == 'y' || input_char == 'n' || input_char == 'Y' || input_char == 'N') {
      break;
    }

    //passive aggressive message for people who break the rules
    cout << "Please enter a valid option" << endl;
    cin.clear();
    cin.ignore(10000, '\n');

    //no true end condition as inputFlag is always true
    //only way to end is to activate if statement and break;
  } while (inputFlag == true);

    cout << "\033[2J\033[0;0H";
    return;
}

void check_valid_input_int(int type) {
  bool inputFlag;

  do {
    cin >> input_int;
    //assume that input is valid
    inputFlag = true;

    if (type == 6){
    //checks if input is valid
    if (input_int == 1 || input_int == 2 || input_int == 3 
    || input_int == 4 || input_int == 5 || input_int == 6 ) {
      break;
    }}
    else if (type == 3) {
    if (input_int == 1 || input_int == 2 || input_int == 3) {
      break;
    } }
    else if (type == 4) {
    if (input_int == 1 || input_int == 2 || input_int == 3 || input_int == 4) {
      break;
    } }
    else if (type == 5) {
    if (input_int == 1 || input_int == 2 || input_int == 3 
    || input_int == 4 || input_int == 5) {
      break;
    } }
    else if (type == 2) {
    if (input_int == 1 || input_int == 2) {
      break;
    } }

    //passive aggressive message for people who break the rules
    cout << "Please enter a valid option" << endl;
    cin.clear();
    cin.ignore(10000, '\n');

    //no true end condition as inputFlag is always true
    //only way to end is to activate if statement and break;
  } while (inputFlag == true);

    cout << "\033[2J\033[0;0H";
    return;
}
