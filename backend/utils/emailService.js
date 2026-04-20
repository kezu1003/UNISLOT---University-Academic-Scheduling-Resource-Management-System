const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready');
  }
});

/**
 * Send timetable email to students
 */
exports.sendTimetableEmail = async (batchCode, timetableEntries, pdfBuffer, customMessage = '') => {
  try {
    // Group entries by day
    const schedule = timetableEntries.reduce((acc, entry) => {
      if (!acc[entry.day]) {
        acc[entry.day] = [];
      }
      acc[entry.day].push(entry);
      return acc;
    }, {});

    // Create HTML email body
    let scheduleHTML = '';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let day of days) {
      if (schedule[day] && schedule[day].length > 0) {
        scheduleHTML += `
          <h3 style="color: #1976D2; margin-top: 20px;">${day}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #E3F2FD;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Time</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Course</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Type</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Instructor</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Hall</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Mode</th>
              </tr>
            </thead>
            <tbody>
        `;

        schedule[day].forEach(entry => {
          const modeColor = entry.mode === 'online' ? '#4CAF50' : '#2196F3';
          scheduleHTML += `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${entry.startTime} - ${entry.endTime}</td>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>${entry.course.courseCode}</strong><br/>${entry.course.courseName}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${entry.type}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${entry.instructor.name}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${entry.hall.hallCode}${entry.hall.location ? ` (${entry.hall.location})` : ''}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">
                <span style="background-color: ${modeColor}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; text-transform: uppercase;">
                  ${entry.mode}
                </span>
              </td>
            </tr>
          `;
        });

        scheduleHTML += `
            </tbody>
          </table>
        `;
      }
    }

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎓 UniSlot</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">SLIIT Timetable Management System</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1976D2; margin-top: 0;">Timetable Update - ${batchCode}</h2>
          
          ${customMessage ? `
            <div style="background-color: #E3F2FD; padding: 15px; border-left: 4px solid #2196F3; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Message from Coordinator:</strong></p>
              <p style="margin: 10px 0 0 0;">${customMessage}</p>
            </div>
          ` : ''}
          
          <p>Dear Students,</p>
          <p>Your timetable has been published. Please find the details below and in the attached PDF.</p>
          
          ${scheduleHTML}
          
          <div style="background-color: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin-top: 30px;">
            <p style="margin: 0;"><strong>⚠️ Important Notes:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Please check the mode (Physical/Online) for each session</li>
              <li>For online sessions, links will be shared separately</li>
              <li>Report to the correct hall 10 minutes before physical sessions</li>
              <li>Contact your batch representative for any queries</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
            <p>This is an automated email from UniSlot Timetable Management System</p>
            <p>Sri Lanka Institute of Information Technology (SLIIT)</p>
            <p style="margin-top: 10px;">
              <a href="#" style="color: #2196F3; text-decoration: none;">View Online</a> | 
              <a href="#" style="color: #2196F3; text-decoration: none;">Download App</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // In production, fetch actual student emails from database
    // For now, using a placeholder
    const recipients = process.env.EMAIL_RECIPIENTS || 'students@example.com';

    const mailOptions = {
      from: `"UniSlot - SLIIT" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `📅 Timetable Published - ${batchCode}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Timetable_${batchCode}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      recipients: recipients
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send rescheduling notification
 */
exports.sendRescheduleNotification = async (batchCode, oldSchedule, newSchedule) => {
  try {
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FF9800; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">⚠️ Schedule Change</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #FF9800;">Class Rescheduled - ${batchCode}</h2>
          
          <p>Dear Students,</p>
          <p>A class has been rescheduled. Please note the changes:</p>
          
          <div style="background-color: #FFEBEE; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #F44336; margin-top: 0;">Previous Schedule:</h3>
            <p><strong>Course:</strong> ${oldSchedule.course}</p>
            <p><strong>Day:</strong> ${oldSchedule.day}</p>
            <p><strong>Time:</strong> ${oldSchedule.time}</p>
            <p><strong>Hall:</strong> ${oldSchedule.hall}</p>
          </div>
          
          <div style="background-color: #E8F5E9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">New Schedule:</h3>
            <p><strong>Course:</strong> ${newSchedule.course}</p>
            <p><strong>Day:</strong> ${newSchedule.day}</p>
            <p><strong>Time:</strong> ${newSchedule.time}</p>
            <p><strong>Hall:</strong> ${newSchedule.hall}</p>
          </div>
          
          <p style="margin-top: 20px;">Please update your calendar accordingly.</p>
        </div>
      </body>
      </html>
    `;

    const recipients = process.env.EMAIL_RECIPIENTS || 'students@example.com';

    await transporter.sendMail({
      from: `"UniSlot - SLIIT" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `⚠️ Schedule Change - ${batchCode}`,
      html: emailHTML
    });

    return { success: true };
  } catch (error) {
    console.error('Reschedule email error:', error);
    throw error;
  }
};