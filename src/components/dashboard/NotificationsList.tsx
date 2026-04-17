'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, X, Clock, CheckCircle, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'new_appointment' | 'cancelled_appointment' | 'appointment_confirmed' | 'appointment_canceled' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  appointmentId?: string;
  customerId?: string;
}

interface NotificationsListProps {
  notifications: Notification[];
}

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'cancelled_appointment':
        return <X className="w-5 h-5 text-red-600" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'system':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: he,
      });
    } catch {
      return '';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.appointmentId) {
      router.push(`/dashboard/appointments/${notification.appointmentId}`);
    } else if (notification.customerId) {
      router.push(`/dashboard/customers/${notification.customerId}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">כל ההתראות</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{unreadCount} התראות חדשות</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              סמן הכל כנקרא
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            הכל ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === 'unread'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            לא נקראו ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {filter === 'unread' ? 'אין התראות חדשות' : 'אין התראות'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group ${
                !notification.read ? 'bg-blue-50/20' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      !notification.read ? 'bg-primary-50' : 'bg-gray-50'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1 line-clamp-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">{formatTime(notification.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="סמן כנקרא"
                        >
                          <Check className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="מחק"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


