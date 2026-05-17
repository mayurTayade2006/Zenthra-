Zenthra – Employee Goal Management System
🚀 Overview

Zenthra is a full-stack Employee Goal Management System built for hackathons and enterprise productivity workflows. It enables employees to create and submit goals while allowing managers to review, approve, and monitor employee performance.

The platform supports:

Role-based authentication
Employee & Manager dashboards
Goal submission workflow
Goal approval system
Analytics dashboard
Real-time status tracking
✨ Features
👨‍💼 Employee Features
Secure Login & Authentication
Create Goals
Goal Weightage Validation
Submit Goals to Manager
View Goal Status
Dashboard Analytics
👨‍💻 Manager Features
View Submitted Goals
Approve / Reject Goals
Monitor Employee Performance
Goal Tracking Dashboard
📊 Additional Features
MongoDB Database Integration
Responsive UI
Toast Notifications
Protected Routes
REST API Architecture
🛠️ Tech Stack
Frontend
React.js
Tailwind CSS
Vite
React Router
React Toastify
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Deployment
Frontend: Vercel
Backend: Render
Database: MongoDB Atlas
📂 Project Structure
frontend/
 ├── src/
 │   ├── components/
 │   ├── pages/
 │   ├── context/
 │   ├── services/
 │   └── App.jsx

backend/
 ├── models/
 ├── routes/
 ├── middleware/
 ├── config/
 └── server.js
⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/yourusername/zenthra.git
cd zenthra
2️⃣ Backend Setup
cd backend
npm install

Create .env file:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000

Run backend:

node server.js
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
🌐 API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
Goals
GET /api/goals
POST /api/goals
POST /api/goals/submit
Manager
GET /api/manager/submitted-goals
🔐 Roles
Role	Access
Employee	Create & Submit Goals
Manager	Review & Approve Goals
Admin	System Management
📈 Goal Workflow
Employee Creates Goals
        ↓
Submit Goals
        ↓
Status → Pending Approval
        ↓
Manager Reviews Goals
        ↓
Approved / Rejected
🚀 Deployment Links
Frontend

Add your Vercel URL here

https://yourproject.vercel.app
Backend

Add your Render URL here

https://yourbackend.onrender.com
👨‍💻 Team

Developed for Hackathon Project Submission.

📜 License

This project is developed for educational and hackathon purposes.
