const express = require('express');
const { exec } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors'); 
const app = express();
app.use(cors());
const PORT = 3003;
const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

// Replace with your actual API key
const API_KEY = ''; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(express.json());

// Function to run commands inside the LXD VM
function runCommandsInLXDVM(uid, commands) {
    const matches = commands.match(/'''(?!bash)(.*?)'''/gs);
    var extractedCommands = matches ? matches.map(match => match.slice(3, -3)) : [];

    const formattedCommands = extractedCommands.join('\n').replace(/\n/g, ';');
    
    const lxdCommand = `lxc exec ${uid} -- bash -c "${formattedCommands}"`;

    exec(lxdCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing commands: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        
        const explanationMatch = commands.match(/Explanation:\s*(.*)/s);
        return explanationMatch ? explanationMatch[1].trim() : null;
    });
}


// Define the route to handle the user prompt
app.post('/execute', async (req, res) => {
    const { uid, prompt, username, contPwd } = req.body;

    if (!uid || !prompt) {
        return res.status(400).json({ error: 'uid and prompt are required.' });
    }

    try {
        // Generate commands using the Gemini model
        const parts = [
            {text: "input: make a website for a coffee shop named Tims coffee shop and insert appropriate stock photos."},
            {text: "output: # Update the system and install necessary packages\nsudo apt update && sudo apt upgrade -y\n\n\n# Change to the exposed directory\ncd /var/www/html/someusername\n\n# Create directories for the website\nmkdir -p css js images\n\n# Download a stock photo archive (replace URL with an appropriate source if needed)\nwget https://unsplash.com/s/photos/coffee-shop -O coffee-shop-photos.zip\n\n# Unzip the photos into the images directory (skip if download doesn't provide a zip)\nunzip coffee-shop-photos.zip -d images\nrm coffee-shop-photos.zip\n\n# Create the index.html file with basic website structure\ncat <"},
            {text: "input: make a ecommerce site for selling books, make a basic js account and transaction service"},
            {text: "output: # Step 1: Update the system and install necessary packages\nsudo apt update && sudo apt upgrade -y\nsudo apt install  nodejs npm git -y\n\n# Step 2: Navigate to the web directory\ncd /var/www/html/someusername\n\n# Step 3: Create a basic HTML file for the eCommerce front-end\necho '\n\n\n\n    \n    \n    \n    \n\n\n    Welcome to the Book Store\n    \n    \n    \n    \n        Welcome, !\n        \n    \n    \n\n\n' > index.html\n\n# Step 4: Create a CSS file for styling\necho '\nbody {\n    font-family: Arial, sans-serif;\n    text-align: center;\n    background-color: #f5f5f5;\n    color: #333;\n}\nform {\n    margin: 10px 0;\n}\ninput {\n    padding: 5px;\n    margin: 5px;\n}\nbutton {\n    padding: 5px 10px;\n    background-color: #4CAF50;\n    color: white;\n    border: none;\n    cursor: pointer;\n}\n' > styles.css\n\n# Step 5: Create a basic JavaScript file for handling account and transactions\necho '\ndocument.addEventListener(\"DOMContentLoaded\", () => {\n    const registerForm = document.getElementById(\"register-form\");\n    const loginForm = document.getElementById(\"login-form\");\n    const userInfo = document.getElementById(\"user-info\");\n    const userNameSpan = document.getElementById(\"user-name\");\n    const logoutBtn = document.getElementById(\"logout\");\n\n    let users = {};\n\n    // Registration process\n    registerForm.addEventListener(\"submit\", (e) => {\n        e.preventDefault();\n        const username = document.getElementById(\"username\").value;\n        const password = document.getElementById(\"password\").value;\n\n        if (!users[username]) {\n            users[username] = { password: password, balance: 100 };\n            alert(\"Registration successful!\");\n        } else {\n            alert(\"Username already exists!\");\n        }\n    });\n\n    // Login process\n    loginForm.addEventListener(\"submit\", (e) => {\n        e.preventDefault();\n        const username = document.getElementById(\"login-username\").value;\n        const password = document.getElementById(\"login-password\").value;\n\n        if (users[username] && users[username].password === password) {\n            alert(\"Login successful!\");\n            loginForm.style.display = \"none\";\n            registerForm.style.display = \"none\";\n            userInfo.style.display = \"block\";\n            userNameSpan.textContent = username;\n        } else {\n            alert(\"Invalid credentials!\");\n        }\n    });\n\n    // Logout process\n    logoutBtn.addEventListener(\"click\", () => {\n        loginForm.style.display = \"block\";\n        registerForm.style.display = \"block\";\n        userInfo.style.display = \"none\";\n        alert(\"You have been logged out.\");\n    });\n\n    // Placeholder for book list\n    document.getElementById(\"book-list\").innerHTML = `\n        Available Books\n        \n            The Great Gatsby - $10\n            To Kill a Mockingbird - $12\n            1984 by George Orwell - $15\n        \n    `;\n});\n' > app.js\n\n# Step 6: Change ownership and permissions to allow Apache to serve the files\nsudo chown -R www-data:www-data /var/www/html/someusername\nsudo chmod -R 755 /var/www/html/someusername\n\n# Step 7: Restart Apache service to apply changes\nsudo systemctl restart apache2"},
            {text: "input: make a website for a local restaurant with a reservation feature."},
            {text: "output: # Update and upgrade the system\necho \"userpassword\" | sudo -S apt update && echo \"userpassword\" | sudo -S apt upgrade -y\n\n# Install required packages (Apache2 is already installed, so installing PHP and MySQL)\necho \"userpassword\" | sudo -S apt install -y php libapache2-mod-php php-mysql mysql-server\n\n# Secure MySQL installation (you'll be prompted to set a MySQL root password, remove test databases, etc.)\necho \"userpassword\" | sudo -S mysql_secure_installation\n\n# Create a MySQL database and user for the restaurant reservation system\necho \"userpassword\" | sudo -S mysql -u root -p -e \"\nCREATE DATABASE restaurant_db;\nCREATE USER 'restaurant_user'@'localhost' IDENTIFIED BY 'password';\nGRANT ALL PRIVILEGES ON restaurant_db.* TO 'restaurant_user'@'localhost';\nFLUSH PRIVILEGES;\"\n\n# Set up the web directory\necho \"userpassword\" | sudo -S mkdir -p /var/www/html/someusername/restaurant\necho \"userpassword\" | sudo -S chown -R $USER:$USER /var/www/html/someusername/restaurant\n\n# Create the index.php file\necho \"Welcome to Our Local Restaurant';\n?>\" > /var/www/html/someusername/restaurant/index.php\n\n# Create a sample reservation form (reservation.php)\necho \"connect_error) {\n            die('Connection failed: ' . \\$conn->connect_error);\n        }\n\n        // Insert reservation data\n        \\$sql = 'INSERT INTO reservations (name, date, time, guests) VALUES (?,?,?,?)';\n        \\$stmt = \\$conn->prepare(\\$sql);\n        \\$stmt->bind_param('sssi', \\$name, \\$date, \\$time, \\$guests);\n\n        if (\\$stmt->execute()) {\n            echo 'Reservation successfully made!';\n        } else {\n            echo 'Error: ' . \\$stmt->error;\n        }\n\n        \\$stmt->close();\n        \\$conn->close();\n    }\n?>\n\n\n\n\n    \n\n\n    \n\n\" > /var/www/html/someusername/restaurant/reservation.php\n\n# Create a MySQL table to store reservations\necho \"userpassword\" | sudo -S mysql -u root -p -e \"\nUSE restaurant_db;\nCREATE TABLE reservations (\n    id INT AUTO_INCREMENT PRIMARY KEY,\n    name VARCHAR(255) NOT NULL,\n    date DATE NOT NULL,\n    time TIME NOT NULL,\n    guests INT NOT NULL\n);\"\n\n# Adjust permissions\necho \"userpassword\" | sudo -S chown -R www-data:www-data /var/www/html/someusername/restaurant\n\n# Restart Apache to apply changes\necho \"userpassword\" | sudo -S systemctl restart apache2"},
            {text: "input: make a site for a high school with a login feature."},
            {text: "output: # Update package list and install required packages\necho \"userpassword\" | sudo -S apt update\necho \"userpassword\" | sudo -S apt install -y php libapache2-mod-php php-mysql mariadb-server\n\n# Secure the MariaDB installation (automated version)\necho \"userpassword\" | sudo -S mysql_secure_installation <"},
            {text: "input: make a site for a shoe brand called pookie."},
            {text: "output: # Update package list\nsudo apt update\n\n# Install necessary packages for Apache, PHP, and Git\necho \"userpassword\" | sudo -S apt install -y php libapache2-mod-php git\n\n# Navigate to the Apache root directory\ncd /var/www/html/someusername\n\n# Create a new directory for the Pookie shoe brand site\nsudo mkdir pookie\ncd pookie\n\n# Set up a basic HTML structure\nsudo bash -c 'cat > index.html << EOF\n\n\n\n    \n    \n\n\n    \n        Welcome to Pookie Shoes\n        Quality, Comfort, and Style.\n        \n            \n            Pookie Runner - $89.99\n        \n        \n            \n            Pookie Casual - $79.99\n        \n    \n\n\nEOF'\n\n# Download sample shoe images\nsudo wget -O shoe1.jpg https://via.placeholder.com/300x200?text=Pookie+Shoe+1\nsudo wget -O shoe2.jpg https://via.placeholder.com/300x200?text=Pookie+Shoe+2\n\n# Change ownership of the files to the Apache user\nsudo chown -R www-data:www-data /var/www/html/someusername/pookie\n\n# Set appropriate permissions\nsudo chmod -R 755 /var/www/html/someusername/pookie\n\n# Restart Apache to apply changes\necho \"userpassword\" | sudo -S systemctl restart apache2"},
            {text: "input: make a basic cat site where users can make accounts and chat with their freinds."},
            {text: "output: # Update package lists\nsudo apt-get update\n\n# Install PHP and required modules\necho 'userpassword' | sudo -S apt-get install -y php libapache2-mod-php php-sqlite3\n\n# Navigate to the exposed folder\ncd /var/www/html/someusername\n\n# Create the SQLite database for user accounts and chats\nsudo bash -c 'cat > chat.db.sql' <"},
            {text: "input: make a basic social media platform where users can upload photos make accounts comment like and follow"},
            {text: "output: # Update package lists\necho \"userpassword\" | sudo -S apt update\n\n# Install necessary packages (PHP, MySQL, Composer)\necho \"userpassword\" | sudo -S apt install -y php libapache2-mod-php php-mysql php-xml php-mbstring php-curl mysql-server unzip curl composer\n\n# Enable necessary Apache modules\necho \"userpassword\" | sudo -S a2enmod rewrite\necho \"userpassword\" | sudo -S systemctl restart apache2\n\n# Configure MySQL - set root password (replace 'rootpassword' with your desired password)\necho \"userpassword\" | sudo -S mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootpassword';\"\necho \"userpassword\" | sudo -S mysql -e \"FLUSH PRIVILEGES;\"\n\n# Create MySQL database for the platform\necho \"userpassword\" | sudo -S mysql -u root -p'rootpassword' -e \"CREATE DATABASE socialmedia;\"\n\n# Change directory to the exposed web folder\ncd /var/www/html/someusername\n\n# Install Laravel via Composer\necho \"userpassword\" | sudo -S composer create-project --prefer-dist laravel/laravel socialmedia\n\n# Set appropriate permissions\necho \"userpassword\" | sudo -S chown -R www-data:www-data /var/www/html/someusername/socialmedia\necho \"userpassword\" | sudo -S chmod -R 755 /var/www/html/someusername/socialmedia\n\n# Configure .env file for Laravel\ncd /var/www/html/someusername/socialmedia\necho \"DB_CONNECTION=mysql\" >> .env\necho \"DB_HOST=127.0.0.1\" >> .env\necho \"DB_PORT=3306\" >> .env\necho \"DB_DATABASE=socialmedia\" >> .env\necho \"DB_USERNAME=root\" >> .env\necho \"DB_PASSWORD=rootpassword\" >> .env\n\n# Run Laravel migration to create default tables\necho \"userpassword\" | sudo -S php artisan migrate\n\n# Install Laravel packages for authentication and social media features\necho \"userpassword\" | sudo -S composer require laravel/ui\necho \"userpassword\" | sudo -S php artisan ui bootstrap --auth\necho \"userpassword\" | sudo -S npm install && npm run dev\n\n# Create controllers, models, and views for user posts, comments, and likes\necho \"userpassword\" | sudo -S php artisan make:model Post -m\necho \"userpassword\" | sudo -S php artisan make:model Comment -m\necho \"userpassword\" | sudo -S php artisan make:model Like -m\necho \"userpassword\" | sudo -S php artisan make:model Follow -m\n\n# Edit migration files to define tables for posts, comments, likes, and follows (simplified version)\necho \"userpassword\" | sudo -S bash -c 'cat > database/migrations/*_create_posts_table.php <"},
            {text: "input: make a site that rates resturants allowing users to add reviews."},
            {text: "output: # Update the system and install required packages\necho \"userpassword\" | sudo -S apt update && echo \"userpassword\" | sudo -S apt install -y mysql-server php php-mysql libapache2-mod-php\n\n# Secure the MySQL installation\necho \"userpassword\" | sudo -S mysql_secure_installation <"},
            {text: "input: make a course website that allows students to login and view assignments."},
            {text: "output: # Update system packages\necho \"userpassword\" | sudo -S apt update -y\n\n# Install necessary packages (Apache, MySQL, PHP, and extensions)\necho \"userpassword\" | sudo -S apt install -y mysql-server php libapache2-mod-php php-mysql php-curl php-json php-mbstring\n\n# Secure MySQL installation (you will need to set a root password during this process)\necho \"userpassword\" | sudo -S mysql_secure_installation\n\n# Log in to MySQL to create a database and user for the course site\necho \"userpassword\" | sudo -S mysql -u root -p <"},
            {text: "input: make a site that track the weather with a regeion specific feature."},
            {text: "output: # Update and upgrade the system\necho \"userpassword\" | sudo -S apt update && sudo apt upgrade -y\n\n# Install necessary packages: Python, pip, Apache modules, and weather API library\necho \"userpassword\" | sudo -S apt install -y python3 python3-pip libapache2-mod-wsgi-py3\n\n# Install Flask and requests library\npip3 install flask requests\n\n# Navigate to the exposed web directory\ncd /var/www/html/someusername\n\n# Create the Flask application\ncat <"},
            {text: "input: make a portfolio site"},
            {text: "output: echo 'userpassword' | sudo -S apt update\necho 'userpassword' | sudo -S systemctl enable apache2\necho 'userpassword' | sudo -S systemctl start apache2\n\n# Navigate to the public folder for the user\ncd /var/www/html/someusername\n\n# Set up a basic HTML portfolio page\necho \"\n\n\n    \n    \n    \n    \n\n\n    \n        Welcome to My Portfolio\n    \n    \n        \n            About Me\n            This is a short description about myself and my work.\n        \n        \n            Projects\n            \n                Project 1\n                Project 2\n                Project 3\n            \n        \n        \n            Contact\n            Email: example@example.com\n        \n    \n    \n        © 2024 My Portfolio\n    \n\n\" > index.html\n\n# Add a basic CSS file for styling\necho \"body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}\nheader {\n    background-color: #333;\n    color: #fff;\n    padding: 20px;\n    text-align: center;\n}\nmain {\n    padding: 20px;\n}\nh1, h2 {\n    color: #333;\n}\nfooter {\n    background-color: #333;\n    color: #fff;\n    text-align: center;\n    padding: 10px;\n    position: fixed;\n    width: 100%;\n    bottom: 0;\n}\" > style.css\n\n# Adjust permissions to ensure Apache can serve the files\necho 'userpassword' | sudo -S chown -R www-data:www-data /var/www/html/someusername\necho 'userpassword' | sudo -S chmod -R 755 /var/www/html/someusername"},
            {text: "input: make a portfolio site"},
            {text: "output: echo \"userpassword\" | sudo -S apt update\necho \"userpassword\" | sudo -S apt install -y git unzip\n\n# Create a new directory for the website files in the Apache exposed folder\nsudo mkdir -p /var/www/html/someusername\n\n# Download a simple HTML/CSS portfolio template\ncd /tmp\nwget https://github.com/startbootstrap/startbootstrap-freelancer/archive/refs/heads/master.zip -O portfolio.zip\nunzip portfolio.zip\nsudo mv startbootstrap-freelancer-master/* /var/www/html/someusername\n\n# Set permissions so Apache can serve the files\nsudo chown -R www-data:www-data /var/www/html/someusername\nsudo chmod -R 755 /var/www/html/someusername\n\n# Restart Apache to ensure changes take effect\necho \"userpassword\" | sudo -S systemctl restart apache2\n\n# Output completion message\necho \"Portfolio site setup complete! Access it at http://localhost/someusername\""},
            {text: "input: make a portfolio site"},
            {text: "output: ```bash\n# Update the system and install necessary packages\necho \"userpassword\" | sudo -S apt update && echo \"userpassword\" | sudo -S apt upgrade -y\n\n# Navigate to the exposed web directory\ncd /var/www/html/someusername\n\n\n# Create basic HTML structure\necho \"\n\n\n\n    \n    \n    \n    \n\n\n    \n        My Portfolio\n    \n    \n        \n            About Me\n            This is a short description about myself and my work. You can add more details about your skills, experience, and interests here.\n        \n        \n            Projects\n            \n                \n                    Project 1\n                    Brief description of Project 1.\n                    View Project\n                \n                \n                    Project 2\n                    Brief description of Project 2.\n                    View Project\n                \n                \n                    Project 3\n                    Brief description of Project 3.\n                    View Project\n                \n            \n        \n        \n            Contact\n            Email: example@example.com\n        \n    \n    \n        © 2024 My Portfolio\n    \n\n\n\" > index.html\n\n# Create a basic CSS file for styling\necho \"\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}\nheader {\n    background-color: #333;\n    color: #fff;\n    padding: 20px;\n    text-align: center;\n}\nmain {\n    padding: 20px;\n}\nh1, h2 {\n    color: #333;\n}\n.project-container {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: space-between;\n}\n.project {\n    width: 48%;\n    margin-bottom: 20px;\n    padding: 15px;\n    border: 1px solid #ccc;\n    border-radius: 5px;\n}\nfooter {\n    background-color: #333;\n    color: #fff;\n    text-align: center;\n    padding: 10px;\n    position: fixed;\n    width: 100%;\n    bottom: 0;\n}\n\" > style.css\n\n# Change ownership and permissions\necho \"userpassword\" | sudo -S chown -R www-data:www-data /var/www/html/someusername\necho \"userpassword\" | sudo -S chmod -R 755 /var/www/html/someusername\n\n# Restart Apache to apply changes\necho \"userpassword\" | sudo -S systemctl restart apache2\n```\n\n**Explanation:**\n\n1. **Update System and Install Packages:**\n   - Updates the system's package list.\n   - Ensures the latest versions of packages are installed.\n\n2. **Create Directory Structure:**\n   - Creates a `portfolio` directory in the Apache exposed folder.\n   - Navigates into the newly created `portfolio` directory.\n\n3. **Create Basic HTML:**\n   - Creates an `index.html` file with basic HTML structure:\n     - ``, ``, ``, ``, etc.\n     - Includes `` for the CSS file.\n     - Contains placeholder text for sections like \"About Me,\" \"Projects,\" and \"Contact.\"\n\n4. **Create Basic CSS:**\n   - Creates a `style.css` file for basic styling.\n   - Includes styles for body, header, main, h1, h2, and footer.\n   - Adds styles for the \"project\" container and individual project elements.\n\n5. **Change Permissions:**\n   - Changes the ownership of the `portfolio` directory to the Apache user (`www-data`).\n   - Sets permissions to allow Apache to read and execute files within the directory.\n\n6. **Restart Apache:**\n   - Restarts the Apache service to ensure the changes take effect.\n\n**To Use This:**\n\n1. **Replace Placeholder Content:**\n   - Edit the `index.html` file to include your own:\n     - **About Me:** Fill in details about yourself.\n     - **Projects:** List your projects with descriptions and links.\n     - **Contact:** Provide your contact information.\n2. **Customize CSS:**\n   - Edit the `style.css` file to customize the visual appearance of your portfolio site.\n3. **Access the Site:**\n   - Open your web browser and visit `http://localhost/someusername/portfolio/` to see your site.\n\nThis is a very basic setup. For a more advanced portfolio site, you can add more HTML elements, CSS styles, and even JavaScript for interactivity. You can also consider using a framework like Bootstrap or Tailwind CSS to help you build a more visually appealing site."},
            {text: "input: "+ prompt },
            {text: "output: "},
          ];
        
          const result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
          });
        const commands = result.response.text().trim();
        commands.replace("someusername", username);
        commands.replace("userpassword", contPwd);

        if (commands) {
            console.log("ai out for uid:" +uid+"prompt="+prompt +"=>"+commands);
            return res.status(200).json({ message: runCommandsInLXDVM(uid, commands) });
        } else {
            return res.status(500).json({ error: 'Failed to generate commands from Gemini.' });
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

