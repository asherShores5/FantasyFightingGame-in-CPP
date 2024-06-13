// Asher Shores
// CST-210
// December 20th, 2020
// This is my own work

#ifndef MENU_OPTIONS_H
#define MENU_OPTIONS_H

#include <iostream>
#include <fstream>
#include <string>
using namespace std;

struct menu {
private:
    char input;
    int input_int;
    int tavern_rand;
    string my_name;
    bool new_game_created = false;

    void check_valid_input_yn() {
        while (true) {
            cin >> input;
            if (input == 'y' || input == 'n' || input == 'Y' || input == 'N') {
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

public:
    void PressEnterToContinue() {
        cout << "Press ENTER to continue... ";
        cin.ignore();
        cin.get();
    }

    void start_menu() {
        if (new_game_created) {
            return;
        }

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
                new_game_created = true;
            } else {
                start_menu();
            }
        }
    }

    void new_game() {
        cout << "What is your character's name?\n";
        cin >> my_name;
        create_new_chr(my_name);
    }

    void create_new_chr(const string& chr_name) {
        ofstream myFile("text.txt");
        if (myFile.is_open()) {
            myFile << chr_name << endl
                   << 100 << endl  // health
                   << 100 << endl  // gold
                   << 10 << endl   // damage
                   << 8 << endl    // potions
                   << 1 << endl    // materials
                   << 100;         // max_health
        }
    }

    int main_area() {
        cout << "\033[2J\033[0;0H";
        cout << "Greetings, " << my_name << endl;
        cout << "Welcome to the Main Road!\n\nFrom here you can decide where your journey goes\n"
             << "Please choose a course of action\n\n\n";
        PressEnterToContinue();
        cout << "\033[2J\033[0;0H";
        cout << "On the Main Road\n----------------\n\n1.\tTravel to town\n2.\tGather Materials\n"
             << "3.\tGo on a Hunt\n4.\tCheck Progress\n5.\tSave Game\n\n";
        check_valid_input_int(5);
        return input_int;
    }

    void visit_tavern() {
        cout << "\033[2J\033[0;0H";
        cout << "Welcome to the Tavern!\n\n Here you can speak to the locals and get advice";
        PressEnterToContinue();
        cout << "\033[2J\033[0;0H";

        cout << "You sit down and order an ale from the barkeep\n\nWhile he's pouring your drink, he leans in and tells you...\n\n";
        PressEnterToContinue();

        tavern_rand = rand() % 5 + 1;
        switch (tavern_rand) {
            case 1:
                cout << "\nDid you know that you can get special health potions that will increase your total health, but you didn't hear that from me...\n\n";
                break;
            case 2:
                cout << "\nMaterials can be found all over in Asherland, either by fighting enemies and claiming theirs or by collecting it yourself. Best part of that is there's no danger there...\n\n";
                break;
            case 3:
                cout << "\nThey say the creator of this land is very tired and sick of this program and writing it as this is the last thing he did on it. I have no idea what that means but it sounds interesting...\n\n";
                break;
            case 4:
                cout << "\nThey say saving your progress is key to making it anywhere in Asherland. I've heard you can even cheat the system and back out without saving since there's no auto-save feature. I have no idea what that means but it sounds interesting... \n\n";
                break;
            case 5:
                cout << "\nFighting harder enemies may seem worse, but the harder the enemy, the greater the chance at more loot is...\n\n";
                break;
        }
        PressEnterToContinue();
        cout << "\033[2J\033[0;0H";
        cout << "You return to town...";
    }

    int gather_materials() {
        int mat_count;

        cout << "\033[2J\033[0;0H";
        cout << "You decide to gather materials\nUseful items, used in crafting and upgrading gear, can be found all over Asherland\n";
        PressEnterToContinue();
        cout << "\033[2J\033[0;0H";

        int rand_mat = rand() % 5 + 1;
        int rand_val = rand() % 2 + 1;
        mat_count = rand_mat;
        if (rand_val == 1) {
            cout << "\nWhile looking for materials, you found an old quarry\nYou decide to mine for a while...\n\n";
            PressEnterToContinue();
            cout << "\033[2J\033[0;0H";
            cout << "Nice, you gained " << mat_count << " stone\n\n";
        } else {
            cout << "\nWhile looking for materials, you found an abandoned lumber mill\nYou decide to chop for a while...\n\n";
            PressEnterToContinue();
            cout << "\033[2J\033[0;0H";
            cout << "Nice, you gained " << mat_count << " lumber\n\n";
        }
        PressEnterToContinue();
        cout << "\033[2J\033[0;0H";
        return mat_count;
    }
};

#endif // MENU_OPTIONS_H
