const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const db = require('./database')
var fs = require('fs');

const app = express()
app.use(express.json());

const port = 3000
const easyTeamPartnerId = 'd40e2f92-2523-4833-a9cc-a95cef576876'
const privateKey = fs.readFileSync('priv (1).key', 'utf8');

// Middleware to validate JWT token
const authenticateToken = (req, res, next) => {
    // Get token from the Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  // Extract the token after "Bearer"

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    jwt.verify(token, privateKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        // Token is valid, save user data to request for use in other routes
        req.user = user;  // This stores the decoded JWT payload (e.g., userId) in req.user

        next();  // Proceed to the next middleware or route handler
    });
};

app.get('/employees', authenticateToken, (req, res) => {
    // Check for authenticated Bearer token
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(400)
    
    db.query(`SELECT * FROM employees`, async (error, results) => {

        if (error || results.length === 0) {
            return res.status(401).json({ message: 'Invalid username' });
        }

        const employees = results.map(employee => {
            return {
                id: employee.id,
                name: employee.name,
                location_id: employee.location_id,
                is_admin: employee.is_admin
            }
        });
        
        res.json({
            message: 'Employees fetched successfully',
            employees
        });
    })
})

app.post('/login', (req, res, next) => {
    if (!req.body) return res.sendStatus(400)
    
    const {username, password} = req.body

    if (username && password) {
        db.query(`SELECT * FROM employees WHERE name = '${username}'`, async (error, results) => {
            
            console.log("Check for username response", error, results)
            if (error || results.length === 0) {
                return res.status(401).json({ message: 'Invalid username' });
            }
    
            const user = results[0]; // Get the user from the query result
    
            // Compare the provided password with the stored hash
            const passwordMatch = await bcrypt.compare(password, user.password);
    
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            const payload = {
                employeeId: user.id,
                locationId: user.location_id,
                organizationId: user.location_id,
                partnerId: easyTeamPartnerId,
                payrollId: '<Salsa EMPLOYEE-ID>',
                employerPayrollId: '<Salsa Employer-ID>',
                accessRole: {
                    name: 'manager',
                    permissions: [
                        'LOCATION_READ',
                        'SHIFT_READ',
                        'SHIFT_WRITE',
                        'SHIFT_ADD',
                    ],
                },
                role: {
                    name: '<EMPLOYEE ROLE in store: Cashier/Assistant/Manager...>',
                },
            };
            
            // Password is correct, issue a JWT token
            const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
        
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    location_id: user.location_id,
                    is_admin: user.is_admin
                }
            });
        })
    } else {
        return res.status(401).json({ message: 'You need to provide a username and password' });
    }
})

app.listen(port, () => {
    console.log(`Embed app listening on port ${port}`)
})