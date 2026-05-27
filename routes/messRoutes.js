const express = require('express');
const router = express.Router();
const { getMesses } = require('../controllers/messController');

router.get('/messes', getMesses);

module.exports = router;
