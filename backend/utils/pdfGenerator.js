const PDFDocument = require('pdfkit');

/**
 * Generate timetable PDF
 */
exports.generateTimetablePDF = async (batch, timetableEntries) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(24)
         .fillColor('#1976D2')
         .text('UniSlot', 50, 50)
         .fontSize(12)
         .fillColor('#666')
         .text('SLIIT Timetable Management System', 50, 80);

      // Batch Info
      doc.fontSize(18)
         .fillColor('#000')
         .text(`Timetable - ${batch.batchCode}`, 50, 110);

      doc.fontSize(10)
         .fillColor('#666')
         .text(`Year ${batch.year} | Semester ${batch.semester} | ${batch.type} Batch`, 50, 135)
         .text(`Specialization: ${batch.specialization} | Students: ${batch.studentCount}`, 50, 150)
         .text(`Generated: ${new Date().toLocaleDateString('en-US', { 
           year: 'numeric', month: 'long', day: 'numeric' 
         })}`, 50, 165);

      // Group by day
      const schedule = timetableEntries.reduce((acc, entry) => {
        if (!acc[entry.day]) {
          acc[entry.day] = [];
        }
        acc[entry.day].push(entry);
        return acc;
      }, {});

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let yPos = 200;

      for (let day of days) {
        if (!schedule[day] || schedule[day].length === 0) continue;

        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        // Day header
        doc.fontSize(14)
           .fillColor('#1976D2')
           .text(day, 50, yPos);

        yPos += 25;

        // Table headers
        const colWidths = {
          time: 100,
          course: 150,
          type: 60,
          instructor: 120,
          hall: 80,
          mode: 60
        };

        doc.fontSize(9)
           .fillColor('#fff');

        // Header background
        doc.rect(50, yPos, 495, 20)
           .fill('#2196F3');

        // Header text
        doc.fillColor('#fff')
           .text('Time', 55, yPos + 5, { width: colWidths.time })
           .text('Course', 155, yPos + 5, { width: colWidths.course })
           .text('Type', 305, yPos + 5, { width: colWidths.type })
           .text('Instructor', 365, yPos + 5, { width: colWidths.instructor })
           .text('Hall', 485, yPos + 5, { width: colWidths.hall });

        yPos += 25;

        // Entries
        schedule[day].forEach((entry, index) => {
          const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
          
          doc.rect(50, yPos, 495, 35)
             .fill(bgColor);

          doc.fillColor('#000')
             .fontSize(8)
             .text(`${entry.startTime} - ${entry.endTime}`, 55, yPos + 5, { width: colWidths.time })
             .text(`${entry.course.courseCode}`, 155, yPos + 5, { width: colWidths.course })
             .fontSize(7)
             .fillColor('#666')
             .text(entry.course.courseName, 155, yPos + 15, { width: colWidths.course })
             .fontSize(8)
             .fillColor('#000')
             .text(entry.type.toUpperCase(), 305, yPos + 10, { width: colWidths.type })
             .text(entry.instructor.name, 365, yPos + 10, { width: colWidths.instructor })
             .text(entry.hall.hallCode, 485, yPos + 5, { width: colWidths.hall })
             .fontSize(7)
             .text(entry.hall.location || '', 485, yPos + 15, { width: colWidths.hall });

          // Mode badge
          const modeColor = entry.mode === 'online' ? '#4CAF50' : '#2196F3';
          doc.rect(305, yPos + 20, 50, 12)
             .fill(modeColor);
          doc.fillColor('#fff')
             .fontSize(7)
             .text(entry.mode.toUpperCase(), 310, yPos + 23, { width: 40 });

          yPos += 40;

          // Check for page break
          if (yPos > 750) {
            doc.addPage();
            yPos = 50;
          }
        });

        yPos += 15;
      }

      // Footer on last page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#999')
           .text(
             `Page ${i + 1} of ${pageCount} | © ${new Date().getFullYear()} UniSlot - SLIIT`,
             50,
             doc.page.height - 50,
             { align: 'center', width: doc.page.width - 100 }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};