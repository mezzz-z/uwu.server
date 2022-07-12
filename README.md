# uwu_server
UWU server-side

## what is UWU
UWU is very small application that you can use it to communicating with you friends


### **features**
- Video Calling / using web rtc and peer to peer communication
- Chatting / using web-socket
- coming soon...

# Startup

### 1. database setup
* use postgresql as your database
* insert the queries to your db  
<sub>( database queries will be find in ./src/ database/query.sql )<sup>


### 2. add these variables to .env
* PORT=8080
* DB_CONFIG=
    ```json
        {
            // your database username, DEFAULT: postgres
            "user": "postgres",
            // your database hostname, DEFAULT: localhost
            "host": "localhost",
            "password": "<db_password>",
            "database": "<db_name>",
            // your database port, DEFAULT: 5432
            "port": 5432
        }
    ```
* ACCESS_TOKEN_SECRET="<base64_encoded_secret>"
* REFRESH_TOKEN_SECRET="<base64_encoded_secret>"

###  3. run these commands
```shell
    npm install && npm start
```
