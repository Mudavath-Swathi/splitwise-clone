const express = require('express');
const router = express.Router();
const { register, login, getProfile, searchUsers } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.get('/search', auth, searchUsers);

module.exports = router;