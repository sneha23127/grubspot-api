const db = require('../config/db');

// POST /api/tickets — create a new support ticket
const createTicket = async (req, res) => {
  const { user_id, user_name, mess_name, category, subject, description, priority } = req.body;

  if (!subject) {
    return res.status(400).json({ status: 'error', message: 'Subject is required.' });
  }

  try {
    const ticketId = 'TKT-' + Date.now().toString().slice(-6);

    const result = await db.query(
      `INSERT INTO tickets (ticket_id, user_name, mess_name, category, subject, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open')
       RETURNING ticket_id, user_name, subject, status, created_at`,
      [
        ticketId,
        user_name || null,
        mess_name || null,
        category || 'General',
        subject,
        description || null,
        priority || 'Medium'
      ]
    );

    return res.status(201).json({ status: 'success', ticket: result.rows[0] });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// GET /api/owner/tickets?mess_name=... — fetch tickets for a specific mess
const getOwnerTickets = async (req, res) => {
  const { mess_name } = req.query;

  if (!mess_name) {
    return res.status(400).json({ status: 'error', message: 'mess_name query param is required.' });
  }

  try {
    const result = await db.query(
      `SELECT ticket_id, user_name, mess_name, category, subject, description, status, priority, created_at
       FROM tickets
       WHERE LOWER(mess_name) = LOWER($1)
       ORDER BY created_at DESC`,
      [mess_name]
    );

    return res.status(200).json({ status: 'success', tickets: result.rows });
  } catch (err) {
    console.error('Get owner tickets error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

module.exports = { createTicket, getOwnerTickets };
