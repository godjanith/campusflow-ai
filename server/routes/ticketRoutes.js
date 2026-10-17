const express = require('express');
const { createTicket, getTickets, updateTicketStatus, askAIChatbot } = require('../controllers/ticketController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').post(protect, createTicket).get(protect, getTickets);
router.route('/chat').post(protect, askAIChatbot);
router.route('/:id').put(protect, adminOnly, updateTicketStatus);

module.exports = router;