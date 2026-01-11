// src/services/notificationService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notifications';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const notificationAPI = {
  getNotifications: async (params = {}) => {
    const { limit = 20, skip = 0, unreadOnly = false } = params;
    const response = await axios.get(
      `${API_URL}?limit=${limit}&skip=${skip}&unreadOnly=${unreadOnly}`,
      getAuthHeader()
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get(
      `${API_URL}/unread-count`,
      getAuthHeader()
    );
    return response.data;
  },

  markAsRead: async (notificationIds) => {
    const response = await axios.put(
      `${API_URL}/mark-read`,
      { notificationIds },
      getAuthHeader()
    );
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.put(
      `${API_URL}/mark-all-read`,
      {},
      getAuthHeader()
    );
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await axios.delete(
      `${API_URL}/${notificationId}`,
      getAuthHeader()
    );
    return response.data;
  }
};