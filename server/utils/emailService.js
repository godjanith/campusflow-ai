const nodemailer = require('nodemailer');

const sendAlertEmail = async (ticket) => {
  try {
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      from: '"CampusFlow AI System" <no-reply@campusflow.ai>',
      to: 'JANITH.20252MCA0318@presidencyuniversity.in',
      subject: `🚨 [CRITICAL ALERT] New ${ticket.severity} Incident: ${ticket.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 10px;">
          <h2 style="color: #f43f5e;">⚠️ High Priority Incident Alert</h2>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p><strong>Severity:</strong> <span style="color: #f43f5e; font-weight: bold;">${ticket.severity}</span></p>
          <p><strong>Description:</strong> ${ticket.description}</p>
          <p><strong>Location GPS:</strong> ${ticket.location?.latitude || 'N/A'}, ${ticket.location?.longitude || 'N/A'}</p>
          <hr style="border-color: #334155; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Sent automatically by CampusFlow AI System. Contact: +91 8971958186</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Critical Email Alert Sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Email alert background warning:', error.message);
  }
};

module.exports = sendAlertEmail;