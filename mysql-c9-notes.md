Developing in C9
===============

## Starting app.js
The first thing to do is start a MySQL instance in the workspace.

``` 
# Run the interactive shell (which also starts the instance)
$ mysql-ctl cli

# Stopping the interactive shell when needed
$ mysql-ctl stop

# Start MySQL and create an empty database when needed 
# (really only used in initial starting of MySQL for the project as a whole )
$ mysql-ctl start
```

Connect to a database with these credentials
* Hostname - $IP (The same local IP as the application you run on Cloud9) ```(localhost)```
* Port - ```3306``` (The default MySQL port number)
* User - $C9_USER (Your Cloud9 user name)
* Password - “” (No password since you can only access the DB from within the workspace)
* Database - (The database username) ```c9```  or a database you created for your app through the MySQL shell

## Putting it all together
```
var dbconnection = mysql.createConnection({
    host: 'localhost',
    user: 'c9-username',
    // Comment-out unless the database already exists
    database: 'database-name'
});

or these credentials

       Root User: blue9
   Database Name: c9


dbconnection.connect((err) => {
    if (err) throw err;
    console.log("MySQL started & connected..");
});

```