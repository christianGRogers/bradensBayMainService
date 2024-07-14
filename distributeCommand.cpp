#include <iostream>
#include <string>
#include <cstring>
#include <cstdlib>

#define WINDOW_SIZE 4440

class connection {
    private:
        int vmID;
        char currentWindow[WINDOW_SIZE];
        std::string auth;
    public:
        connection(int vmID, const char* auth) : vmID(vmID), auth("setForprod") {
            if (strcmp(auth, this->auth.c_str()) != 0) {
                exit(2); // bad auth
            }
        }

        void runCommand(const char* command) {
            std::string fullCommand = "lxc exec " + std::to_string(this->vmID) + " -- " + command;
            system(fullCommand.c_str());
        }
};