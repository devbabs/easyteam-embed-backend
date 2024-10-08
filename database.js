const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
})

dbConnection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the MySQL database');
});

const createLocationsTable = () => {
    const createLocationsTableQuery = `
        CREATE TABLE IF NOT EXISTS locations (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `

    dbConnection.query(createLocationsTableQuery, (error, results) => {
        if (error) throw error;
        console.log('Created Locations table');
    })
}

const createEmployeesTable = () => {
    const createEmployeesTableQuery = `
        CREATE TABLE IF NOT EXISTS employees (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            location_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
        )
    `

    dbConnection.query(createEmployeesTableQuery, (error, results) => {
        if (error) throw error;
        console.log('Created employees table');
    })
}

const seedLocationEmployeesData = () => {
    // Check if locatons table is empty
    dbConnection.query(`SELECT * FROM locations`, (err, rows) => {
        if (err) {
            throw err
        }

        if (rows.length === 0) {
            const locations = [
                {
                    name: "Location 1",
                    employees: [
                        {
                            name: "Babs",
                            is_admin: 0,
                            password: "123456"
                        },
                        {
                            name: "Lola",
                            is_admin: 0,
                            password: "123456"
                        },
                        {
                            name: "Macaulay",
                            is_admin: 1,
                            password: "123456"
                        }
                    ]
                },
                {
                    name: "Location 2",
                    employees: [
                        {
                            name: "Jane",
                            is_admin: 0,
                            password: "123456"
                        },
                        {
                            name: "Doe",
                            is_admin: 1,
                            password: "123456"
                        }
                    ]
                }
            ]

            // Add sample locations since the locations table is empty
            locations.forEach(location => {
                const locationId = uuidv4();

                dbConnection.query(`INSERT INTO locations (id, name) VALUES ('${locationId}', '${location.name}')`, (error, results) => {
                    if (error) throw error;
                    console.log(`Inserted location: ${location.name}`, results.insertId)

                    // Add employees for this location
                    location.employees.forEach(async employee => {
                        const userId = uuidv4();
                        const hashedPassword = await bcrypt.hash(employee.password, 10);

                        dbConnection.query(`INSERT INTO employees (id, name, password, is_admin, location_id) VALUES ('${userId}', '${employee.name}', '${hashedPassword}', '${employee.is_admin}', '${locationId}')`, (error, results) => {
                            if (error) throw error;
                            console.log(`Inserted employee: ${employee.name}`)        
                        })                
                    });
                })                
            });
        }
    })
}

// Initialize database with tables
(() => {
    // Create necessary tables
    createLocationsTable()    
    createEmployeesTable()    

    // Seed data if necessary (locations and employees)
    seedLocationEmployeesData()
})()

module.exports = dbConnection