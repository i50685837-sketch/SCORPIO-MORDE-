const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');

// In-memory Node database mockup (replace with MongoDB/PostgreSQL)
const usersDB = [];

exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const existingUser = usersDB.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ status: 'ERR_EXISTS', message: 'NODE_ALREADY_REGISTERED' });
        }

        // Salt and Hash password (256-entropy simulation via bcrypt)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: `NODE_${Date.now()}`,
            fullName,
            email,
            password: hashedPassword,
            credits: 0
        };

        usersDB.push(newUser);

        return res.status(201).json({
            status: 'SUCCESS',
            message: 'PROTOCOL_NODE_INITIALIZED',
            userId: newUser.id
        });
    } catch (err) {
        return res.status(500).json({ status: 'ERR_FATAL', message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = usersDB.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ status: 'ERR_AUTH', message: 'INVALID_CREDENTIALS' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'ERR_AUTH', message: 'HASH_VERIFICATION_FAILED' });
        }

        // Issue Session Token
        const token = jwt.encode({ id: user.id, email: user.email }, process.env.JWT_SECRET);

        return res.status(200).json({
            status: 'SUCCESS',
            message: 'ACCESS_GRANTED',
            token,
            user: { id: user.id, email: user.email, fullName: user.fullName }
        });
    } catch (err) {
        return res.status(500).json({ status: 'ERR_FATAL', message: err.message });
    }
};
