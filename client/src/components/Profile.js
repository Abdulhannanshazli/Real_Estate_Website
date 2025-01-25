import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

function Profile() {
    const [userProperties, setUserProperties] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = localStorage.getItem('userId');

                if (!token || !userId) {
                    navigate('/login');
                    return;
                }

                // First fetch user details
                const userResponse = await axios.get(
                    `http://localhost:5001/api/auth/user`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setUserEmail(userResponse.data.email);

                // Then fetch user's properties
                const propertiesResponse = await axios.get(
                    `http://localhost:5001/api/properties`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Filter properties for the current user
                const userProps = propertiesResponse.data.filter(
                    prop => prop.owner._id === userId
                );
                setUserProperties(userProps);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user data:', error);
                if (error.response?.status === 401) {
                    // If unauthorized, redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('userId');
                    navigate('/login');
                    return;
                }
                setError(error.response?.data?.message || 'Error fetching user data. Please try again.');
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleRetry = () => {
        setLoading(true);
        setError('');
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
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
                        onClick={handleRetry}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                <div className="mb-4">
                    <p className="text-gray-600">Email:</p>
                    <p className="text-lg font-semibold">{userEmail}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">My Properties</h2>
                    <Link
                        to="/add-property"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Add New Property
                    </Link>
                </div>

                {userProperties.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                        You haven't listed any properties yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userProperties.map((property) => (
                            <div key={property._id} className="bg-gray-50 rounded-lg p-4">
                                <img
                                    src={`${BACKEND_URL}${property.imageUrl || '/default-image.jpg'}`}
                                    alt={property.title}
                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                                <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                                <p className="text-gray-600 mb-2">{property.location}</p>
                                <p className="text-blue-600 font-bold mb-4">
                                    PKR {property.price.toLocaleString()}
                                </p>
                                <div className="flex space-x-2">
                                    <Link
                                        to={`/property/${property._id}`}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1 text-center"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        to={`/property/edit/${property._id}`}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1 text-center"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile; 