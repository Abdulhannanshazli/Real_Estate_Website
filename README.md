
Please follow these instruction to run this project 
# Real Estate Website Project

## Description
A modern real estate platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that allows users to list, browse, and manage property listings. The platform features a responsive design and user authentication system.

## Technologies Used
- **Frontend:**
  - React.js
  - Tailwind CSS for styling
  - Axios for API requests
  - React Router for navigation

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB for database
  - JWT for authentication
  - Multer for image uploads

## Features
- User authentication (login/register)
- Property listing creation with image uploads
- Property browsing and searching
- Detailed property views
- User profile management
- Price display in PKR (Pakistani Rupees)
- Responsive design for all devices

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running
- Git installed

### Installation Steps

1. Clone the repository
```bash
git clone https://github.com/Abdulhannanshazli/Real_Estate_Website.git
cd Real_Estate_Website
```

2. Setup Backend
```bash
cd server
npm install
# Create .env file with following variables:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# PORT=5001
npm start
```

3. Setup Frontend
```bash
cd client
npm install
# Create .env file with:
# REACT_APP_BACKEND_URL=http://localhost:5001
npm start
```

4. Access the application
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## API Endpoints
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/properties` - Get all properties
- POST `/api/properties` - Create new property
- GET `/api/properties/:id` - Get specific property
- PUT `/api/properties/:id` - Update property
- DELETE `/api/properties/:id` - Delete property

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact
- Abdul Hannan - abdulhannanshazli@gmail.com
- Project Link: https://github.com/Abdulhannanshazli/Real_Estate_Website

Would you like me to add any additional sections or details to this description?
