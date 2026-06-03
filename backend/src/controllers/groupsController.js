const pool = require('../config/db');

// CREATE GROUP
const createGroup = async (req, res) => {
  const { name, description } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const group = await client.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name, description, req.user.id]
    );
    const groupId = group.rows[0].id;
    await client.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1,$2,$3)',
      [groupId, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json(group.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET MY GROUPS
const getMyGroups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, 
        COUNT(DISTINCT gm.user_id) as member_count,
        COALESCE(SUM(CASE WHEN es.user_id = $1 AND es.is_settled = false THEN -es.amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN e.paid_by = $1 AND es.user_id != $1 AND es.is_settled = false THEN es.amount ELSE 0 END), 0) as my_balance
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       LEFT JOIN expenses e ON e.group_id = g.id
       LEFT JOIN expense_splits es ON es.expense_id = e.id
       WHERE g.id IN (SELECT group_id FROM group_members WHERE user_id = $1)
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE GROUP
const getGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const group = await pool.query('SELECT * FROM groups WHERE id=$1', [id]);
    if (group.rows.length === 0)
      return res.status(404).json({ error: 'Group not found' });

    const members = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, gm.role
       FROM users u JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [id]
    );
    res.json({ ...group.rows[0], members: members.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD MEMBER
const addMember = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );
    res.json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REMOVE MEMBER
const removeMember = async (req, res) => {
  const { id, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id=$1 AND user_id=$2',
      [id, userId]
    );
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET GROUP BALANCES
const getGroupBalances = async (req, res) => {
  const { id } = req.params;
  try {
    const members = await pool.query(
      `SELECT u.id, u.name FROM users u
       JOIN group_members gm ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [id]
    );

    const balances = {};
    members.rows.forEach(m => balances[m.id] = { id: m.id, name: m.name, balance: 0 });

    const splits = await pool.query(
      `SELECT e.paid_by, es.user_id, es.amount, es.is_settled
       FROM expenses e
       JOIN expense_splits es ON e.id = es.expense_id
       WHERE e.group_id = $1`,
      [id]
    );

    splits.rows.forEach(({ paid_by, user_id, amount, is_settled }) => {
      if (!is_settled && paid_by !== user_id) {
        if (balances[paid_by]) balances[paid_by].balance += parseFloat(amount);
        if (balances[user_id]) balances[user_id].balance -= parseFloat(amount);
      }
    });

    const settlements = await pool.query(
      'SELECT paid_by, paid_to, amount FROM settlements WHERE group_id=$1',
      [id]
    );

    settlements.rows.forEach(({ paid_by, paid_to, amount }) => {
      if (balances[paid_by]) balances[paid_by].balance += parseFloat(amount);
      if (balances[paid_to]) balances[paid_to].balance -= parseFloat(amount);
    });

    res.json(Object.values(balances));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createGroup, getMyGroups, getGroup, addMember, removeMember, getGroupBalances };