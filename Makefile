# Compiler
CC = gcc

# Compiler flags
CFLAGS = -Wall -Wextra -g

# Executable names
SERVER_EXEC = server
CLIENT_EXEC = client
SOCK_SERVER_EXEC = SockServer
# Source files
SERVER_SRC = connect.c
CLIENT_SRC = testClient.c
SOCK_SERVER_SRC = SockServer.c

# Build all
all: $(SERVER_EXEC) $(CLIENT_EXEC)

# Build the server
$(SERVER_EXEC): $(SERVER_SRC)
	$(CC) $(CFLAGS) -o $(SERVER_EXEC) $(SERVER_SRC)

# Build the client
$(CLIENT_EXEC): $(CLIENT_SRC)
	$(CC) $(CFLAGS) -o $(CLIENT_EXEC) $(CLIENT_SRC)

$(SOCK_SERVER_EXEC): $(SOCK_SERVER_SRC)
	$(CC) $(CFLAGS) -o $(SOCK_SERVER_EXEC_EXEC) $(SOCK_SERVER_SRC_SRC)

# Clean the build files
clean:
	rm -f $(SERVER_EXEC) $(CLIENT_EXEC)
