#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 8080
#define BUFFER_SIZE 1024

void send_post_request(int sockfd, const char *data) {
    char request[BUFFER_SIZE];
    snprintf(request, sizeof(request),
             "POST / HTTP/1.1\r\n"
             "Host: localhost\r\n"
             "Content-Length: %zu\r\n"
             "Content-Type: application/x-www-form-urlencoded\r\n"
             "Connection: close\r\n\r\n"
             "%s", strlen(data), data);

    send(sockfd, request, strlen(request), 0);
}

int main() {
    int sockfd;
    struct sockaddr_in server_addr;
    char buffer[BUFFER_SIZE] = {0};

    // Create socket
    if ((sockfd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        perror("Socket creation failed");
        exit(EXIT_FAILURE);
    }

    // Specify the server address and port
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    // Connect to the server
    if (connect(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection failed");
        close(sockfd);
        exit(EXIT_FAILURE);
    }

    // Send a POST request with the VM name
    const char *post_data = "vm=myVM";
    send_post_request(sockfd, post_data);

    // Receive and print the server's response
    ssize_t bytes_received = recv(sockfd, buffer, sizeof(buffer) - 1, 0);
    if (bytes_received > 0) {
        buffer[bytes_received] = '\0'; // Null-terminate the response
        printf("Server response:\n%s\n", buffer);
    } else {
        printf("No response from server or error occurred\n");
    }

    // Close the socket
    close(sockfd);
    return 0;
}
