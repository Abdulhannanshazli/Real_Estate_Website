import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const isAuthenticated = !!token && !!userId;

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${BACKEND_URL}/api/properties/${id}`);
        setProperty(response.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Error fetching property details. Please try again later.');
        console.error('Error fetching property:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    window.location.href = `mailto:${property.owner.email}?subject=Regarding your property: ${property.title}`;
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/messages/${id}`);
  };

  const handleEdit = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/property/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      await axios.delete(`${BACKEND_URL}/api/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/properties', { state: { message: 'Property deleted successfully' } });
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting property. Please try again later.');
      console.error('Error deleting property:', error);
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!property) return <div className="text-center">Property not found</div>;

  const isOwner = isAuthenticated && userId === property.owner._id;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <img
        src={`${BACKEND_URL}${property.imageUrl || '/default-image.jpg'}`}
        alt={property.title}
        className="w-full h-[400px] object-cover"
      />
      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{property.title}</h1>
          {isOwner && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit Property
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
                  deleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-600 mb-4">{property.description}</p>
            <p className="text-blue-600 font-bold text-2xl mb-4">
              PKR {property.price.toLocaleString()}
            </p>
            <p className="text-gray-600 mb-4">
              <span className="font-semibold">Location:</span> {property.location}
            </p>
            <p className="text-gray-600 mb-4">
              <span className="font-semibold">Listed by:</span> {property.owner.email}
            </p>
          </div>
          {!isOwner && (
            <div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Contact Owner</h3>
                {!isAuthenticated ? (
                  <p className="text-gray-600 mb-4">
                    Please login to contact the property owner.
                  </p>
                ) : (
                  <p className="text-gray-600 mb-4">
                    Get in touch with the property owner.
                  </p>
                )}
                <div className="space-y-3">
                  <button
                    onClick={handleContact}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    {isAuthenticated ? 'Send Email' : 'Login to Contact'}
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={handleMessage}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Send Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetail; 