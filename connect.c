#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/wait.h>
#include <ctype.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void runSession(char *vmName, int client_fd);
int start_connection();
void url_decode(char *src, char *dest);
int hex_to_int(char c);

int main() {
    start_connection();
    return 0;
}

void runSession(char *vmName, int client_fd) {
    int toVmPipe[2];    // Pipe for sending commands to VM
    int fromVmPipe[2];  // Pipe for receiving output from VM

    if (pipe(toVmPipe) == -1 || pipe(fromVmPipe) == -1) {
        perror("pipe failed");
        exit(EXIT_FAILURE);
    }

    pid_t pid = fork();
    if (pid == -1) {
        perror("fork failed");
        exit(EXIT_FAILURE);
    }

    if (pid == 0) {
        // Child process: set up pipes and execute shell on the VM
        close(toVmPipe[1]);   // Close unused write end (parent writes here)
        dup2(toVmPipe[0], STDIN_FILENO);  // Redirect stdin to pipe
        close(toVmPipe[0]);

        close(fromVmPipe[0]); // Close unused read end (parent reads here)
        dup2(fromVmPipe[1], STDOUT_FILENO);  // Redirect stdout to pipe
        dup2(fromVmPipe[1], STDERR_FILENO);  // Redirect stderr to pipe
        close(fromVmPipe[1]);

        execlp("lxc", "lxc", "exec", vmName, "--", "sh", (char *)NULL);
        perror("execlp failed");
        exit(EXIT_FAILURE);
    } else {
        // Parent process: interact with the VM shell
        close(toVmPipe[0]);  // Close unused read end
        close(fromVmPipe[1]); // Close unused write end

        char buffer[BUFFER_SIZE];
        ssize_t bytesRead;
        char vm_output[BUFFER_SIZE] = {0};

        // Infinite loop to handle multiple commands
        while (1) {
            memset(buffer, 0, BUFFER_SIZE);

            // Receive command from client
            bytesRead = read(client_fd, buffer, BUFFER_SIZE - 1);
            if (bytesRead <= 0) {
                printf("Client disconnected\n");
                break; // Exit the loop if client disconnects
            }

            buffer[bytesRead] = '\0'; // Null-terminate the command

            // Write the command to the VM
            write(toVmPipe[1], buffer, strlen(buffer));

            // Read the output from the VM
            bytesRead = read(fromVmPipe[0], vm_output, BUFFER_SIZE - 1);
            if (bytesRead > 0) {
                vm_output[bytesRead] = '\0';  // Null-terminate the output
                printf("Output from VM:\n%s\n", vm_output);

                // Send the VM output back to the client
                write(client_fd, vm_output, strlen(vm_output));
            }
        }

        // Close pipes when done
        close(toVmPipe[1]);
        close(fromVmPipe[0]);

        // Wait for the child process to terminate
        wait(NULL);
    }
}

int start_connection() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    char buffer[BUFFER_SIZE] = {0};
    char *responseHeader = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: ";
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

                // Extract VM name
                char vm_name[256] = {0};
                sscanf(post_data, "vm=%255s", vm_name);

                // URL decode the VM name
                char decoded_vm_name[256] = {0};
                url_decode(vm_name, decoded_vm_name);

                printf("VM Name: %s\n", decoded_vm_name);

                // Start a persistent session with the VM
                runSession(decoded_vm_name, new_socket);

                printf("Session ended\n");
            }
        }

        // Close the connection
        close(new_socket);
    }
}

void url_decode(char *src, char *dest) {
    char *p = dest;
    while (*src) {
        if (*src == '%') {
            if (src[1] && src[2]) {
                *p++ = (char)((hex_to_int(src[1]) << 4) | hex_to_int(src[2]));
                src += 2;
            }
        } else if (*src == '+') {
            *p++ = ' ';
        } else {
            *p++ = *src;
        }
        src++;
    }
    *p = '\0';
}

int hex_to_int(char c) {
    if (c >= '0' && c <= '9') {
        return c - '0';
    } else if (c >= 'a' && c <= 'f') {
        return c - 'a' + 10;
    } else if (c >= 'A' && c <= 'F') {
        return c - 'A' + 10;
    } else {
        return -1;
    }
}
