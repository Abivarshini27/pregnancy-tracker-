import { describe, expect, it } from 'vitest'
import { getUnreadNotificationCount, markNotificationAsRead } from './notificationUtils'

describe('notification utils', () => {
  it('counts only unread notifications', () => {
    const notifications = [
      { id: 1, title: 'Drink water', read: false },
      { id: 2, title: 'Take vitamins', read: true },
      { id: 3, title: 'Rest', read: false },
    ]

    expect(getUnreadNotificationCount(notifications)).toBe(2)
  })

  it('marks a notification as read without changing others', () => {
    const notifications = [
      { id: 1, title: 'Drink water', read: false },
      { id: 2, title: 'Take vitamins', read: false },
    ]

    expect(markNotificationAsRead(notifications, 2)).toEqual([
      { id: 1, title: 'Drink water', read: false },
      { id: 2, title: 'Take vitamins', read: true },
    ])
  })
})
