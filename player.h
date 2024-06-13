// Asher Shores
// CST-210
// December 20th, 2020
// This is my own work

#ifndef PLAYER_H
#define PLAYER_H

#include <iostream>
#include <string>
#include <fstream>
#include <sstream>
using namespace std;

class player {
private:
    string name, line, my_weapon;
    int health, gold, damage, potions, max_health, my_materials;
    char input_char;

    // Validates yes/no input
    void check_valid_input_yn() {
        while (true) {
            cin >> input_char;
            if (input_char == 'y' || input_char == 'n' || input_char == 'Y' || input_char == 'N') {
                break;
            }
            cout << "Please enter a valid option" << endl;
            cin.clear();
            cin.ignore(10000, '\n');
        }
        cout << "\033[2J\033[0;0H";
    }

    // Pauses the console until Enter is pressed
    void pressEnterToContinue() const {
        cout << "Press ENTER to continue... ";
        cin.ignore();
        cin.get();
    }

public:
    // Initializes player stats from save file or creates new player
    void player_setup() {
        ifstream myFile("text.txt");
        if (myFile.is_open()) {
            getline(myFile, name);
            myFile >> health >> gold >> damage >> potions >> my_materials >> max_health;
            myFile.close();
        }
    }

    // Updates the number of potions
    void updatePotions(int count) {
        int cost[4] = {35, 160, 300, 700};
        int amounts[4] = {1, 5, 10, 25};

        if (count >= 1 && count <= 4 && gold >= cost[count - 1]) {
            potions += amounts[count - 1];
            gold -= cost[count - 1];
            cout << "Alright, there ya are.\nYou now have " << potions << " potions";
        } else {
            cout << "\nNot enough gold\n";
        }
        cout << endl;
        pressEnterToContinue();
        cin.ignore();
    }

    // Mutator for materials
    void updateMaterials(int materials) {
        my_materials += materials;
    }

    // Mutator for gold
    void updateGold(int new_gold) {
        if (new_gold == -1) {
            gold /= 2;
            cout << "You lost half of your gold and now have " << gold << " left\n\n";
        } else {
            gold += new_gold;
        }
        if (gold < 0) gold = 0;
    }

    // Displays player stats
    void show_stats() const {
        cout << "Player Name: " << name << endl;
        cout << "Health is: " << health << endl;
        cout << "Gold is: " << gold << endl;
    }

    // Getter for damage
    int getDamage() const {
        return damage;
    }

    // Checks player progress
    void checkProgress() const {
        cout << "\033[2J\033[0;0H";
        cout << "Well done Adventurer!\n\nHere are your current stats!\n\n";
        cout << name << ":\nYour health is currently: " << health << " out of " << max_health << " total!";
        cout << "\nYour gold current stands at a total of " << gold << ", impressive!";
        cout << "\nYou currently wield the " << getWeaponStr() << ", foes beware!";
        cout << "\nYour base damage stands at " << damage;
        cout << "\nYou currently have " << potions << " potions in stock";
        cout << "\nYou have gathered a total of " << my_materials << " materials\n\n";
        pressEnterToContinue();
    }

    // Getter for potions
    int getPotions() const {
        return potions;
    }

    // Uses a potion
    void usePotion() {
        if (potions > 0) potions--;
    }

    // Gets weapon based on damage
    void getWeapon() {
        if (damage == 10) my_weapon = "Rusty Sword";
        else if (damage == 15) my_weapon = "Awkward Cleaver";
        else if (damage == 20) my_weapon = "Sharpened Iron";
        else if (damage == 25) my_weapon = "Great Warhammer";
        else if (damage == 50) my_weapon = "Excalibur";
    }

    // Returns the weapon name as a string
    string getWeaponStr() const {
        const_cast<player*>(this)->getWeapon();
        return my_weapon;
    }

    // Upgrades the player's weapon
    void upgradeWeapon() {
        struct Upgrade {
            int cost;
            int materials;
            int new_damage;
        };

        Upgrade upgrades[] = {
            {100, 50, 15},
            {500, 250, 20},
            {2000, 1000, 25},
            {5000, 3000, 50}
        };

        for (const auto& upgrade : upgrades) {
            if (damage == upgrade.new_damage / 2) {
                cout << "\nUpgrading this time will cost " << upgrade.cost << "G & " << upgrade.materials << " materials";
                cout << "\nAre you sure you want to upgrade?\n\n";
                check_valid_input_yn();

                if (input_char == 'n' || input_char == 'N') {
                    return;
                } else if (gold >= upgrade.cost && my_materials >= upgrade.materials) {
                    updateGold(-upgrade.cost);
                    updateMaterials(-upgrade.materials);
                    damage = upgrade.new_damage;
                    getWeapon();
                    cout << "\nCongrats, you now have " << my_weapon << " dealing " << damage << " base damage\n\n";
                    pressEnterToContinue();
                    cin.ignore();
                    return;
                } else {
                    cout << "\nOops, not enough resources";
                    cout << "\nTry again later";
                    return;
                }
            }
        }
        cout << "\nYour weapon is already fully upgraded!\n";
        pressEnterToContinue();
    }

    // Updates max health with super potion
    void getSuper() {
        struct SuperPotion {
            int cost;
            int new_max_health;
        };

        SuperPotion potions[] = {
            {500, 150},
            {1000, 200},
            {2000, 250}
        };

        for (const auto& potion : potions) {
            if (max_health == potion.new_max_health - 50) {
                cout << "\nThis one will cost you " << potion.cost << "G";
                cout << "\nWould you like to buy it?\n\n";
                check_valid_input_yn();

                if (gold >= potion.cost && (input_char == 'y' || input_char == 'Y')) {
                    updateGold(-potion.cost);
                    max_health = potion.new_max_health;
                    cout << "\nYou feel strangely powerful as you drink the potion...";
                    cout << "\nYour max health has gone up! You now have a max of " << max_health << "\n\n";
                    pressEnterToContinue();
                    return;
                } else {
                    cout << "\nNot enough gold, scram";
                    pressEnterToContinue();
                    return;
                }
            }
        }

        cout << "\nI've run out of stock, kid...";
        cout << "\nWhat are you trying to do anyway, become a God?\n\n";
        pressEnterToContinue();
    }

    // Getter for health
    int getHealth() const {
        return health;
    }

    // Setter for health
    void setHealth(int delta) {
        health += delta;
        if (health < 0) health = 0;
        if (health > max_health) health = max_health;
    }

    // Saves game progress
    void saveGame() {
        ofstream myFile("text.txt");
        if (myFile.is_open()) {
            myFile << name << endl
                   << health << endl
                   << gold << endl
                   << damage << endl
                   << potions << endl
                   << my_materials << endl
                   << max_health;
            myFile.close();
        }
        cout << "\nSaving game...\n\nGame saved\n";
        pressEnterToContinue();
    }
};

#endif // PLAYER_H
