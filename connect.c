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

void runCommand(char *vmName, char *command, char *output);
int start_connection();

int main() {
    start_connection();
    return 0;
}

void runCommand(char *vmName, char *command, char *output) {
    int pipefd[2];
    if (pipe(pipefd) == -1) {
        perror("pipe failed");
        exit(EXIT_FAILURE);
    }

    // Fork a new process to execute the command
    if (fork() == 0) {
        // Child process: execute the command
        close(pipefd[0]); // Close unused read end
        dup2(pipefd[1], STDOUT_FILENO); // Redirect stdout to pipe
        dup2(pipefd[1], STDERR_FILENO); // Redirect stderr to pipe
        close(pipefd[1]); // Close write end after redirect

        execlp("lxc", "lxc", "exec", vmName, "--", "sh", "-c", command, (char *)NULL);
        perror("execlp failed");
        exit(EXIT_FAILURE);
    } else {
        // Parent process: read the output
        close(pipefd[1]); // Close unused write end
        wait(NULL); // Wait for the child to complete

        ssize_t bytesRead = read(pipefd[0], output, BUFFER_SIZE - 1);
        if (bytesRead >= 0) {
            output[bytesRead] = '\0'; // Null-terminate the output
        } else {
            strcpy(output, "Failed to read command output");
        }

        close(pipefd[0]); // Close read end
    }
}

int start_connection() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    char buffer[BUFFER_SIZE] = {0};
    char *responseHeader = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ";
    char content_buffer[BUFFER_SIZE] = {0};

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
        ssize_t bytesRead = read(new_socket, buffer, BUFFER_SIZE - 1);
        if (bytesRead <= 0) {
            perror("read");
            close(new_socket);
            continue;
        }
        buffer[bytesRead] = '\0'; // Null-terminate the buffer
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

                // Run the command in the container and get the output
                runCommand(vm_name, command, content_buffer);
                printf("///////////////////////////output:\n%s", content_buffer);

                // Prepare response
                char content_length[16];
                snprintf(content_length, sizeof(content_length), "%lu", strlen(content_buffer));
                write(new_socket, responseHeader, strlen(responseHeader));
                write(new_socket, content_length, strlen(content_length));
                write(new_socket, "\r\n\r\n", 4); // Header-body separator
                write(new_socket, content_buffer, strlen(content_buffer));
                printf("Response sent\n");
            }
        }

        // Close the connection
        close(new_socket);
    }
}

