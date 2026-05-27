const express = require('express');
const router = express.Router();
const { createTicket, getOwnerTickets } = require('../controllers/ticketController');

router.post('/tickets', createTicket);
router.get('/owner/tickets', getOwnerTickets);

module.exports = router;
