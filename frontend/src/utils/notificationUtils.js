export const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATE: 'order_update',
  INVENTORY_ALERT: 'inventory_alert',
  SHIPMENT_UPDATE: 'shipment_update'
};

export const saveNotificationsToStorage = (userId, notifications) => {
  try {
    // Limit to 50 notifications to prevent localStorage overflow
    const limitedNotifications = notifications.slice(0, 50);
    localStorage.setItem(`supplier_notifications_${userId}`, JSON.stringify(limitedNotifications));
    console.log(`💾 Saved ${limitedNotifications.length} notifications for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving notifications:', error);
    return false;
  }
};

export const loadNotificationsFromStorage = (userId) => {
  try {
    const saved = localStorage.getItem(`supplier_notifications_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(`📂 Loaded ${parsed.length} notifications for user ${userId}`);
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    return [];
  }
};

export const clearNotificationsFromStorage = (userId) => {
  localStorage.removeItem(`supplier_notifications_${userId}`);
  console.log(`🧹 Cleared notifications for user ${userId}`);
};

export const markNotificationAsRead = (userId, notificationId) => {
  try {
    const notifications = loadNotificationsFromStorage(userId);
    const updated = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    saveNotificationsToStorage(userId, updated);
    return updated;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return [];
  }
};

export const addNewNotification = (userId, notification) => {
  try {
    const notifications = loadNotificationsFromStorage(userId);
    const newNotifications = [notification, ...notifications];
    saveNotificationsToStorage(userId, newNotifications);
    return newNotifications;
  } catch (error) {
    console.error('❌ Error adding new notification:', error);
    return [];
  }
};