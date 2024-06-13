// Asher Shores
// CST-210
// December 20th, 2020
// This is my own work

#ifndef ENEMY_H
#define ENEMY_H

#include <iostream>
#include <string>
#include <random>
#include <ctime>
#include "player.h"

using namespace std;

class enemy : public player {
private:
    int damage, health, enemy_rand;
    string enemy_weapon, type;
    string weapons[10];
    string enemy_type[10];

public:
    enemy() {
        generateEnemyList();
    }

    // Generate list of enemy weapons and types
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

    // Generate enemy attributes
    void generateEnemy() {
        srand(time(0));
        damage = rand() % 10 + 15;
        health = rand() % 50 + 50;
        enemy_rand = rand() % 10;
        enemy_weapon = weapons[enemy_rand];
        type = enemy_type[enemy_rand];
    }

    // Display enemy to player
    void show_enemy() const {
        cout << "\nAdventurer! A(n) " << type << " approaches!\n";
        cout << type << " has: " << health << " HP and wields a fearsome " << enemy_weapon << endl; 
    }

    // Getters
    int getHealth() const {
        return health;
    }

    string getType() const {
        return type;
    }

    // Calculate gold won
    int winGold() const {
        return ((health + damage) / 2) / (rand() % 3 + 1);
    }

    // Calculate materials won
    int winMaterials() const {
        return ((health + damage) / 6) / (rand() % 3 + 1);
    }

    // Player attacks enemy
    void attack(int action, int player_damage) {
        int hit_rand = rand() % 10 + 1;
        int damage_dealt = 0;

        switch(action) {
            case 1:
                damage_dealt = player_damage;
                break;
            case 2:
                if (hit_rand > 4) damage_dealt = player_damage * 2;
                break;
            case 3:
                if (hit_rand > 6) damage_dealt = player_damage * 4;
                break;
        }

        health -= damage_dealt;
        if (health < 0) health = 0;

        if (damage_dealt > 0) {
            cout << "Hit! " << type << " Takes " << damage_dealt << " damage, " << type << " now has " << health << " hp!" << endl;
        } else {
            cout << "Miss! " << type << " Takes no damage, " << type << " still has " << health << " hp!" << endl;
        }
    }

    // Enemy attacks player
    int attack_player() const {
        int attack_rand = rand() % 4 + 1;

        if (attack_rand == 2) {
            attack_rand = rand() % 2 + 1;
            cout << type << " prepares for an attack\n";
            if (attack_rand == 1) {
                cout << type << " stumbles and misses its attack, no damage dealt!";
                return 0;
            } else {
                cout << type << " lunges out for an attack\n";
                cout << "You block their attack, no damage dealt!";
                return 0;
            }
        }

        attack_rand = rand() % 3 + 1;
        cout << type << " prepares for an attack\n";

        switch (attack_rand) {
            case 1:
                cout << type << " jabs you with their weapon, dealing " << damage << " damage";
                return damage;
            case 2:
                cout << type << " tries to surprise you from the side\n";
                cout << type << " slashes you with their weapon, dealing " << 1.5 * damage << " damage";
                return 1.5 * damage;
            case 3:
                cout << type << " blunts you with their weapon, dealing " << 2 * damage << " damage";
                return 2 * damage;
        }

        return 0;
    }
};

#endif // ENEMY_H
