// Asher Shores
// CST-210
// December 20th, 2020
// This is my own work

#include <iostream>
#include "menu_options.h"
#include "player.h"
#include "enemy.h"

// Function declarations
void pressEnterToContinue();
void hunt();
void check_valid_input_int(int type);
void check_valid_input_yn();
void player_death();
void town_options();
void visit_shop();

// Global variables
int mats, input_int;
int main_area_var;
bool fight;
char input_char;
string current_weapon;

// Creation of important enemy polymorphic variables
enemy* my_enemy = new enemy;

// Creates player instance and menu struct instance
player myPlayer;
menu my_menu = {};

// Main function
int main() {
    my_menu.start_menu();
    myPlayer.player_setup();
    cout << "Welcome Adventurer, to Asherlan\n\n\n";
    pressEnterToContinue();

    // Main game loop
    while (true) {
        main_area_var = my_menu.main_area();

        switch (main_area_var) {
            case 1:
                town_options();
                break;
            case 2:
                mats = my_menu.gather_materials();
                myPlayer.updateMaterials(mats);
                break;
            case 3:
                hunt();
                break;
            case 4:
                myPlayer.checkProgress();
                break;
            case 5:
                myPlayer.saveGame();
                break;
        }
    }
    return 0;
}

// Hunt function
void hunt() {
    cout << "You initiated a hunt!\n\nYou head out deeper into the woods...\n"
         << "Riches and glory are yours for the taking, but if you are defeated you will lose half of your gold.\n";

    enemy* new_enemy = new enemy;
    new_enemy->generateEnemyList();
    new_enemy->generateEnemy();
    cin.ignore();

    cout << "\nA foe approaches, you draw your sword as you prepare to fight\n";
    new_enemy->show_enemy();
    int player_damage = myPlayer.getDamage();
    int attack_damage;

    // Fight loop
    do {
        fight = true;
        cout << "\n\nWhat do you choose to do?\n1. Stab  (100% Acc. / 1x damage) \n"
             << "2. Slash (60% Acc. / 2x damage)\n3. Power (40% Acc. / 4x damage) \n"
             << "4. Heal (Consume 1 health pot to regain 100 HP)\n";
        check_valid_input_int(4);

        switch (input_int) {
            case 1:
            case 2:
            case 3:
                new_enemy->attack(input_int, player_damage);
                break;
            case 4:
                if (myPlayer.getPotions() > 0) {
                    myPlayer.usePotion();
                    myPlayer.setHealth(100);
                } else {
                    cout << "Sorry, you don't appear to have any potions in stock";
                }
                continue;
        }

        if (new_enemy->getHealth() <= 0) {
            fight = false;
            continue;
        }

        attack_damage = new_enemy->attack_player();
        myPlayer.setHealth(-attack_damage);
        cout << "\nYou currently have " << myPlayer.getHealth() << " HP";

        if (myPlayer.getHealth() <= 0) {
            player_death();
            return;
        }
    } while (fight);

    cout << "\nWell done, Adventurer, " << new_enemy->getType() << " has been defeated\n";
    myPlayer.updateMaterials(new_enemy->winMaterials());
    myPlayer.updateGold(new_enemy->winGold());
    cout << "\n\nCongrats, you looted " << new_enemy->winGold() << " gold and " 
         << new_enemy->winMaterials() << " materials\n\n";
    pressEnterToContinue();
    delete new_enemy;
}

// Player death function
void player_death() {
    cout << "\n\nOh no, you were defeated\n";
    myPlayer.updateGold(-1);
    myPlayer.setHealth(1000);
    pressEnterToContinue();
}

// Town options function
void town_options() {
    cout << "\033[2J\033[0;0H"
         << "Welcome to Wayfarer Village\n\nThe town bustles with activity..."
         << "\nWhat would you like to do here?\n\n1.\tGo to shop\n2.\tVisit the tavern\n"
         << "3.\tLeave town\n\n";
    check_valid_input_int(3);

    switch (input_int) {
        case 1:
            visit_shop();
            break;
        case 2:
            my_menu.visit_tavern();
            town_options();
            break;
        case 3:
            return;
    }
}

// Visit shop function
void visit_shop() {
    cout << "\033[2J\033[0;0H"
         << "Welcome to the Shop!\n\nHere you can purchase useful items or upgrade your gear"
         << "\nWhat would you like to do here?\n\n1.\tPurchase Health Potions (Heals you for 100 HP)"
         << "\n2.\tUpgrade your weapon (increase base damage)\n3.\tReturn to town\n\n";
    check_valid_input_int(3);

    switch (input_int) {
        case 1:
            cout << "'Alright,' says the storekeeper, 'how many of these suckers do ya need?'\n\n"
                 << "1. One Health Potion (Costs 35G)\n2. Five Health Potions (Costs 160G)\n"
                 << "3. Ten Health Potions (Costs 300G)\n4. 25 Health Potions (Costs 700G)\n"
                 << "5. Purchase super Health Potion\n6. Return to main shop\n";
            check_valid_input_int(6);

            if (input_int == 6) {
                visit_shop();
            } else if (input_int == 5) {
                cout << "\nThe Storekeeper quietly leans in..."
                     << "\n'If ya want I can getcha extra special potions\nthat will greatly improve your chances in battle...?"
                     << "\n\n1. Buy Super Potion\n2. Go back\n\n";
                check_valid_input_int(2);

                if (input_int == 2) {
                    visit_shop();
                } else if (input_int == 1) {
                    myPlayer.getSuper();
                    visit_shop();
                }
            } else {
                myPlayer.updatePotions(input_int);
                visit_shop();
            }
            break;

        case 2:
            cout << "\n\n'Alright,' says the storekeeper," 
                 << "'ya wanna upgrade your weapon?'\n\n"
                 << "You currently wield the " << myPlayer.getWeaponStr()
                 << "\nWould you like to upgrade?\n\n";
            check_valid_input_yn();

            if (input_char == 'n' || input_char == 'N') {
                cout << "Alright, come back when you're ready\n\n";
                pressEnterToContinue();
                visit_shop();
            } else {
                myPlayer.upgradeWeapon();
                visit_shop();
            }
            break;

        case 3:
            return;
    }
}

// Press enter to continue function
void pressEnterToContinue() {
    cout << "Press ENTER to continue... ";
    cin.ignore();
}

// Input checkers
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

void check_valid_input_int(int type) {
    while (true) {
        cin >> input_int;
        bool valid = false;
        switch (type) {
            case 3:
                valid = (input_int >= 1 && input_int <= 3);
                break;
            case 4:
                valid = (input_int >= 1 && input_int <= 4);
                break;
            case 5:
                valid = (input_int >= 1 && input_int <= 5);
                break;
            case 6:
                valid = (input_int >= 1 && input_int <= 6);
                break;
        }
        if (valid) break;
        cout << "Please enter a valid option" << endl;
        cin.clear();
        cin.ignore(10000, '\n');
    }
    cout << "\033[2J\033[0;0H";
}
