# ⚡ EVrecharge

A full-stack EV charging platform designed to help users discover EV charging stations, make charging bookings, manage their profiles, and access charging-related services through a web application.

The project includes separate frontend and backend applications with features for users, station owners, and administrators.

---

## 🚀 Features

### 👤 User Features

- User registration and login
- User profile management
- Browse EV charging stations
- View charging station details
- Book charging slots
- Manage bookings
- Payment functionality
- Notifications
- Location and map-based features

### 🏢 Station Owner Features

- Owner authentication
- Manage charging stations
- Manage station information
- Manage bookings
- View station-related information

### 🛡️ Admin Features

- Admin authentication
- User management
- Station management
- Booking management
- Payment and finance-related functionality
- Analytics

---

## 🛠️ Technologies Used

### Frontend

- React.js
- JavaScript
- Vite
- React Router
- Axios
- Firebase
- Heroicons
- CSS

### Backend

- Node.js
- Express.js
- Axios
- Firebase Admin
- JWT Authentication
- bcrypt
- Multer
- Nodemailer
- Razorpay
- Stripe

### Security & Server

- Helmet
- CORS
- Express Rate Limit
- Express Validator
- Cookie Parser
- Compression

### External Services

- Firebase / Firestore
- Mappls
- OpenStreetMap Nominatim
- Razorpay
- Stripe

### Logging & Utilities

- Morgan
- Winston
- dotenv
- UUID
- node-cache
- geoip-lite

### Testing

- Jest
- Supertest

### Development Tools

- Git
- GitHub
- npm

---

## 🏗️ Project Structure

```text
EVrecharge/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── context/
│   │   └── features/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── ...
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## 🔄 Application Flow

The EVrecharge platform follows a simple flow:

1. User registers or logs in.
2. User searches for available EV charging stations.
3. User views station details and location.
4. User selects a suitable charging slot.
5. User makes a booking.
6. User completes the payment.
7. User can manage bookings and profile information.

Station owners can manage their charging stations and bookings, while administrators can manage users, stations, bookings, payments, and analytics.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Dipanshu-Nikam/EVrecharge.git
cd EVrecharge
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the backend folder and add the required configuration.

```env
PORT=5000
JWT_SECRET=your_secret_key
```

Add other API keys and service credentials required by the project.

### 5. Run the Application

Start the backend:

```bash
npm run dev
```

Then start the frontend from the frontend folder:

```bash
npm run dev
```

---

## 🧩 Challenges & Solutions

### 🔐 Authentication & Security

Implemented authentication and security measures using JWT, bcrypt, Helmet, CORS, rate limiting, and input validation.

### 💳 Payment Integration

Integrated payment-related functionality using Razorpay and Stripe while handling payment requests and responses through the backend.

### 🗺️ Maps & Location

Implemented map and location-related features using external map services to help users find charging stations.

### 📅 Booking Management

Developed booking functionality to allow users to select charging stations and manage their bookings.

### 🔄 Frontend & Backend Integration

Connected the React frontend with the Node.js/Express backend using REST APIs and Axios.

### 🔔 Notifications

Implemented notification functionality to provide users with important application updates.

---
