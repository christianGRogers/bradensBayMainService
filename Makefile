# Compiler
CC = gcc

# Compiler flags
CFLAGS = -Wall -Wextra -g

# Executable names
SERVER_EXEC = server

# Source files
SERVER_SRC = connect.c


# Build all
all: $(SERVER_EXEC)

# Build the server
$(SERVER_EXEC): $(SERVER_SRC)
	$(CC) $(CFLAGS) -o $(SERVER_EXEC) $(SERVER_SRC)



# Clean the build files
clean:
	rm -f $(SERVER_EXEC) 
