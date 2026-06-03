const pool = require('../config/db');

// CREATE EXPENSE
const createExpense = async (req, res) => {
  const { group_id, description, amount, paid_by, split_type, splits } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const expense = await client.query(
      `INSERT INTO expenses (group_id, description, amount, paid_by, split_type, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [group_id, description, amount, paid_by, split_type, req.user.id]
    );
    const expenseId = expense.rows[0].id;

    // FIX: parse paid_by as number for correct comparison
    const paidById = parseInt(paid_by);
    const totalAmount = parseFloat(amount);

    let splitData = [];

    if (split_type === 'equal') {
      // FIX: round to 2 decimal places
      const share = Math.round((totalAmount / splits.length) * 100) / 100;
      // FIX: handle rounding remainder - give it to payer
      const remainder = Math.round((totalAmount - share * splits.length) * 100) / 100;
      splitData = splits.map((userId, index) => ({
        user_id: parseInt(userId),
        // give remainder to first person (usually payer)
        amount: index === 0 ? share + remainder : share,
        percentage: Math.round((100 / splits.length) * 100) / 100,
        shares: 1
      }));
    } else if (split_type === 'unequal') {
      splitData = splits.map(s => ({
        user_id: parseInt(s.user_id),
        amount: Math.round(parseFloat(s.amount) * 100) / 100,
        percentage: Math.round((parseFloat(s.amount) / totalAmount) * 10000) / 100,
        shares: null
      }));
      // Fix any rounding difference — adjust last person's amount
      const unequalTotal = splitData.reduce((sum, s) => sum + s.amount, 0);
      const unequalDiff = Math.round((totalAmount - unequalTotal) * 100) / 100;
      if (unequalDiff !== 0) {
        splitData[splitData.length - 1].amount = Math.round((splitData[splitData.length - 1].amount + unequalDiff) * 100) / 100;
      }
    } else if (split_type === 'percentage') {
      splitData = splits.map(s => ({
        user_id: parseInt(s.user_id),
        amount: Math.round((parseFloat(s.percentage) / 100) * totalAmount * 100) / 100,
        percentage: parseFloat(s.percentage),
        shares: null
      }));
    } else if (split_type === 'shares') {
      const totalShares = splits.reduce((sum, s) => sum + parseFloat(s.shares), 0);
      splitData = splits.map(s => ({
        user_id: parseInt(s.user_id),
        amount: Math.round((parseFloat(s.shares) / totalShares) * totalAmount * 100) / 100,
        percentage: Math.round((parseFloat(s.shares) / totalShares) * 10000) / 100,
        shares: parseFloat(s.shares)
      }));
    }

    // Insert splits
    for (const split of splitData) {
      await client.query(
        `INSERT INTO expense_splits (expense_id, user_id, amount, percentage, shares, is_settled)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          expenseId,
          split.user_id,
          split.amount,
          split.percentage,
          split.shares,
          // FIX: both are now numbers so comparison works correctly
          split.user_id === paidById
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(expense.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET GROUP EXPENSES
const getGroupExpenses = async (req, res) => {
  const { group_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as paid_by_name, u.avatar_url as paid_by_avatar
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [group_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE EXPENSE WITH SPLITS
const getExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await pool.query(
      `SELECT e.*, u.name as paid_by_name
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       WHERE e.id = $1`,
      [id]
    );
    if (expense.rows.length === 0)
      return res.status(404).json({ error: 'Expense not found' });

    const splits = await pool.query(
      `SELECT es.*, u.name, u.avatar_url
       FROM expense_splits es
       JOIN users u ON es.user_id = u.id
       WHERE es.expense_id = $1`,
      [id]
    );

    const comments = await pool.query(
      `SELECT ec.*, u.name, u.avatar_url
       FROM expense_comments ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.expense_id = $1
       ORDER BY ec.created_at ASC`,
      [id]
    );

    res.json({
      ...expense.rows[0],
      splits: splits.rows,
      comments: comments.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE EXPENSE
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1 AND created_by=$2', [id, req.user.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET MY OVERALL BALANCE SUMMARY
const getMyBalances = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN e.paid_by = $1 AND es.user_id != $1 AND es.is_settled = false THEN es.amount ELSE 0 END), 0) as total_owed_to_me,
        COALESCE(SUM(CASE WHEN es.user_id = $1 AND e.paid_by != $1 AND es.is_settled = false THEN es.amount ELSE 0 END), 0) as total_i_owe
       FROM expenses e
       JOIN expense_splits es ON e.id = es.expense_id
       JOIN group_members gm ON e.group_id = gm.group_id AND gm.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createExpense, getGroupExpenses, getExpense, deleteExpense, getMyBalances };