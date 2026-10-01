import { describe, expect, it } from 'vitest'
import { calculateChecklistProgress, toggleChecklistItem } from './checklistUtils'

describe('checklist utils', () => {
  it('calculates completion progress based on checked items', () => {
    const checklist = [
      { id: 1, text: 'Drink water', checked: true },
      { id: 2, text: 'Walk', checked: true },
      { id: 3, text: 'Prenatal vitamin', checked: false },
    ]

    expect(calculateChecklistProgress(checklist)).toBe(67)
  })

  it('toggles a checklist item and keeps the rest intact', () => {
    const checklist = [
      { id: 1, text: 'Drink water', checked: false },
      { id: 2, text: 'Walk', checked: true },
    ]

    expect(toggleChecklistItem(checklist, 1)).toEqual([
      { id: 1, text: 'Drink water', checked: true },
      { id: 2, text: 'Walk', checked: true },
    ])
  })
})
