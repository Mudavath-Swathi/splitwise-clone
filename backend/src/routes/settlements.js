const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createSettlement, getGroupSettlements } = require('../controllers/settlementsController');

router.post('/', auth, createSettlement);
router.get('/group/:group_id', auth, getGroupSettlements);

module.exports = router;