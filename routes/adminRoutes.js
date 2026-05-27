const express = require('express');
const router = express.Router();
const {
  getMesses,
  getUsers,
  updateStatus,
  addMessOwner,
  getTickets,
  updateTicketStatus,
  getSubscriptions,
  deleteUser
} = require('../controllers/adminController');

router.get('/messes', getMesses);
router.get('/users', getUsers);
router.post('/update-status', updateStatus);
router.post('/add-mess-owner', addMessOwner);
router.get('/tickets', getTickets);
router.post('/update-ticket-status', updateTicketStatus);
router.get('/subscriptions', getSubscriptions);
router.delete('/users/:id', deleteUser);

module.exports = router;
