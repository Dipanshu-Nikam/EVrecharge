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
