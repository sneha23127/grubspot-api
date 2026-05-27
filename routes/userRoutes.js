const express = require('express');
const router = express.Router();
const { updateProfile, updateMenu } = require('../controllers/userController');

router.post('/update-profile', updateProfile);
router.post('/update-menu', updateMenu);

module.exports = router;
