const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'General' }, // Auto-categorized by AI
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    status: { type: String, enum: ['OPEN', 'IN-PROGRESS', 'RESOLVED'], default: 'OPEN' },
    location: {
      building: { type: String, default: 'Main Campus' },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    imageUrl: { type: String, default: '' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: String, default: 'Unassigned' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);