const express = require('express');
const emailAdminController = require('../controllers/emailAdminController');
const authController = require('../controllers/authController');

const router = express.Router();

router.param('id', (req, res, next, val) => {
    // console.log(`This is the id: ${val}`);
    next();
});

// router.param('id', emailAdminController.checkId);
const { protect, restrict } = authController;
// If login is required, add protect as first middleware

// router.use('/:tourId', reviewRouter);

router
    .route('/')
    .get(
        protect,
        emailAdminController.getAllEmails,
        emailAdminController.getAllEmailsAdmin
    )
    .post(
        /*emailAdminController.checkBody,*/ protect,
        restrict('admin', 'lead-guide'),
        emailAdminController.createNewEmail
    );

router
    .route('/e/admin')
    .get(protect, restrict('admin'), emailAdminController.getAllEmailsAdmin);
router
    .route('/e')
    .get(
        protect,
        emailAdminController.getAllEmails,
        emailAdminController.getAllEmailsAdmin
    );

router.route('/stats').get(protect, emailAdminController.getStats);

// ID HAS TO BE THE LAST
router
    .route('/:id')
    .get(emailAdminController.getEmail)
    .patch(
        protect,
        restrict('admin', 'lead-guide'),
        emailAdminController.updateEmailF,
        emailAdminController.updateEmailS
    )
    .delete(
        protect,
        restrict('admin', 'lead-guide'),
        emailAdminController.deleteEmailF,
        emailAdminController.deleteEmailS
    );

module.exports = router;
