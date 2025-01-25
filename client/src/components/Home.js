import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

function Home() {
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchRecentProperties = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/properties');
        let properties = response.data;
        
        // Filter out user's own properties if logged in
        if (userId) {
          properties = properties.filter(property => property.owner._id !== userId);
        }
        
        // Sort by creation date and take the 3 most recent
        const sortedProperties = properties
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
          
        setRecentProperties(sortedProperties);
        setLoading(false);
      } catch (error) {
        setError('Error fetching recent properties');
        setLoading(false);
      }
    };

    fetchRecentProperties();
  }, [userId]);

  return (
    <div>
      <div className="bg-blue-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Shazli Estate</h1>
        <p className="text-xl mb-8">Find your dream property with us</p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/properties"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50"
          >
            Browse Properties
          </Link>
          <Link
            to="/add-property"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            List Your Property
          </Link>
        </div>
      </div>

      {/* Recent Properties Section */}
      <div className="py-12 px-4">
        <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold">Recent Properties</h2>
          {userId && (
            <Link
              to="/profile"
              className="text-blue-600 hover:text-blue-800"
            >
              View My Properties
            </Link>
          )}
        </div>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : recentProperties.length === 0 ? (
          <div className="text-center text-gray-500">No properties available at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {recentProperties.map((property) => (
              <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={`${BACKEND_URL}${property.imageUrl || '/default-image.jpg'}`}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-2">{property.location}</p>
                  <p className="text-blue-600 font-bold mb-4">PKR {property.price.toLocaleString()}</p>
                  <Link
                    to={`/property/${property._id}`}
                    className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="py-12 px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
            <p className="text-gray-600">Browse through our extensive collection of properties</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
            <p className="text-gray-600">Find properties that fit your budget</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-blue-600 text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Direct Contact</h3>
            <p className="text-gray-600">Connect directly with property owners</p>
          </div>
        </div>
      </div>


    </div>
  );
}

export default Home; 