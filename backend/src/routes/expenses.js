const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createExpense, getGroupExpenses,
  getExpense, deleteExpense, getMyBalances
} = require('../controllers/expensesController');

router.post('/', auth, createExpense);
router.get('/my-balances', auth, getMyBalances);
router.get('/group/:group_id', auth, getGroupExpenses);
router.get('/:id', auth, getExpense);
router.delete('/:id', auth, deleteExpense);

module.exports = router;