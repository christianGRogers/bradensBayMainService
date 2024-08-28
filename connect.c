#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void send_command(int sockfd) {
    char command[BUFFER_SIZE];
    printf("Enter command (type 'exit' to quit): ");
    while (fgets(command, sizeof(command), stdin)) {
        // Remove newline character
        command[strcspn(command, "\n")] = '\0';

        // Send command to server
        send(sockfd, command, strlen(command), 0);
        if (strcmp(command, "exit") == 0) {
            break;
        }

        // Receive response from server
        char buffer[BUFFER_SIZE];
        ssize_t bytes_received = recv(sockfd, buffer, sizeof(buffer) - 1, 0);
        if (bytes_received > 0) {
            buffer[bytes_received] = '\0'; // Null-terminate the response
            printf("Server response:\n%s\n", buffer);
        } else {
            printf("No response from server or error occurred\n");
            break;
        }

        printf("Enter command (type 'exit' to quit): ");
    }
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr;

    // Create socket
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    // Specify the server address and port
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1"); // Assuming the server is on localhost

    // Connect to the server
    if (connect(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection failed");
        exit(EXIT_FAILURE);
    }

    printf("Connected to server.\n");

    // Start the continuous command session
    send_command(sockfd);

    // Close the socket when done
    close(sockfd);

    return 0;
}
