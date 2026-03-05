// admin/src/pages/Orders/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';
import OrderDetailModal from '../../components/orders/OrderDetailModal';
import { ArrowLeft } from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.orders.getById(id);
      setOrder(response.data || response);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      showToast(error.message || 'Failed to load order', 'error');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate('/orders')}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </button>
      
      <OrderDetailModal
        order={order}
        onClose={() => navigate('/orders')}
        onUpdate={handleUpdate}
      />
    </>
  );
};

export default OrderDetail;