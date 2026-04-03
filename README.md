# 🎓 UniSlot - SLIIT Timetable Management System

A comprehensive timetable management system for SLIIT Computing Faculty.

## Features

### Admin Panel
- ✅ Upload staff from TXT file
- ✅ Set priority (High → Low)
- ✅ Add batch groups (Y1.S1.WD.IT.03.02 format)
- ✅ Add courses with hours allocation
- ✅ Manage lecture halls

### LIC Panel
- ✅ View assigned courses
- ✅ Select instructors (priority-based)
- ✅ Check staff workload
- ✅ Submit to coordinator

### Coordinator Panel
- ✅ Review LIC assignments
- ✅ Schedule classes with conflict detection
- ✅ Set timetable with drag-drop grid
- ✅ Check all staff workload
- ✅ Publish timetable with email notifications
- ✅ Export to PDF

### Smart Features
- 🏫 Hall allocation with batch size check
- 📍 Lecturer's nearest location matching
- ⚠️ Lecture and tutorial same day/time prevention
- 📊 Workload visualization
- 📧 Email notifications to students
- 📄 PDF timetable export

## Tech Stack

- **Frontend:** React 18, React Router, Recharts, jsPDF
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Styling:** Custom CSS with CSS Variables
- **Email:** Nodemailer
- **PDF:** PDFKit (backend), jsPDF (frontend)

## Installation

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed  # Seed database
npm run dev   # Start development server