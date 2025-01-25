import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) {
        setUnreadCount(0);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/messages/unread/count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUnreadCount(0);
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">Shazli Estate</Link>
          <div className="flex space-x-4 items-center">
            <Link to="/properties" className="hover:text-blue-200">Properties</Link>
            {isAuthenticated ? (
              <>
                <Link to="/add-property" className="hover:text-blue-200">Add Property</Link>
                <div className="relative">
                  <Link to="/messages" className="hover:text-blue-200 flex items-center">
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
                <Link to="/profile" className="hover:text-blue-200">Profile</Link>
                <button onClick={handleLogout} className="hover:text-blue-200">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">Login</Link>
                <Link to="/signup" className="hover:text-blue-200">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 