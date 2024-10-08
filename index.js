const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const db = require('./database')
var fs = require('fs');

const app = express()
app.use(express.json());

const port = 3000
const easyTeamPartnerId = 'd40e2f92-2523-4833-a9cc-a95cef576876'

app.post('/login', (req, res, next) => {
    var privateKey = fs.readFileSync('priv (1).key', 'utf8');

    if (!req.body) return res.sendStatus(400)
    
    const {username, password} = req.body

    if (username && password) {
        db.query(`SELECT * FROM employees WHERE name = '${username}'`, async (error, results) => {

            if (error || results.length === 0) {
                return res.status(401).json({ message: 'Invalid email' });
            }
    
            const user = results[0]; // Get the user from the query result
    
            // Compare the provided password with the stored hash
            const passwordMatch = await bcrypt.compare(password, user.password);
    
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid or password' });
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
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})