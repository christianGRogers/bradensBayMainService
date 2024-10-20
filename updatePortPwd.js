const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDmdf8NhoFAzXKGuBWYq5XoDrM5eNClgOg",
    authDomain: "bradensbay-1720893101514.firebaseapp.com",
    databaseURL: "https://bradensbay-1720893101514-default-rtdb.firebaseio.com/",
    projectId: "bradensbay-1720893101514",
    storageBucket: "bradensbay-1720893101514.appspot.com",
    messagingSenderId: "280971564912",
    appId: "1:280971564912:web:989fff5191d0512c1b21b5",
    measurementId: "G-DNJS8CVKWD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Function to update user data
function updateUserData(uid, password, port) {
    const userRef = ref(database, 'users/' + uid);
    return update(userRef, {
        password: password,
        port: port
    });
}

// Main function to get arguments and execute update
function main() {
    const args = process.argv.slice(2);
    if (args.length !== 3) {
        console.log("Usage: node updateUser.js <uid> <password> <port>");
        process.exit(1);
    }

    const [uid, password, port] = args;

    updateUserData(uid, password, port)
        .then(() => {
            console.log(`Successfully updated user ${uid}`);
            return 0;
        })
        .catch((error) => {
            console.error(`Error updating user: ${error}`);
        });
}

// Execute the script
main();
