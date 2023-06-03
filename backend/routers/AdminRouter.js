const express = require('express')
const adminController = require('../controllers/AdminController');

const router = express.Router()

router.post('/login', adminController.login);
router.post('/admin/api/getToken', adminController.getToken)

router.get('/dashboard', adminController.dashboard)
router.get('/transactions/:id', adminController.transactionDetails)
router.get('/transactions', adminController.transactions)
router.get('/', adminController.index);

module.exports = router