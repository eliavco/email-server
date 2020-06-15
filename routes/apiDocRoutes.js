const express = require('express');
const tourController = require('../controllers/emailAdminController');

const router = express.Router();

router.route('/').get(tourController.getDoc);

module.exports = router;
