#include<stdio.h>
#include<stdlib.h>
#include<string.h>
#define WINDOW_SIZE 4440

class connection{
    private:
        int vmID;
        char currentWindow[WINDOW_SIZE];
        char auth[256];
    public:
    connection(int vmID, char *auth){
        if(strcmp(auth, this->auth) != 0){
            exit(2); //bad auth -> (somone is trying a brute force ... we use an internal secret key to prevent this. good luck cracking 256^256)
        }
    }
};