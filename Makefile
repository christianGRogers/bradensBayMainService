# Compiler
CC = gcc

# Compiler flags
CFLAGS = -Wall -Wextra -g

# Executable names
SERVER_EXEC = server
CLIENT_EXEC = client

# Source files
SERVER_SRC = connect.c
CLIENT_SRC = testClient.c

# Build all
all: $(SERVER_EXEC) $(CLIENT_EXEC)

# Build the server
$(SERVER_EXEC): $(SERVER_SRC)
	$(CC) $(CFLAGS) -o $(SERVER_EXEC) $(SERVER_SRC)

# Build the client
$(CLIENT_EXEC): $(CLIENT_SRC)
	$(CC) $(CFLAGS) -o $(CLIENT_EXEC) $(CLIENT_SRC)

# Clean the build files
clean:
	rm -f $(SERVER_EXEC) $(CLIENT_EXEC)
