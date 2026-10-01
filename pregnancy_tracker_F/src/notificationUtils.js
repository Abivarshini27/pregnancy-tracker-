export const getUnreadNotificationCount = (notifications = []) => (
  notifications.filter((notification) => !notification.read).length
)

export const markNotificationAsRead = (notifications, id) => notifications.map((notification) => (
  notification.id === id ? { ...notification, read: true } : notification
))
