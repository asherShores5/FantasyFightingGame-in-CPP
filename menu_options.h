//Asher Shores
//CST-210
//December 20th, 2020
//This is my own work

#include <iostream>
#include <random>
#include <fstream>
#include <string>
#include <stdio.h>
using namespace std;

//using struc since all stuff in here is mainly dialog
struct menu {


private:
char input;
int input_int;
int tavern_rand;
string my_name;

public:

//virtual fight function
virtual void fight() {

};

//pause between readouts
void PressEnterToContinue() {
  int c;
  printf( "Press ENTER to continue... " );
  fflush( stdout );
  do c = getchar(); while ((c != '\n') && (c != EOF));
}

//first menu selection screen when game is started
void start_menu() {

  cout << "Have you played before?\n";
  check_valid_input_yn();

  if (input == 'y' || input == 'Y') {
    cout << "Would you like to load in your player from the save file?\n";
    check_valid_input_yn();
     if (input == 'y' || input == 'Y') {
      return;
    } else {
      start_menu();
    }
  } else {
    cout << "Would you like to start a new game?\n";
    check_valid_input_yn();
      if (input == 'y' || input == 'Y') {
        new_game();
    } else {
      start_menu();
  }
  }
  return; 
}
//--------------------------------------------------------


//creates new game when called
// generates chr by asking name
void new_game() {
string name = "";
cout << "What is your character's name?\n";
cin >> name;

create_new_chr(name);

return;


}

//new chr takes inputted name and creates a dummy save with all base stats
void create_new_chr(string chr_name) {
  int health = 100;
  int gold = 100;
  int damage = 10;
  int potions = 8;
  int materials = 1;
  int max_health = 100;
  my_name = chr_name;

  //fstream file schenanigans
  fstream myFile;
  myFile.open("text.txt");
  
  if (myFile.is_open()) {

    myFile << chr_name << endl; 
    myFile << health << endl;
    myFile << gold << endl;
    myFile << damage << endl;
    myFile << potions << endl;
    myFile << materials << endl;
    myFile << max_health;
  }

  myFile.close();

  return;

}

//main area of the game from main
//allows user choice and makes main cleaner by being here
int main_area() {
cout << "\033[2J\033[0;0H";
cout << "Greetings, " << my_name << endl;
cout << "Welcome to the Main Road!";
cout << "\n\nFrom here you can decide where your journey goes";
cout << "\nPlease choose a course of action\n\n\n";
PressEnterToContinue();
cout << "\033[2J\033[0;0H";
cout << "On the Main Road";
cout << "\n----------------";
cout << "\n\n1.\tTravel to town";
cout << "\n2.\tGather Materials";
cout << "\n3.\tGo on a Hunt";
cout << "\n4.\tCheck Progress";
cout << "\n5.\tSave Game\n\n";
check_valid_input_int(5);

return input_int;

}



//allows dialog for tavern visit
//gives helpful hints about game 
void visit_tavern() {

cout << "\033[2J\033[0;0H";
cout << "Welcome to the Tavern!";
cout << "\n\n Here you can speak to the locals and get advice";
PressEnterToContinue();
cout << "\033[2J\033[0;0H";

cout << "You sit down and order an ale from the barkeep";
cout << "\n\nWhile he's pouring your drink, he leans in and tells you...\n\n";
PressEnterToContinue();

tavern_rand = rand() % 5 + 1;
if (tavern_rand == 1){
  cout << "\nDid you know that you can get speacial health potions that will increase\nyour total health, but you didn't hear that from me...\n\n";
}
if (tavern_rand == 2){
  cout << "\nMaterials can be found all over in Elaria, either by fighting enemies and claiming theirs or by collecting it yourself. Best part of that is theres no danger there...\n\n";
}
if (tavern_rand == 3){
  cout << "\nThey say the creator of this land is very tired and\nsick of this program and writing it as this is the last thing he did on it\nI have no idea what that means but it sounds interesting...\n\n";
}
if (tavern_rand == 4){
  cout << "\nThey say saving your progress is key to making it anywhere in Elaria,\nI've heard you can even cheat the system and back out without saving since there's no\nauto-save feature\nI have no idea what that means but it sounds interesting... \n\n";
}
if (tavern_rand == 5){
  cout << "\nFighting harder enemies may seem worse, but the harder the enemy, the greater\nthe chance at more loot is...\n\n";
}
PressEnterToContinue();
cout << "\033[2J\033[0;0H";

cout << "You return to town...";

return;
}

//gather materials function
//one of main choices
//allows no loss gathering of materials
int gather_materials() {

int mat_count;

cout << "\033[2J\033[0;0H";

cout << "You decide to gather materials";
cout << "\nUseful items, used in crafting and upgrading gear,";
cout << "\ncan be found all over Elaria\n";
PressEnterToContinue();
cout << "\033[2J\033[0;0H";

//lots of randomness to calculate loot gained and dialog
int rand_mat = rand() % 5 + 1;
int rand_val = rand() % 2 + 1;
if (rand_val == 1){
  cout << "\nWhile looking for materials, you found an old quarry";
  cout << "\nYou decide to mine for a while...\n\n";
  PressEnterToContinue();
  cout << "\033[2J\033[0;0H";
  mat_count = rand_mat;
  cout << "Nice, you gained " << mat_count << " stone\n\n";
  PressEnterToContinue();
  cout << "\033[2J\033[0;0H";
  return mat_count;
} else if (rand_val == 2){
  cout << "\nWhile looking for materials, you found an abandoned lumber mill";
  cout << "\nYou decide to chop for a while...\n\n";
  PressEnterToContinue();
  cout << "\033[2J\033[0;0H";
  mat_count = rand_mat;
  cout << "Nice, you gained " << mat_count << " lumber\n\n";
  PressEnterToContinue();
  cout << "\033[2J\033[0;0H";
  return mat_count;
}

return 0;
}


//input checkers for valid cin
void check_valid_input_yn() {
  bool inputFlag;

  do {
    cin >> input;
    //assume that input is valid
    inputFlag = true;

    //checks if input is valid
    if (input == 'y' || input == 'n' || input == 'Y' || input == 'N') {
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
      }
    } else if (type == 3) {
      if (input_int == 1 || input_int == 2 || input_int == 3) {
      break;
    }
    } else if (type == 5) {
      if (input_int == 1 || input_int == 2 || input_int == 3
      || input_int == 4 || input_int == 5) {
      break;
    }
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

};

