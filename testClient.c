#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void send_command(int sock, const char* command);

int main() {
    int sock = 0;
    struct sockaddr_in serv_addr;
    char buffer[BUFFER_SIZE] = {0};

    // Create socket
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        printf("\n Socket creation error \n");
        return -1;
    }

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(PORT);

    // Convert IPv4 and IPv6 addresses from text to binary form
    if (inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr) <= 0) {
        printf("\nInvalid address/ Address not supported \n");
        return -1;
    }

    // Connect to the server
    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
        printf("\nConnection Failed \n");
        return -1;
    }

    // Send the VM name as part of the initial POST request
    char *vm_name = "UKfKH115mGVUPD6vDvILbqUVdet1";
    // printf("Enter the VM name: ");
    // fgets(vm_name, sizeof(vm_name), stdin);
    // vm_name[strcspn(vm_name, "\n")] = 0; // Remove the newline character

    // Format and send the POST request to send the VM name to the server
    char post_request[BUFFER_SIZE];
    snprintf(post_request, sizeof(post_request),
             "POST / HTTP/1.1\r\n"
             "Host: localhost\r\n"
             "Content-Type: application/x-www-form-urlencoded\r\n"
             "Content-Length: %lu\r\n\r\n"
             "vm=%s", strlen(vm_name) + 3, vm_name); // +3 for "vm=" part

    send(sock, post_request, strlen(post_request), 0);
    printf("VM name sent: %s\n", vm_name);

    // Start the interactive loop for sending commands
    while (1) {
        printf("Enter command to send to VM: ");
        fgets(buffer, sizeof(buffer), stdin);
        buffer[strcspn(buffer, "\n")] = 0; // Remove newline character

        if (strcmp(buffer, "exit") == 0) {
            printf("Exiting...\n");
            break;
        }

        send_command(sock, buffer);

        // Receive the output from the server (VM)
        memset(buffer, 0, sizeof(buffer));
        int valread = read(sock, buffer, BUFFER_SIZE - 1);
        if (valread > 0) {
            buffer[valread] = '\0';
            printf("VM output:\n%s\n", buffer);
        } else {
            printf("Connection closed by server.\n");
            break;
        }
    }

    close(sock);
    return 0;
}

void send_command(int sock, const char* command) {
    // Send the command to the server
    send(sock, command, strlen(command), 0);
}
