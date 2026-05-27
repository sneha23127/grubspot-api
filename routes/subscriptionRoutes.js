const express = require('express');
const router = express.Router();
const { createSubscription, getUserSubscriptions, getMessSubscribers, updateSubscriptionStatus, deleteSubscription } = require('../controllers/subscriptionController');

router.post('/', createSubscription);
router.get('/user/:userId', getUserSubscriptions);
router.get('/mess/:messName', getMessSubscribers);
router.put('/:id/status', updateSubscriptionStatus);
router.delete('/:id', deleteSubscription);

module.exports = router;
