var mysql = require("mysql");

/* ======================== MySQL Connection ================================ */
// Configure the MySQL connection object                                    
var dbconnection = mysql.createConnection({
    host: 'localhost',
    user: 'blue9',
    // Comment-out if the database doesn't exist yet
    database: 'ulife_db'
});

// Try to connect to MySQL
dbconnection.connect((err) => {
    if (err) throw err;
    console.log("MySQL started & connected..");
});

module.exports = dbconnection;