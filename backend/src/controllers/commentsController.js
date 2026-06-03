const pool = require('../config/db');

// ADD COMMENT
const addComment = async (req, res) => {
  const { expense_id, message } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO expense_comments (expense_id, user_id, message)
       VALUES ($1,$2,$3) RETURNING *`,
      [expense_id, req.user.id, message]
    );

    const comment = await pool.query(
      `SELECT ec.*, u.name, u.avatar_url
       FROM expense_comments ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(comment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET COMMENTS FOR EXPENSE
const getComments = async (req, res) => {
  const { expense_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT ec.*, u.name, u.avatar_url
       FROM expense_comments ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.expense_id = $1
       ORDER BY ec.created_at ASC`,
      [expense_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addComment, getComments };