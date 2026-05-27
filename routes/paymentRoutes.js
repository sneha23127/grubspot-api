const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/', paymentController.getAllPayments);
router.get('/owner', paymentController.getMessPayments);

module.exports = router;
