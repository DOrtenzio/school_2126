// routes/user.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Middleware di autenticazione Bearer
function authMiddleware(req, res, next) {
    const Authorization = req.headers['authorization'];
    if (!Authorization || !Authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    }
    const token = Authorization.split(' ')[1];
    if (token !== '5IDtoken') {
        return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    }
    next();
}
/** 
 * @swagger
 * security:
 *   - apiKey: []
 *
 * components:
 *   securitySchemes:
 *     apiKey:
 *       type: apiKey
 *       name: Authorization
 *       in: header
 */
/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users

 *     summary: Retrieve a list of users
 *     responses:
 *       200:
 *         description: A list of users
 */

router.get('/users', (req, res) => {
    const usersPath = path.join(__dirname, '../../users.json');
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Impossibile leggere il file utenti.' });
        }
        try {
            const users = JSON.parse(data);
            //sort users by name
            users.sort((a, b) => a.name.localeCompare(b.name));
            //only name and age fields
            users.forEach(user => {
                for (const key in user) {
                    if (key !== 'name' && key !== 'age') {
                        delete user[key];
                    }
                }
            });
            res.status(200).json(users);
        } catch (parseErr) {
            res.status(500).json({ error: 'Errore nel parsing del file utenti.' });
        }
    });
});


/**
 * @swagger
 * /users/{name}:
 *   get:
 *     tags:
 *       - Users

 *     summary: Retrieve users with specific name
 *     parameters:
 *      - in: path
 *        name: name
 *        required: true
 *        schema:
 *          type: string
 *        description: The name of the user to retrieve
 *     responses:
 *       200:
 *         description: Details of the user
 *       404:
 *         description: User not found
 */

router.get('/users/:name', (req, res) => {
    const usersPath = path.join(__dirname, '../../users.json');
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Impossibile leggere il file utenti.' });
        }
        try {
            const users = JSON.parse(data);
            const user = users.find(u => u.name === req.params.name);
            if (!user) {
                return res.status(404).json({ error: 'Utente non trovato.' });
            }
            res.status(200).json(user);
        } catch (parseErr) {
            res.status(500).json({ error: 'Errore nel parsing del file utenti.' });
        }
    });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name
 *         age:
 *           type: integer
 *           description: The user's age
 */

 /**
  * @swagger
  * /users:
  *   post:
  *     tags:
  *       - Users
  *     security:
  *       - bearerAuth: []
  *     summary: Create a new user
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schemas/User'
  *     responses:
  *       201:
  *         description: User created
  *       400:
  *         description: Bad Request
  *       409:
  *         description: Conflict - User already exists
  */
router.post('/users', authMiddleware, (req, res) => {
    const user = req.body;
    if (!user.hasOwnProperty("name") || !user.hasOwnProperty("age")) {
        return res.status(400).json({ error: 'Bad Request: name and age are required.' });
    }
    const usersPath = path.join(__dirname, '../../users.json');
    fs.readFile(usersPath, 'utf8', (err, data) => {
        let users = [];
        if (!err) {
            try {
                users = JSON.parse(data);
            } catch (parseErr) {
                return res.status(500).json({ error: 'Errore nel parsing del file utenti.' });
            }
        }
        // Check for duplicate names
        if (users.some(u => u.name === user.name)) {
            return res.status(409).json({ error: 'Conflict: User with this name already exists.' });
        }
        users.push(user);
        fs.writeFile(usersPath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Impossibile salvare il nuovo utente.' });
            }
            // add location header
            res.setHeader('Location', `/api/users/${user.name}`);
            res.status(201).json(user);
        });
    });
});

/**
 * @swagger
 * /users/{name}:
 *   delete:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Elimina un utente per nome
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome dell'utente da eliminare
 *     responses:
 *       200:
 *         description: Utente eliminato
 *       404:
 *         description: Utente non trovato
 */
router.delete('/users/:name', authMiddleware, (req, res) => {
    const usersPath = path.join(__dirname, '../../users.json');
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Impossibile leggere il file utenti.' });
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ error: 'Errore nel parsing del file utenti.' });
        }
        const filteredUsers = users.filter(u => u.name !== req.params.name);
        if (filteredUsers.length === users.length) {
            return res.status(404).json({ error: 'Utente non trovato.' });
        }
        fs.writeFile(usersPath, JSON.stringify(filteredUsers, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Impossibile eliminare l\'utente.' });
            res.status(200).json({ message: 'Utenti eliminati : ' + (users.length - filteredUsers.length)});
        });
    });
});

/**
 * @swagger
 * /users/{name}:
 *   put:
 *     tags:
 *       - Users
 *     security:
  *       - bearerAuth: []
 *     summary: Aggiorna i dati di un utente per nome
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome dell'utente da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Utente aggiornato
 *       404:
 *         description: Utente non trovato
 */
router.put('/users/:name', authMiddleware, (req, res) => {
    const usersPath = path.join(__dirname, '../../users.json');
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Impossibile leggere il file utenti.' });
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ error: 'Errore nel parsing del file utenti.' });
        }
        const idx = users.findIndex(u => u.name === req.params.name);
        if (idx === -1) {
            return res.status(404).json({ error: 'Utente non trovato.' });
        }
        if (!users[idx].hasOwnProperty("name") || !users[idx].hasOwnProperty("age")) {
            return res.status(400).json({ error: 'Bad Request: name and age are required.' });
        }
        users[idx] = req.body;
        fs.writeFile(usersPath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Impossibile aggiornare l\'utente.' });
            res.status(200).json(users[idx]);
        });
    });
});

module.exports = router;
