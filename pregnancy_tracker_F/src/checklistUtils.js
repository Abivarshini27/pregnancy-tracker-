export const calculateChecklistProgress = (checklist = []) => {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return 0
  }

  const completed = checklist.filter((item) => item.checked).length
  return Math.round((completed / checklist.length) * 100)
}

export const toggleChecklistItem = (checklist, itemId) => checklist.map((item) => (
  item.id === itemId ? { ...item, checked: !item.checked } : item
))
