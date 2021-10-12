//Asher Shores
//CST-210
//December 20th, 2020
//This is my own work

#include <iostream>
#include <string>
#include <random>
#include <ctime>
using namespace std;

//inherits from the player class, since attributes are shared
class enemy : public player {

private: 
int damage, health, enemy_rand;
string enemy_weapon, type;
string weapons[10];
string enemy_type[10];

public:

//uses arrays to store names of weapons and names
void generateEnemyList() {

weapons[0] = "Rusty Sword";
weapons[1] = "Stone Club";
weapons[2] = "Battle Axe";
weapons[3] = "Dagger";
weapons[4] = "Throwing Knife";
weapons[5] = "Sharpened Sword";
weapons[6] = "Pointy Stick";
weapons[7] = "Big Rock";
weapons[8] = "Iron Hammer";
weapons[9] = "Spear";

enemy_type[0] = "Goblin";
enemy_type[1] = "Giant Bat";
enemy_type[2] = "Skeleton";
enemy_type[3] = "Zombie";
enemy_type[4] = "Bandit";
enemy_type[5] = "Wild Wolf";
enemy_type[6] = "Giant Spider";
enemy_type[7] = "Dark Elf";
enemy_type[8] = "Thief";
enemy_type[9] = "Giant Slime";
}

//main basic constructor for enemies
//relies on srand to generate attributes
void generateEnemy() {

  srand(time(0));

  damage = rand() % 10 + 15;
  health = rand() % 50 + 50;
  enemy_rand = rand() % 10;
  enemy_weapon = weapons[enemy_rand];
  enemy_rand = rand() % 10;
  type = enemy_type[enemy_rand];

}

//reveals enemy to player
void show_enemy() {

cout << "\nAdventurer! a(n) " << type << " approaches!\n";
cout << type << " has: " << health << 
" HP and wields a fearsome " << enemy_weapon << endl; 


}

//main getters and mutator functions below
int getHealth() {
  return health;
}

string getType() {

  return type;

}

int winGold() {
int goldWon, rand_win;
rand_win = rand() % 3 + 1;

goldWon = ((health + damage)/2) / rand_win;
return goldWon; 

}

int winMaterials() {
int matsWon, rand_win;
rand_win = rand() % 3 + 1;

matsWon = ((health + damage)/6) / rand_win;
return matsWon; 

}

//main function for player damaging the enemy
//player has base damage from current weapon
//that and rand() is used to determine if hit connects
//percentages shown in main are calculated here
void attack(int action, int player_damage) {

  int attack_value, hit_rand;

  hit_rand = rand() % 10 + 1;

  if (action == 1) {
    health = health - player_damage;
    if (health < 0) { health = 0;}
    cout << "Hit! " << type << " Takes " << player_damage <<
    " damage, " << type << " now has " << health << " hp!" << endl;
    return;
  } else if (action == 2) {
    if (hit_rand > 4){
    health = (health - (player_damage * 2));
    if (health < 0) { health = 0;}
    cout << "Hit! " << type << " Takes " << player_damage*2 <<
    " damage!\n" << type << " now has " << health << " hp!" << endl;
    return;
    } else {
      cout << "Miss! " << type << " Takes no damage, " << type << " still has " << health << " hp!" << endl;
      return;
    }
  } else if (action == 3) {
    if (hit_rand > 6){
    health = (health - (player_damage * 4));
    if (health < 0) { health = 0;}
    cout << "Hit! " << type << " Takes " << player_damage*4 <<
    " damage, " << type << " now has " << health << " hp!" << endl;
    return;
    } else {
      cout << "Miss! " << type << " Takes no damage, " << type << " still has " << health << " hp!" << endl;
      return;
    }

}
}

//attack functions
//uses rand to determine if attack hits and how much damage
//damage is based on enemy and chance each round
//health is also random but both have minimums
int attack_player() {
  int attack_rand;
  cout << endl << endl;

  attack_rand = rand() % 4 + 1;
  if (attack_rand == 2) {
    attack_rand = rand() % 2 + 1;
    if (attack_rand == 1) {
      cout << type << " prepares for an attack\n";
      cout << type << " stumbles and misses it's attack, no damage dealt!";
      return 0;
    } else if (attack_rand == 2) {
      cout << type << " lunges out for an attack\n";
      cout << "You block their attack, no damage dealt!";
      return 0;
    }
  }

  attack_rand = rand() % 3 + 1;
  if (attack_rand == 1) {
  cout << type << " prepares for an attack\n";
  cout << type << " jabs you with their weapon, dealing " << damage << " damage";
  return damage;
  } else if (attack_rand == 2) {
  cout << type << " trys to surprise you from the side\n";
  cout << type << " slashes you with their weapon, dealing " 
  << 1.5*damage << " damage";
  return 1.5*damage;
  } if (attack_rand == 3) {
  cout << type << " prepares for an attack\n";
  cout << type << " blunts you with their weapon, dealing " 
  << 2*damage << " damage";
  return 2*damage;
  } 


  return 1000;
}


};
