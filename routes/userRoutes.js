const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// eslint-disable-next-line no-unused-vars
const { protect, restrict } = authController;
// router.use(protect);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.patch('/updatePassword', protect, authController.updatePassword);

router.patch('/updateInfo', protect, userController.updateMe);
router.patch('/removeProfile', protect, userController.removeProfilePhoto);

router.get('/me', protect, userController.getMe);
router.delete('/deleteMe', protect, userController.deleteMe);

router.patch('/promote', protect, authController.getPromoted);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router
    .route('/')
    .get(protect, restrict('admin', 'lead-guide'), userController.getAllUsers)
    .post(protect, restrict('admin'), userController.createNewUser);

router
    .route('/stats')
    .get(protect, restrict('admin', 'lead-guide'), userController.getStats);

router.route('/sub').patch(protect, userController.addSubscription);

router
    .route('/:id')
    .get(
        protect,
        // restrict('admin', 'lead-guide'), // TODO: Temporary solution!
        userController.getUser
    )
    .patch(
        protect,
        restrict('admin'),
        userController.updateUserF,
        userController.updateUserS
    )
    .delete(
        protect,
        restrict('admin'),
        userController.deleteUserF,
        userController.deleteUserS
    );

module.exports = router;
