//Asher Shores
//CST-210
//December 20th, 2020
//This is my own work

#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
using namespace std;

//BIG player class
//lots of variables that are passed on to enemy
//lots of getters and mutators
class player {

private:
string name, line, tempStr, my_weapon;
int health, gold, damage, potions, max_health, tempInt, my_materials;
char input_char;


public:

//smae validation chcker for input
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

//same console breaker
void pressEnterToContinue() {
  int c;
  printf( "Press ENTER to continue... " );
  fflush( stdout );
  do c = getchar(); while ((c != '\n') && (c != EOF));
}

//when player is initialized, 
//uses either previous save or new dummy save to make player stats and load in
void player_setup() {

fstream myFile;
myFile.open("text.txt");

if (myFile.is_open()){

if ( getline (myFile,line) ) {
  name = line;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  health = tempInt;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  gold = tempInt;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  damage = tempInt;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  potions = tempInt;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  my_materials = tempInt;
} if ( getline (myFile,line) ) {
  tempStr = line;
  tempInt = stoi(tempStr);
  max_health = tempInt;
}



myFile.close();

}
}

//updattes the potions from store function
void updatePotions(int count){

if (count == 1){
  if (gold >= 35){
  potions = potions + 1;
  gold = gold - 35;
  cout << "Alright, there ya are.\nYou now have " << potions << " potions";
} else {
  cout << "\nNot enough gold\n";

}

} else if (count == 2){
    if (gold >= 160){
  potions = potions + 5;
  gold = gold - 160;
  cout << "Alright, there ya are.\nYou now have " << potions << " potions";
  } else {
  cout << "\nNot enough gold\n";
  }

} else if (count == 3){
    if (gold >= 300){
  potions = potions + 10;
  gold = gold - 300;
  cout << "Alright, there ya are.\nYou now have " << potions << " potions";
  } else {
  cout << "\nNot enough gold\n";
  }

} else if (count == 4){
    if (gold >= 700){
  potions = potions + 25;
  gold = gold - 700;
  cout << "Alright, there ya are.\nYou now have " << potions << " potions";
  } else {
  cout << "\nNot enough gold\n";
  }
}
  cout << endl;
  pressEnterToContinue();
  cin.ignore();
  return;

}


//mutator for materials
void updateMaterials(int materials) {

my_materials = my_materials + materials;

return;

};

//mutator for gold
void updateGold(int new_gold) {

if (new_gold == -1) {
gold = gold / 2;
cout << "You lost half of your gold and now have " << gold << " left\n\n";
if (gold < 0) {
  gold = 0;
}
return;
}

gold = gold + new_gold;
if (gold < 0) {
  gold = 0;
}

return;

};

//shows stats of player
void show_stats() {

  cout << "Player Name: " << name << endl;
  cout << "Health is: " << health << endl;
  cout << "Gold is: " << gold << endl;

}

//getter for damage for battle
int getDamage() {

return damage;

}

//check progress function
//main action here, displays all useful data
void checkProgress() {
//name, weapon, health, gold, damage, potions, max_health, my_materials;
cout << "\033[2J\033[0;0H";
cout << "Well done Adventurer!\n";
cout << "\nHere are your current stats!\n\n";
cout <<  name << ":";
cout << "\nYour health is currently: " << health << " out of "
<< max_health <<  " total!";
cout << "\nYour gold current stands at a total of " << gold << ", impressive!";
getWeapon();
cout << "\nYou currently wield the " << my_weapon << ", foes beware!";
cout << "\nYour base damage stands at " << damage;
cout <<"\nYou currently have " << potions << " potions in stock";
cout <<"\nYou have gathered a total of " << my_materials << " materials\n\n";

pressEnterToContinue();
cin.ignore();

return;

}

//more useful mutators and getters
int getPotions() {

  return potions;

}

void usePotion() {

  potions = potions - 1;
  return;

}

//lots of these functions for weapons to make weapon upgrades possible
//also player weapons have str names and damage values that are used
void getWeapon() {

  if (damage == 10){
    my_weapon = "Rusty Sword";
  } else if (damage == 15){
    my_weapon = "Awkward Cleaver";
  } else if (damage == 20){
    my_weapon = "Sharpened Iron";
  } else if (damage == 25){
    my_weapon = "Great Warhammer";
  } else if (damage == 50){
    my_weapon = "Excalibur";
  }

}

string getWeaponStr() {

  getWeapon();
  
  return my_weapon;

}

void upgradeWeapon(int level) {

//upgrades for the player's weapon
//requries massive amounts of gold and materials

// first upgrade
if (damage == 10) {
  cout << "\nUpgrading this time will cost 100G & 50 materials";
  cout << "\nAre you sure you want to upgrade?\n\n";
  check_valid_input_yn();
  if (input_char == 'n' || input_char == 'N') {
  return;
  } else {
    if (gold <= 100 || my_materials <= 50){
      cout << "\nOops, not enough resources";
      cout << "\nTry again later";
      return;
    }
  updateGold(-100);
  updateMaterials(-50);
  damage = 15;
  getWeapon();
  cout << "\nCongrats, you now have " << my_weapon << " dealing " 
  << damage << " base damage\n\name";
  pressEnterToContinue();
  cin.ignore();
  return;
  }
}
//second upgrade
if (damage == 15) {
  cout << "\nUpgrading this time will cost 500G & 250 materials";
  cout << "\nAre you sure you want to upgrade?\n\n";
  check_valid_input_yn();
  if (input_char == 'n' || input_char == 'N') {
  return;
  } else {
    if (gold <= 500 || my_materials <= 250){
      cout << "\nOops, not enough resources";
      cout << "\nTry again later";
      return;
    }
  updateGold(-500);
  updateMaterials(-250);
  damage = 20;
  getWeapon();
  cout << "\nCongrats, you now have " << my_weapon << " dealing " 
  << damage << " base damage\n\n";
  pressEnterToContinue();
  cin.ignore();
  return;
  }
}
//third upgrade
if (damage == 20) {
  cout << "\nUpgrading this time will cost 2000G & 1000 materials";
  cout << "\nAre you sure you want to upgrade?\n\n";
  check_valid_input_yn();
  if (input_char == 'n' || input_char == 'N') {
  return;
  } else {
    if (gold <= 2000 || my_materials <= 1000){
      cout << "\nOops, not enough resources";
      cout << "\nTry again later";
      return;
    }
  updateGold(-2000);
  updateMaterials(-1000);
  damage = 25;
  getWeapon();
  cout << "\nCongrats, you now have " << my_weapon << " dealing " 
  << damage << " base damage\n\n";
  pressEnterToContinue();
  cin.ignore();
  return;
  }
}
//fourth/final upgrade
if (damage == 50) {
  cout << "\nUpgrading this time will cost 5000G & 3000 materials";
  cout << "\nAre you sure you want to upgrade?\n\n";
  check_valid_input_yn();
  if (input_char == 'n' || input_char == 'N') {
  return;
  } else {
    if (gold <= 5000 || my_materials <= 3000){
      cout << "\nOops, not enough resources";
      cout << "\nTry again later";
      return;
    }
  updateGold(-5000);
  updateMaterials(-3000);
  damage = 20;
  getWeapon();
  cout << "\nCongrats, you now have " << my_weapon << " dealing " 
  << damage << " base damage\n\n";
  pressEnterToContinue();
  cin.ignore();
  return;
  }
}

return;
}


//updater for max health increase potions
//costs gold and has dialog
void getSuper() {

if (max_health == 100){
  cout << "\nThis one will cost you 500G";
  cout << "\nWould you like to buy it?\n\n";
  check_valid_input_yn();
  if (gold < 500) {
    cout << "\nNot enough gold, scram";
    pressEnterToContinue();
    cin.ignore();
    return; }
  if  (input_char == 'n' || input_char == 'N'){
    return;
  } else if (input_char == 'y' || input_char == 'Y'){
    updateGold(-500);
    max_health = 150;
    cout << "\nYou feel strangely powerful as you drink the potion...";
    cout << "\nYour max health has gone up! You now have a max of " << max_health;
    cout << "\n\n";
    pressEnterToContinue();
    cin.ignore();
    return;
  }
} else if (max_health == 150) {
  cout << "vThis one will cost you 1000G";
  cout << "\nWould you like to buy it?\n\n";
  check_valid_input_yn();
  if (gold < 1000) {
    cout << "\nNot enough gold, scram";
    pressEnterToContinue();
    cin.ignore();
    return; }
  if  (input_char == 'n' || input_char == 'N'){
    return;
  } else if (input_char == 'y' || input_char == 'Y'){
    updateGold(-1000);
    max_health = 200;
    cout << "\nYou feel strangely powerful as you drink the potion...";
    cout << "\nYour max health has gone up! You now have a max of " << max_health;
    cout << "\n\n";
    pressEnterToContinue();
    cin.ignore();
    return;
  }
} else if (max_health == 200) {
  cout << "\nThis one will cost you 2000G";
  cout << "\nWould you like to buy it?\n\n";
  check_valid_input_yn();
  if (gold < 2000) {
    cout << "\nNot enough gold, scram";
    pressEnterToContinue();
    cin.ignore();
    return; }
  }
  if  (input_char == 'n' || input_char == 'N'){
    return;
  } else if (input_char == 'y' || input_char == 'Y'){
    updateGold(-2000);
    max_health = 250;
    cout << "\nYou feel strangely powerful as you drink the potion...";
    cout << "\nYour max health has gone up! You now have a max of " << max_health;
    cout << "\n\n";
    pressEnterToContinue();
    cin.ignore();
    return;
  } else if (max_health == 250) {
    cout << "'\nI've run outta stock, kid...";
    cout << "'Whaddya trying to do anyway, become a God?";
    cout << "\n\n";
    pressEnterToContinue();
    cin.ignore();
    return;
  }
return;

}

//mutator funtcion 
int getHealth() {
  return health;
}

void setHealth(int delta) {

  health = health + delta;
  if (health < 0) {
    health = 0;
  } if (health > max_health) {
    health = max_health;
  }
  return;

}

//method for saving game
// same process as set up, stores all relevant stats
void saveGame() {

  fstream myFile;
  myFile.open("text.txt");
  
  if (myFile.is_open()) {

    myFile << name << endl; 
    myFile << health << endl;
    myFile << gold << endl;
    myFile << damage << endl;
    myFile << potions << endl;
    myFile << my_materials << endl;
    myFile << max_health;
  }

  myFile.close();

  cout << "\nSaving game...\n\n";
  cout << "Game saved\n";
  pressEnterToContinue();
  cin.ignore();

  return;
}


};