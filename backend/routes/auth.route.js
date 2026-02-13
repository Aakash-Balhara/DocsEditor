const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');

const authController = require('../controllers/auth.controller');

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.put('/update', authMiddleware, authController.update);
router.delete('/delete', authMiddleware, authController.deleteAccount);
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;