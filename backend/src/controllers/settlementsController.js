const pool = require('../config/db');

// RECORD SETTLEMENT
const createSettlement = async (req, res) => {
  const { group_id, paid_to, amount, note } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const settlement = await client.query(
      `INSERT INTO settlements (group_id, paid_by, paid_to, amount, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [group_id, req.user.id, paid_to, amount, note]
    );

    // Mark expense splits as settled between these two users
    await client.query(
      `UPDATE expense_splits es
       SET is_settled = true
       FROM expenses e
       WHERE es.expense_id = e.id
       AND e.group_id = $1
       AND e.paid_by = $2
       AND es.user_id = $3
       AND es.is_settled = false`,
      [group_id, paid_to, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(settlement.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET GROUP SETTLEMENTS
const getGroupSettlements = async (req, res) => {
  const { group_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT s.*, 
        u1.name as paid_by_name, u1.avatar_url as paid_by_avatar,
        u2.name as paid_to_name, u2.avatar_url as paid_to_avatar
       FROM settlements s
       JOIN users u1 ON s.paid_by = u1.id
       JOIN users u2 ON s.paid_to = u2.id
       WHERE s.group_id = $1
       ORDER BY s.created_at DESC`,
      [group_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createSettlement, getGroupSettlements };