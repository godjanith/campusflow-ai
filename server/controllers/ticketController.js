const Ticket = require('../models/Ticket');

// Simple NLP Rules for Auto-Categorization & Severity
const classifyTicket = (text) => {
  const content = text.toLowerCase();

  let category = 'General Infrastructure';
  let severity = 'LOW';

  if (content.includes('spark') || content.includes('fire') || content.includes('wire') || content.includes('shock') || content.includes('electricity')) {
    category = 'Electrical Safety';
    severity = 'CRITICAL';
  } else if (content.includes('leak') || content.includes('water') || content.includes('pipe') || content.includes('flood')) {
    category = 'Plumbing & Sanitation';
    severity = 'HIGH';
  } else if (content.includes('wifi') || content.includes('internet') || content.includes('router') || content.includes('projector') || content.includes('pc')) {
    category = 'IT Infrastructure';
    severity = 'MEDIUM';
  } else if (content.includes('bench') || content.includes('chair') || content.includes('door') || content.includes('window')) {
    category = 'Carpentry & Furniture';
    severity = 'LOW';
  }

  return { category, severity };
};

// @desc Create New Incident Ticket
// @route POST /api/tickets
exports.createTicket = async (req, res) => {
  try {
    const { title, description, location, imageUrl } = req.body;

    // AI Classification
    const fullText = `${title} ${description}`;
    const { category, severity } = classifyTicket(fullText);

    const ticket = await Ticket.create({
      user: req.user._id,
      title,
      description,
      location,
      imageUrl,
      category,
      severity,
    });

    // Emit Socket.io Real-Time Event
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_created', ticket);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get All Tickets
// @route GET /api/tickets
exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update Ticket Status
// @route PUT /api/tickets/:id
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status || ticket.status;
    const updatedTicket = await ticket.save();

    // Emit Socket.io Real-Time Event
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_updated', updatedTicket);
    }

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc AI Campus Assistant Chatbot Endpoint
// @route POST /api/tickets/chat
exports.askAIChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const text = (message || '').toLowerCase();
    let reply = "I'm the CampusFlow AI Assistant. I can help you with campus FAQs, issue tracking, and emergency contacts.";

    if (text.includes('status') || text.includes('ticket') || text.includes('my report')) {
      reply = "You can view the real-time status of all your reported issues directly on the Admin & Student operations dashboard. Admins update ticket statuses live!";
    } else if (text.includes('emergency') || text.includes('fire') || text.includes('medical') || text.includes('help')) {
      reply = "⚠️ For immediate emergencies, please contact Campus Security at +91-80-2309-1200 or visit the Health Center in Block 1.";
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('network')) {
      reply = "Wi-Fi issues are automatically routed to the IT Infrastructure team with LOW/MEDIUM severity. Please provide your Block & Lab number when reporting.";
    } else if (text.includes('location') || text.includes('gps')) {
      reply = "CampusFlow AI automatically attaches your live GPS coordinates when you tap 'Fetch live GPS location' before submitting a report.";
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};