const Ticket = require('../models/Ticket');

// Simple NLP Rule Engine for AI Auto-Categorization & Severity
const categorizeAndScore = (text) => {
  const lower = text.toLowerCase();
  let category = 'General Maintenance';
  let severity = 'MEDIUM';

  if (lower.includes('spark') || lower.includes('wire') || lower.includes('fire') || lower.includes('shock')) {
    category = 'Electrical Safety';
    severity = 'CRITICAL';
  } else if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe') || lower.includes('flood')) {
    category = 'Plumbing & Facilities';
    severity = 'HIGH';
  } else if (lower.includes('wifi') || lower.includes('internet') || lower.includes('projector') || lower.includes('pc')) {
    category = 'IT & Infrastructure';
    severity = 'LOW';
  }

  return { category, severity };
};

// @desc Create Ticket (Mobile & Web)
// @route POST /api/tickets
exports.createTicket = async (req, res) => {
  try {
    const { title, description, location, imageUrl } = req.body;
    const { category, severity } = categorizeAndScore(`${title} ${description}`);

    const ticket = await Ticket.create({
      title,
      description,
      category,
      severity,
      location,
      imageUrl,
      reportedBy: req.user._id,
    });

    // Emit real-time Socket.io event to Web Dashboard
    const io = req.app.get('socketio');
    if (io) io.emit('ticket_created', ticket);

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get All Tickets
// @route GET /api/tickets
exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate('reportedBy', 'name email').sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update Ticket Status (Admin)
// @route PUT /api/tickets/:id
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();

    const io = req.app.get('socketio');
    if (io) io.emit('ticket_updated', ticket);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc AI Campus Assistant Chatbot Endpoint
// @route POST /api/tickets/chat
exports.askAIChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const text = message.toLowerCase();
    let reply = "I'm the CampusFlow AI Assistant. I can help you with campus FAQs, issue tracking, and emergency contacts.";

    if (text.includes('status') || text.includes('ticket') || text.includes('my report')) {
      reply = "You can view the real-time status of all your reported issues directly on the 'My Tickets' dashboard. Admins update ticket statuses live!";
    } else if (text.includes('emergency') || text.includes('fire') || text.includes('medical') || text.includes('help')) {
      reply = "⚠️ For immediate emergencies, please contact Campus Security at +91-80-2309-1200 or visit the Health Center in Block 1.";
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('network')) {
      reply = "Wi-Fi issues are automatically routed to the IT Infrastructure team with LOW severity. Please provide your Block & Lab number when reporting.";
    } else if (text.includes('location') || text.includes('gps')) {
      reply = "CampusFlow AI automatically attaches your live GPS coordinates when you tap 'Fetch live GPS location' before submitting a report.";
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};