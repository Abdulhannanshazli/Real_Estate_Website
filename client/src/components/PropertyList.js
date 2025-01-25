import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('http://localhost:5001/api/properties');
        let filteredProperties = response.data;
        
        // If user is logged in, filter out their properties
        if (userId) {
          filteredProperties = response.data.filter(
            property => property.owner._id !== userId
          );
        }
        console.log(filteredProperties)
        setProperties(filteredProperties);
      } catch (error) {
        setError(error.response?.data?.message || 'Error fetching properties. Please try again later.');
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [userId]);

  const filteredProperties = properties.filter(property => 
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search properties by title, location, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Available Properties</h2>
        {userId && (
          <Link
            to="/profile"
            className="text-blue-600 hover:text-blue-800"
          >
            View My Properties
          </Link>
        )}
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          {searchTerm ? 'No properties match your search.' : 'No properties available.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
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
  );
}

export default PropertyList; 