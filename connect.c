#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/wait.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void runCommand(char *vmName, char *command);
int start_connection();

int main() {
    start_connection();
    return 0;
}

void runCommand(char *vmName, char *command) {
    // Fork a new process to execute the command
    if (fork() == 0) {
        // Child process: execute the command
        execlp("lxc", "lxc", "exec", vmName, "--", "sh", "-c", command, (char *)NULL);
        perror("execlp failed");
        exit(EXIT_FAILURE);
    }
    // Parent process: wait for the child to complete
    wait(NULL);
}

int start_connection() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    char buffer[BUFFER_SIZE] = {0};
    char *responseHeader = "HTTP/1.1 200 OK\nContent-Type: text/plain\nContent-Length: 12\n\n";
    char *response = "Command executed";
    char *content_buffer = malloc(BUFFER_SIZE);

    // Creating socket file descriptor
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("socket failed");
        exit(EXIT_FAILURE);
    }

    // Forcefully attaching socket to the port
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt))) {
        perror("setsockopt");
        exit(EXIT_FAILURE);
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    // Binding the socket to the port
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    // Start listening for incoming connections
    if (listen(server_fd, 3) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }

    while (1) {
        printf("Waiting for connections...\n");

        // Accept an incoming connection
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t *)&addrlen)) < 0) {
            perror("accept");
            exit(EXIT_FAILURE);
        }

        // Read the incoming request
        read(new_socket, buffer, BUFFER_SIZE);
        printf("Received request:\n%s\n", buffer);

        // Check if the request is a POST request
        if (strncmp(buffer, "POST", 4) == 0) {
            // Find the start of the POST data
            char *post_data = strstr(buffer, "\r\n\r\n");
            if (post_data) {
                post_data += 4; // Skip the \r\n\r\n

                // Extract VM name and command
                char vm_name[256] = {0};
                char command[256] = {0};
                sscanf(post_data, "vm=%255[^&]&command=%255s", vm_name, command);

                printf("VM Name: %s\n", vm_name);
                printf("Command: %s\n", command);

                // Run the command in the container
                runCommand(vm_name, command);

                // Send response
                write(new_socket, responseHeader, strlen(responseHeader));
                write(new_socket, response, strlen(response));
                printf("Response sent\n");
            }
        }

        // Close the connection
        close(new_socket);
    }

    free(content_buffer);
}

