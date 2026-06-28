const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Jo model humne banaya tha

// ==========================================
// 1. SIGNUP ROUTE: http://localhost:5000/api/auth/signup
// ==========================================
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Safety Check: Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Bhai, email ka format sahi nahi hai!' });
        }

        // Safety Check: Check karo user pehle se register toh nahi hai
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'Ye email pehle se register hai bhai!' });
        }

        // Password Secure Karna: Bcrypt use karke password ko khufiya banana
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Naya User Database ke liye tayar karna
        user = new User({
            name,
            email,
            password: hashedPassword
        });

        // Database mein save karna
        await user.save();
        res.status(201).json({ msg: 'Mubarak ho! User register ho gaya ekdum safely.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server mein kuch gadbad hui!');
    }
});

// ==========================================
// 2. LOGIN ROUTE: http://localhost:5000/api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check karo ki user exists karta hai ya nahi
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Bhai, ye email registered nahi hai!' });
        }

        // 2. Password match karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Galat password hai bhai, dubaara check karo!' });
        }

        // 3. Token banana (Security Pass)
        const payload = {
            user: { id: user._id }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Yeh token 1 ghante tak valid rahega
            (err, token) => {
                if (err) throw err;
                // Frontend ko message aur token dono bhej rahe hain
                res.json({
                    msg: 'Wah bhai! Aap kamiyabi se login ho gaye ho.',
                    token: token,
                    user: { id: user._id, name: user.name, email: user.email }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server mein login ke waqt gadbad hui!');
    }
});

// ==========================================
// 3. TEST ROUTE: Database dekhne ke liye (http://localhost:5000/api/auth/users)
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send('Kuch gadbad hui');
    }
});

module.exports = router;