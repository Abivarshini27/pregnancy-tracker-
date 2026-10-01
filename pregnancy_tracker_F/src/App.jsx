import { useEffect, useState } from 'react'
import './App.css'
import { calculateChecklistProgress, toggleChecklistItem } from './checklistUtils'
import { getUnreadNotificationCount, markNotificationAsRead } from './notificationUtils'

const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://pregnancy-tracker-api-8vs4.onrender.com' : 'http://localhost:8080')

const request = async (path, options = {}) => {
  const token = sessionStorage.getItem('pregnancy_tracker_token')
  const isPublicRequest = path === '/login' || path === '/signup'
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(!isPublicRequest && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const message = await response.text()
    let errorMessage = message
    try {
      errorMessage = JSON.parse(message).message || message
    } catch {
      errorMessage = message
    }
    throw new Error(errorMessage || 'Unable to connect to the server')
  }

  return response.json()
}

const getMetrics = (week, babySize) => [
  { label: 'Week', value: String(week), detail: 'of pregnancy' },
  { label: 'Baby size', value: babySize.name, detail: `about ${babySize.length}` },
  { label: 'Due date', value: 'Apr 18', detail: '2027' },
]

const babySizeByWeek = [
  { from: 1, name: 'Poppy seed', length: '0.1 in' },
  { from: 8, name: 'Raspberry', length: '0.6 in' },
  { from: 12, name: 'Lime', length: '2.1 in' },
  { from: 16, name: 'Avocado', length: '4.6 in' },
  { from: 20, name: 'Banana', length: '10 in' },
  { from: 24, name: 'Coconut', length: '12 in' },
  { from: 28, name: 'Eggplant', length: '15 in' },
  { from: 32, name: 'Squash', length: '16.7 in' },
  { from: 36, name: 'Honeydew melon', length: '18.7 in' },
  { from: 40, name: 'Watermelon', length: '20.7 in' },
]

const getBabySize = (week) => babySizeByWeek.reduce(
  (size, entry) => (week >= entry.from ? entry : size),
  babySizeByWeek[0],
)

const defaultCareChecklist = [
  { id: 1, text: 'Drink 8+ glasses of water', checked: true },
  { id: 2, text: 'Walk for 20 minutes today', checked: false },
  { id: 3, text: 'Take prenatal vitamin', checked: true },
  { id: 4, text: 'Track baby kicks before bed', checked: false },
]

const defaultMealPlan = [
  { id: 1, title: 'Breakfast', meal: 'Greek yogurt bowl with berries', checked: true },
  { id: 2, title: 'Lunch', meal: 'Quinoa salad with chickpeas', checked: false },
  { id: 3, title: 'Dinner', meal: 'Salmon with roasted veggies', checked: false },
  { id: 4, title: 'Snack', meal: 'Banana and almond butter', checked: true },
]

const defaultMedications = []

const hospitalBagDefaults = [
  { id: 1, category: 'Documents', text: 'Photo ID and insurance card', packed: false },
  { id: 2, category: 'Documents', text: 'Prenatal records and birth plan', packed: false },
  { id: 3, category: 'For me', text: 'Comfortable clothes and going-home outfit', packed: false },
  { id: 4, category: 'For me', text: 'Toiletries and phone charger', packed: false },
  { id: 5, category: 'For baby', text: 'Going-home outfit and blanket', packed: false },
  { id: 6, category: 'For baby', text: 'Diapers and wipes', packed: false },
]

const hospitalBagCategories = ['Documents', 'For me', 'For baby', 'Extras']

const appointmentQuestionCategories = ['Symptoms', 'Medication', 'Birth plan', 'Other']

const defaultBirthPreferences = {
  supportPerson: '',
  laborPreferences: '',
  feedingPlan: 'Undecided',
  notes: '',
}

const defaultNotifications = [
  { id: 1, title: 'Hydration reminder', detail: 'Drink a glass of water before lunch.', time: 'Today, 9:00 AM', read: false },
  { id: 2, title: 'Prenatal reminder', detail: 'Take your vitamins with breakfast.', time: 'Today, 8:15 AM', read: true },
  { id: 3, title: 'Appointment alert', detail: 'Your check-in call is in 2 days.', time: 'Tomorrow', read: false },
]

const moodOptions = [
  { value: 'Happy', emoji: '😊', color: 'happy' },
  { value: 'Calm', emoji: '😌', color: 'calm' },
  { value: 'Tired', emoji: '😴', color: 'tired' },
  { value: 'Anxious', emoji: '😟', color: 'anxious' },
  { value: 'Excited', emoji: '🤩', color: 'excited' },
]

const defaultMood = { value: 'Calm', emoji: '😌', text: 'Feeling steady and relaxed today.' }

const timeline = [
  { week: '22', title: 'Movement check-in', status: 'Completed' },
  { week: '24', title: 'Growth scan', status: 'Upcoming' },
  { week: '26', title: 'Glucose screening', status: 'Planned' },
]

const wellnessTips = [
  'Try gentle stretching to ease lower back pressure.',
  'Keep a snack nearby to stay energized between meals.',
  'Sleep on your side with a pillow between your knees.',
]

const initialForm = {
  name: 'Ariana',
  email: 'ariana@example.com',
  password: '',
}

const initialEntries = [
  { id: 1, symptom: 'Headache', intensity: 'Mild', note: 'Improved after water and rest.', date: 'Today, 8:20 AM' },
  { id: 2, symptom: 'Fatigue', intensity: 'Moderate', note: 'Needed a short nap this afternoon.', date: 'Yesterday, 3:10 PM' },
]

const growthData = [
  { label: 'Baby heart rate', value: '145 bpm', detail: 'Healthy range' },
  { label: 'Weight gain', value: '12.8 lb', detail: 'Steady gain' },
  { label: 'Movement', value: 'Active', detail: 'Kicks and rolls' },
]

const appointments = [
  { day: 'Wed', date: '14', dateValue: '2026-10-14', title: 'Ultrasound', time: '9:30 AM', tone: 'pink' },
  { day: 'Fri', date: '16', dateValue: '2026-10-16', title: 'Doctor visit', time: '3:15 PM', tone: 'purple' },
  { day: 'Sun', date: '18', dateValue: '2026-10-18', title: 'Check-in call', time: '10:00 AM', tone: 'mint' },
]

const defaultAppointmentDates = {
  Ultrasound: '2026-10-14',
  'Doctor visit': '2026-10-16',
  'Check-in call': '2026-10-18',
}

const normalizeAppointments = (items) => items.map((item) => ({
  ...item,
  dateValue: item.dateValue || defaultAppointmentDates[item.title] || '',
}))

const nutritionGoals = [
  { name: 'Protein', value: '80g', progress: '82%' },
  { name: 'Iron', value: '18mg', progress: '90%' },
  { name: 'Folic acid', value: '400mcg', progress: '76%' },
]

const journalEntries = [
  { title: 'Morning reflection', text: 'Felt calmer after a slow breakfast and a short walk.', tag: 'Positive' },
  { title: 'Afternoon note', text: 'A little tired after lunch, but hydration helped a lot.', tag: 'Balanced' },
]

const hydrationGoal = 8

const getDaysUntil = (dateValue) => {
  if (!dateValue) {
    return '--'
  }

  const [year, month, day] = dateValue.split('-').map(Number)
  const dueDate = new Date(year, month - 1, day)
  const today = new Date()
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return Math.max(0, Math.ceil((dueDate - todayAtMidnight) / (1000 * 60 * 60 * 24)))
}

const formatAppointmentTime = (date) => date.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const getDateKey = (value = new Date()) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const buildDefaultDayData = () => ({
  entries: initialEntries,
  waterCount: 6,
  kickCount: 8,
  movementSessions: [],
  contractions: [],
  sleepHours: '7h 42m',
  nutrition: nutritionGoals,
  journal: journalEntries,
  appointments: appointments,
  careChecklist: defaultCareChecklist,
  meals: defaultMealPlan,
  medications: defaultMedications,
  notifications: defaultNotifications,
  mood: defaultMood,
  profile: { week: '24', dueDate: '2027-04-18' },
})

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [formMode, setFormMode] = useState('login')
  const [formData, setFormData] = useState(initialForm)
  const [symptomForm, setSymptomForm] = useState({
    symptom: 'Headache',
    intensity: 'Mild',
    note: '',
  })
  const [entries, setEntries] = useState(initialEntries)
  const [waterCount, setWaterCount] = useState(6)
  const [kickCount, setKickCount] = useState(8)
  const [movementSessions, setMovementSessions] = useState([])
  const [activeMovementSession, setActiveMovementSession] = useState(null)
  const [contractionHistory, setContractionHistory] = useState([])
  const [activeContraction, setActiveContraction] = useState(null)
  const [contractionNow, setContractionNow] = useState(Date.now())
  const [sleepHours, setSleepHours] = useState('7h 42m')
  const [nutritionData, setNutritionData] = useState(nutritionGoals)
  const [journalData, setJournalData] = useState(journalEntries)
  const [journalForm, setJournalForm] = useState({ text: '', tag: 'Today' })
  const [journalError, setJournalError] = useState('')
  const [appointmentData, setAppointmentData] = useState(appointments)
  const [appointmentForm, setAppointmentForm] = useState({ title: '', date: '', time: '' })
  const [appointmentError, setAppointmentError] = useState('')
  const [appointmentQuestions, setAppointmentQuestions] = useState([])
  const [appointmentQuestionInput, setAppointmentQuestionInput] = useState('')
  const [appointmentQuestionCategory, setAppointmentQuestionCategory] = useState('Other')
  const [careChecklist, setCareChecklist] = useState(defaultCareChecklist)
  const [careChecklistInput, setCareChecklistInput] = useState('')
  const [mealPlan, setMealPlan] = useState(defaultMealPlan)
  const [medications, setMedications] = useState(defaultMedications)
  const [medicationForm, setMedicationForm] = useState({ name: '', dose: '', time: '' })
  const [hospitalBag, setHospitalBag] = useState(hospitalBagDefaults)
  const [hospitalBagInput, setHospitalBagInput] = useState('')
  const [hospitalBagCategory, setHospitalBagCategory] = useState('Extras')
  const [babyNames, setBabyNames] = useState([])
  const [babyNameForm, setBabyNameForm] = useState({ name: '', note: '' })
  const [birthPreferences, setBirthPreferences] = useState(defaultBirthPreferences)
  const [notifications, setNotifications] = useState(defaultNotifications)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mood, setMood] = useState(defaultMood)
  const [selectedDate, setSelectedDate] = useState(getDateKey())
  const [trackerByDate, setTrackerByDate] = useState(() => ({ [getDateKey()]: buildDefaultDayData() }))
  const [pregnancyProfile, setPregnancyProfile] = useState({ week: '24', dueDate: '2027-04-18' })
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const daysLeft = getDaysUntil(pregnancyProfile.dueDate)
  const babySize = getBabySize(Number(pregnancyProfile.week) || 1)
  const careProgress = calculateChecklistProgress(careChecklist)
  const unreadNotifications = getUnreadNotificationCount(notifications)
  const hospitalBagProgress = hospitalBag.length
    ? Math.round((hospitalBag.filter((item) => item.packed).length / hospitalBag.length) * 100)
    : 0
  const openAppointmentQuestions = appointmentQuestions.filter((question) => !question.answered).length
  const contractionDuration = activeContraction
    ? formatDuration(Math.floor((contractionNow - activeContraction.startedAt) / 1000))
    : '0:00'
  const movementSessionDuration = activeMovementSession
    ? formatDuration(Math.floor((contractionNow - activeMovementSession.startedAt) / 1000))
    : '0:00'
  const orderedAppointments = [...appointmentData].sort((first, second) => (
    (first.dateValue || '9999-12-31').localeCompare(second.dateValue || '9999-12-31')
  ))

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSymptomChange = (event) => {
    const { name, value } = event.target
    setSymptomForm((current) => ({ ...current, [name]: value }))
  }

  const handleNutritionChange = (name, value) => {
    setNutritionData((current) => current.map((goal) => (
      goal.name === name ? { ...goal, value } : goal
    )))
  }

  const handleJournalSubmit = (event) => {
    event.preventDefault()
    const noteText = journalForm.text.trim()
    if (!noteText) {
      setJournalError('Write a note before adding it.')
      return
    }

    setJournalData((current) => [
      { title: 'New reflection', text: noteText, tag: journalForm.tag },
      ...current,
    ])
    setJournalForm({ text: '', tag: 'Today' })
    setJournalError('')
  }

  const handleAppointmentSubmit = (event) => {
    event.preventDefault()
    const title = appointmentForm.title.trim()
    if (!title || !appointmentForm.date || !appointmentForm.time) {
      setAppointmentError('Enter a title, date, and time before adding.')
      return
    }

    const appointmentDate = new Date(`${appointmentForm.date}T${appointmentForm.time}`)
    setAppointmentData((current) => [
      {
        day: appointmentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        date: appointmentDate.toLocaleDateString('en-US', { day: '2-digit' }),
        dateValue: appointmentForm.date,
        title,
        time: formatAppointmentTime(appointmentDate),
        tone: 'mint',
      },
      ...current,
    ])
    setAppointmentForm({ title: '', date: '', time: '' })
    setAppointmentError('')
  }

  const handleCareItemToggle = (itemId) => {
    setCareChecklist((current) => toggleChecklistItem(current, itemId))
  }

  const handleCareChecklistSubmit = (event) => {
    event.preventDefault()
    const trimmed = careChecklistInput.trim()

    if (!trimmed) {
      return
    }

    setCareChecklist((current) => [
      ...current,
      { id: Date.now(), text: trimmed, checked: false },
    ])
    setCareChecklistInput('')
  }

  const handleHospitalBagSubmit = (event) => {
    event.preventDefault()
    const text = hospitalBagInput.trim()
    if (!text) {
      return
    }

    setHospitalBag((current) => [
      ...current,
      { id: Date.now(), category: hospitalBagCategory, text, packed: false },
    ])
    setHospitalBagInput('')
  }

  const handleAppointmentQuestionSubmit = (event) => {
    event.preventDefault()
    const text = appointmentQuestionInput.trim()
    if (!text) {
      return
    }

    setAppointmentQuestions((current) => [
      { id: Date.now(), category: appointmentQuestionCategory, text, answered: false },
      ...current,
    ])
    setAppointmentQuestionInput('')
  }

  const handleBabyNameSubmit = (event) => {
    event.preventDefault()
    const name = babyNameForm.name.trim()
    if (!name) {
      return
    }

    setBabyNames((current) => [
      { id: Date.now(), name, note: babyNameForm.note.trim(), favorite: false },
      ...current,
    ])
    setBabyNameForm({ name: '', note: '' })
  }

  const handleMealToggle = (mealId) => {
    setMealPlan((current) => current.map((meal) => (
      meal.id === mealId ? { ...meal, checked: !meal.checked } : meal
    )))
  }

  const handleMedicationSubmit = (event) => {
    event.preventDefault()
    const { name, dose, time } = medicationForm
    if (!name.trim() || !dose.trim() || !time) {
      return
    }

    setMedications((current) => [
      ...current,
      { id: Date.now(), name: name.trim(), dose: dose.trim(), time, taken: false },
    ])
    setMedicationForm({ name: '', dose: '', time: '' })
  }

  const handleMedicationToggle = (medicationId) => {
    setMedications((current) => current.map((medication) => (
      medication.id === medicationId ? { ...medication, taken: !medication.taken } : medication
    )))
  }

  const handleContractionStart = () => {
    const startedAt = Date.now()
    setContractionNow(startedAt)
    setActiveContraction({ startedAt })
  }

  const handleMovementSessionStart = () => {
    const startedAt = Date.now()
    setContractionNow(startedAt)
    setActiveMovementSession({ startedAt, count: 0 })
  }

  const handleMovementLog = () => {
    setActiveMovementSession((current) => current && ({ ...current, count: current.count + 1 }))
  }

  const handleMovementSessionFinish = () => {
    if (!activeMovementSession || activeMovementSession.count === 0) {
      return
    }

    const endedAt = Date.now()
    setMovementSessions((current) => [{
      id: activeMovementSession.startedAt,
      time: new Date(activeMovementSession.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      count: activeMovementSession.count,
      duration: Math.max(1, Math.round((endedAt - activeMovementSession.startedAt) / 1000)),
    }, ...current])
    setActiveMovementSession(null)
  }

  useEffect(() => {
    if (!activeMovementSession) {
      return undefined
    }

    const timer = window.setInterval(() => setContractionNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeMovementSession])

  const handleContractionStop = () => {
    if (!activeContraction) {
      return
    }

    const endedAt = Date.now()
    const durationSeconds = Math.max(1, Math.round((endedAt - activeContraction.startedAt) / 1000))
    const previousContraction = contractionHistory[0]
    const intervalSeconds = previousContraction
      ? Math.max(0, Math.round((activeContraction.startedAt - previousContraction.startedAt) / 1000))
      : null

    setContractionHistory((current) => [{
      id: activeContraction.startedAt,
      startedAt: activeContraction.startedAt,
      time: new Date(activeContraction.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: durationSeconds,
      interval: intervalSeconds,
    }, ...current])
    setActiveContraction(null)
  }

  useEffect(() => {
    if (!activeContraction) {
      return undefined
    }

    const timer = window.setInterval(() => setContractionNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [activeContraction])

  const handleNotificationRead = (notificationId) => {
    setNotifications((current) => markNotificationAsRead(current, notificationId))
  }

  const handleDeleteNotification = (notificationId) => {
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId))
  }

  const handleMoodChange = (selectedMood) => {
    const match = moodOptions.find((option) => option.value === selectedMood)
    setMood({
      value: match.value,
      emoji: match.emoji,
      text: match.value === 'Happy'
        ? 'Feeling joyful and upbeat today.'
        : match.value === 'Calm'
          ? 'Feeling steady and relaxed today.'
          : match.value === 'Tired'
            ? 'A little tired, but still doing well.'
            : match.value === 'Anxious'
              ? 'Taking it one moment at a time today.'
              : 'Feeling excited for what is ahead.',
    })
  }

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setPregnancyProfile((current) => ({ ...current, [name]: value }))
  }

  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem('pregnancy_tracker_token')

      if (!token) {
        setIsRestoringSession(false)
        return
      }

      try {
        const user = await request('/me')
        const trackerData = await request('/tracker')

        if (Array.isArray(trackerData.hospitalBag)) {
          setHospitalBag(trackerData.hospitalBag)
        }
        if (Array.isArray(trackerData.appointmentQuestions)) {
          setAppointmentQuestions(trackerData.appointmentQuestions)
        }
        if (Array.isArray(trackerData.babyNames)) {
          setBabyNames(trackerData.babyNames)
        }
        if (trackerData.birthPreferences && typeof trackerData.birthPreferences === 'object') {
          setBirthPreferences({ ...defaultBirthPreferences, ...trackerData.birthPreferences })
        }

        setFormData((current) => ({ ...current, email: user.email || current.email }))

        const savedMap = trackerData.trackerByDate || {}
        if (Object.keys(savedMap).length > 0) {
          setTrackerByDate(savedMap)
          const firstDate = Object.keys(savedMap)[0]
          setSelectedDate(firstDate)
          const loadedDay = savedMap[firstDate] || buildDefaultDayData()
          setEntries(loadedDay.entries || [])
          setWaterCount(typeof loadedDay.waterCount === 'number' ? loadedDay.waterCount : 6)
          setKickCount(typeof loadedDay.kickCount === 'number' ? loadedDay.kickCount : 8)
          setMovementSessions(Array.isArray(loadedDay.movementSessions) ? loadedDay.movementSessions : [])
          setContractionHistory(Array.isArray(loadedDay.contractions) ? loadedDay.contractions : [])
          setSleepHours(typeof loadedDay.sleepHours === 'string' ? loadedDay.sleepHours : '7h 42m')
          setNutritionData(Array.isArray(loadedDay.nutrition) ? loadedDay.nutrition : nutritionGoals)
          setJournalData(Array.isArray(loadedDay.journal) ? loadedDay.journal : journalEntries)
          setAppointmentData(Array.isArray(loadedDay.appointments) ? normalizeAppointments(loadedDay.appointments) : appointments)
          setCareChecklist(Array.isArray(loadedDay.careChecklist) ? loadedDay.careChecklist : defaultCareChecklist)
          setMealPlan(Array.isArray(loadedDay.meals) ? loadedDay.meals : defaultMealPlan)
          setMedications(Array.isArray(loadedDay.medications) ? loadedDay.medications : defaultMedications)
          setNotifications(Array.isArray(loadedDay.notifications) ? loadedDay.notifications : defaultNotifications)
          setMood(loadedDay.mood || defaultMood)
          setPregnancyProfile(loadedDay.profile || { week: '24', dueDate: '2027-04-18' })
        } else if (Array.isArray(trackerData.entries)) {
          setEntries(trackerData.entries)
        }

        if (typeof trackerData.waterCount === 'number') {
          setWaterCount(trackerData.waterCount)
        }
        if (typeof trackerData.kickCount === 'number') {
          setKickCount(trackerData.kickCount)
        }
        if (Array.isArray(trackerData.movementSessions)) {
          setMovementSessions(trackerData.movementSessions)
        }
        if (Array.isArray(trackerData.contractions)) {
          setContractionHistory(trackerData.contractions)
        }
        if (typeof trackerData.sleepHours === 'string') {
          setSleepHours(trackerData.sleepHours)
        }
        if (Array.isArray(trackerData.nutrition)) {
          setNutritionData(trackerData.nutrition)
        }
        if (Array.isArray(trackerData.journal)) {
          setJournalData(trackerData.journal)
        }
        if (Array.isArray(trackerData.appointments)) {
          setAppointmentData(normalizeAppointments(trackerData.appointments))
        }
        if (Array.isArray(trackerData.careChecklist)) {
          setCareChecklist(trackerData.careChecklist)
        }
        if (Array.isArray(trackerData.meals)) {
          setMealPlan(trackerData.meals)
        }
        if (Array.isArray(trackerData.medications)) {
          setMedications(trackerData.medications)
        }
        if (Array.isArray(trackerData.notifications)) {
          setNotifications(trackerData.notifications)
        }
        if (trackerData.mood) {
          setMood(trackerData.mood)
        }
        if (trackerData.profile) {
          setPregnancyProfile((current) => ({ ...current, ...trackerData.profile }))
        }

        setIsDataLoaded(true)
        setIsAuthenticated(true)
      } catch {
        sessionStorage.removeItem('pregnancy_tracker_token')
      } finally {
        setIsRestoringSession(false)
      }
    }

    restoreSession()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setIsSubmitting(true)

    try {
      if (formMode === 'signup') {
        await request('/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: 'USER',
          }),
        })
      }

      const loginResponse = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      })

      sessionStorage.setItem('pregnancy_tracker_token', loginResponse.token)
      const trackerData = await request('/tracker')

      if (Array.isArray(trackerData.hospitalBag)) {
        setHospitalBag(trackerData.hospitalBag)
      }
      if (Array.isArray(trackerData.appointmentQuestions)) {
        setAppointmentQuestions(trackerData.appointmentQuestions)
      }
      if (Array.isArray(trackerData.babyNames)) {
        setBabyNames(trackerData.babyNames)
      }
      if (trackerData.birthPreferences && typeof trackerData.birthPreferences === 'object') {
        setBirthPreferences({ ...defaultBirthPreferences, ...trackerData.birthPreferences })
      }

      const savedMap = trackerData.trackerByDate || {}
      if (Object.keys(savedMap).length > 0) {
        setTrackerByDate(savedMap)
        const firstDate = Object.keys(savedMap)[0]
        setSelectedDate(firstDate)
        const loadedDay = savedMap[firstDate] || buildDefaultDayData()
        setEntries(loadedDay.entries || [])
        setWaterCount(typeof loadedDay.waterCount === 'number' ? loadedDay.waterCount : 6)
        setKickCount(typeof loadedDay.kickCount === 'number' ? loadedDay.kickCount : 8)
        setMovementSessions(Array.isArray(loadedDay.movementSessions) ? loadedDay.movementSessions : [])
        setContractionHistory(Array.isArray(loadedDay.contractions) ? loadedDay.contractions : [])
        setSleepHours(typeof loadedDay.sleepHours === 'string' ? loadedDay.sleepHours : '7h 42m')
        setNutritionData(Array.isArray(loadedDay.nutrition) ? loadedDay.nutrition : nutritionGoals)
        setJournalData(Array.isArray(loadedDay.journal) ? loadedDay.journal : journalEntries)
        setAppointmentData(Array.isArray(loadedDay.appointments) ? normalizeAppointments(loadedDay.appointments) : appointments)
        setCareChecklist(Array.isArray(loadedDay.careChecklist) ? loadedDay.careChecklist : defaultCareChecklist)
        setMealPlan(Array.isArray(loadedDay.meals) ? loadedDay.meals : defaultMealPlan)
        setMedications(Array.isArray(loadedDay.medications) ? loadedDay.medications : defaultMedications)
        setNotifications(Array.isArray(loadedDay.notifications) ? loadedDay.notifications : defaultNotifications)
        setMood(loadedDay.mood || defaultMood)
        setPregnancyProfile(loadedDay.profile || { week: '24', dueDate: '2027-04-18' })
      } else if (Array.isArray(trackerData.entries)) {
        setEntries(trackerData.entries)
      }

      if (typeof trackerData.waterCount === 'number') {
        setWaterCount(trackerData.waterCount)
      }
      if (typeof trackerData.kickCount === 'number') {
        setKickCount(trackerData.kickCount)
      }
      if (Array.isArray(trackerData.movementSessions)) {
        setMovementSessions(trackerData.movementSessions)
      }
      if (Array.isArray(trackerData.contractions)) {
        setContractionHistory(trackerData.contractions)
      }
      if (typeof trackerData.sleepHours === 'string') {
        setSleepHours(trackerData.sleepHours)
      }
      if (Array.isArray(trackerData.nutrition)) {
        setNutritionData(trackerData.nutrition)
      }
      if (Array.isArray(trackerData.journal)) {
        setJournalData(trackerData.journal)
      }
      if (Array.isArray(trackerData.appointments)) {
        setAppointmentData(normalizeAppointments(trackerData.appointments))
      }
      if (Array.isArray(trackerData.careChecklist)) {
        setCareChecklist(trackerData.careChecklist)
      }
      if (Array.isArray(trackerData.meals)) {
        setMealPlan(trackerData.meals)
      }
      if (Array.isArray(trackerData.medications)) {
        setMedications(trackerData.medications)
      }
      if (Array.isArray(trackerData.notifications)) {
        setNotifications(trackerData.notifications)
      }
      if (trackerData.mood) {
        setMood(trackerData.mood)
      }
      if (trackerData.profile) {
        setPregnancyProfile((current) => ({ ...current, ...trackerData.profile }))
      }

      setIsDataLoaded(true)
      setIsAuthenticated(true)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const currentDayData = {
      entries,
      waterCount,
      kickCount,
      movementSessions,
      contractions: contractionHistory,
      sleepHours,
      nutrition: nutritionData,
      journal: journalData,
      appointments: appointmentData,
      careChecklist,
      meals: mealPlan,
      medications,
      notifications,
      mood,
      profile: pregnancyProfile,
    }

    setTrackerByDate((current) => ({
      ...current,
      [selectedDate]: currentDayData,
    }))
  }, [selectedDate, entries, waterCount, kickCount, movementSessions, contractionHistory, sleepHours, nutritionData, journalData, appointmentData, careChecklist, mealPlan, medications, notifications, mood, pregnancyProfile])

  useEffect(() => {
    const loadSelectedDay = () => {
      const selectedDay = trackerByDate[selectedDate] || buildDefaultDayData()
      setEntries(selectedDay.entries || [])
      setWaterCount(typeof selectedDay.waterCount === 'number' ? selectedDay.waterCount : 6)
      setKickCount(typeof selectedDay.kickCount === 'number' ? selectedDay.kickCount : 8)
      setMovementSessions(Array.isArray(selectedDay.movementSessions) ? selectedDay.movementSessions : [])
      setContractionHistory(Array.isArray(selectedDay.contractions) ? selectedDay.contractions : [])
      setSleepHours(typeof selectedDay.sleepHours === 'string' ? selectedDay.sleepHours : '7h 42m')
      setNutritionData(Array.isArray(selectedDay.nutrition) ? selectedDay.nutrition : nutritionGoals)
      setJournalData(Array.isArray(selectedDay.journal) ? selectedDay.journal : journalEntries)
      setAppointmentData(Array.isArray(selectedDay.appointments) ? normalizeAppointments(selectedDay.appointments) : appointments)
      setCareChecklist(Array.isArray(selectedDay.careChecklist) ? selectedDay.careChecklist : defaultCareChecklist)
      setMealPlan(Array.isArray(selectedDay.meals) ? selectedDay.meals : defaultMealPlan)
      setMedications(Array.isArray(selectedDay.medications) ? selectedDay.medications : defaultMedications)
      setNotifications(Array.isArray(selectedDay.notifications) ? selectedDay.notifications : defaultNotifications)
      setMood(selectedDay.mood || defaultMood)
      setPregnancyProfile(selectedDay.profile || { week: '24', dueDate: '2027-04-18' })
    }

    loadSelectedDay()
  }, [selectedDate])

  useEffect(() => {
    if (!isAuthenticated || !isDataLoaded) {
      return
    }

    const saveTrackerData = async () => {
      try {
        setSyncError('')
        await request('/tracker', {
          method: 'PUT',
          body: JSON.stringify({ trackerByDate, hospitalBag, appointmentQuestions, babyNames, birthPreferences }),
        })
      } catch (error) {
        setSyncError('Your latest tracker update could not be saved.')
      }
    }

    saveTrackerData()
  }, [trackerByDate, hospitalBag, appointmentQuestions, babyNames, birthPreferences, isAuthenticated, isDataLoaded])

  const handleAddEntry = (event) => {
    event.preventDefault()

    if (!symptomForm.note.trim()) {
      return
    }

    const newEntry = {
      id: Date.now(),
      symptom: symptomForm.symptom,
      intensity: symptomForm.intensity,
      note: symptomForm.note,
      date: 'Just now',
    }

    setEntries((current) => [newEntry, ...current])
    setSymptomForm({ symptom: 'Headache', intensity: 'Mild', note: '' })
  }

  const handleSleepSubmit = (event) => {
    event.preventDefault()
    const value = event.currentTarget.elements.sleep.value.trim()

    if (value) {
      setSleepHours(value)
    }
  }

  if (isRestoringSession) {
    return <div className="session-loading">Restoring your tracker...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <section className="auth-copy">
            <div className="brand-block">
              <img className="brand-logo" src="/bloom-baby-logo.svg" alt="Bloom & Baby logo" />
              <span className="brand-name">Bloom & Baby</span>
            </div>

            <h1>Welcome to your pregnancy journey.</h1>
            <p>
              Track your health, stay on top of appointments, and feel supported every step of the way.
            </p>

            <ul className="feature-list">
              <li>Daily wellness reminders</li>
              <li>Custom appointment tracking</li>
              <li>Milestone and growth updates</li>
            </ul>
          </section>

          <section className="auth-card">
            <div className="auth-header">
              <h2>{formMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
              <div className="toggle-row">
                <button
                  type="button"
                  className={formMode === 'login' ? 'toggle active' : 'toggle'}
                  onClick={() => setFormMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={formMode === 'signup' ? 'toggle active' : 'toggle'}
                  onClick={() => setFormMode('signup')}
                >
                  Sign up
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {formMode === 'signup' && (
                <label>
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <span className="password-field">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    title={isPasswordVisible ? 'Hide password' : 'Show password'}
                  >
                    {isPasswordVisible ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="password-toggle-icon">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M4 4l16 16" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="password-toggle-icon">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </span>
              </label>

              <button type="submit" className="primary-btn auth-submit">
                {isSubmitting ? 'Connecting...' : formMode === 'login' ? 'Log in' : 'Create account'}
              </button>
              {authError && <p className="form-error" role="alert">{authError}</p>}
            </form>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="tracker-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img className="topbar-logo" src="/bloom-baby-logo.svg" alt="Bloom & Baby logo" />
          <div>
            <p className="eyebrow">Pregnancy companion</p>
            <h1>Bloom & Baby</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="notification-popover-wrap">
            <button
              type="button"
              className="notification-bell"
              onClick={() => setShowNotifications((visible) => !visible)}
              aria-label="Show notifications"
            >
              🔔
              {unreadNotifications > 0 && <span className="notification-badge">{unreadNotifications}</span>}
            </button>

            {showNotifications && (
              <div className="notification-popover">
                <div className="notification-popover-head">
                  <h3>Alerts</h3>
                  <button type="button" className="close-popover" onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                    ×
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="empty-notification">No alerts right now</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className={notification.read ? 'notification-item read' : 'notification-item'}>
                      <div className="notification-copy">
                        <strong>{notification.title}</strong>
                        <p>{notification.detail}</p>
                      </div>

                      <div className="notification-meta">
                        <span>{notification.time}</span>
                        <div className="notification-actions">
                          {!notification.read && (
                            <button type="button" className="inline-btn" onClick={() => handleNotificationRead(notification.id)}>
                              Read
                            </button>
                          )}
                          <button type="button" className="delete-btn" onClick={() => handleDeleteNotification(notification.id)} aria-label={`Delete ${notification.title}`}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span className="welcome-tag">Hi, {formData.name || 'Mom'}</span>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              sessionStorage.removeItem('pregnancy_tracker_token')
              setIsAuthenticated(false)
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard">
        {syncError && <p className="sync-error" role="status">{syncError}</p>}
        <section className="hero-card">
          <div className="hero-copy">
            <span className="pill">Trimester 3 · Week {pregnancyProfile.week}</span>
            <h2>You’re halfway through a beautiful journey.</h2>
            <p>
              Your baby is growing steadily, and your body is doing incredible work.
              Keep nourishing yourself and enjoy small moments of rest.
            </p>
            <span className="hero-note">A little progress, a lot of love - one day at a time.</span>
            <div className="hero-actions">
              <button type="button" className="primary-btn" onClick={() => scrollToSection('care-plan')}>View plan</button>
              <button type="button" className="secondary-btn" onClick={() => scrollToSection('journal-section')}>Journal</button>
            </div>
          </div>

          <div className="hero-visual" aria-label="Pregnancy health summary">
            <div className="orb">
              <span>👼</span>
            </div>
            <div className="health-badge">
              <strong>{daysLeft}</strong>
              <small>days left</small>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          {getMetrics(pregnancyProfile.week, babySize).map((item) => (
            <article key={item.label} className="stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </article>
          ))}
        </section>

        <section className="panel profile-panel">
          <div className="panel-head">
            <h3>Pregnancy profile</h3>
            <span>Saved to your account</span>
          </div>
          <div className="profile-form">
            <label>
              Date
              <input type="date" value={selectedDate} disabled={Boolean(activeContraction || activeMovementSession)} onChange={(event) => setSelectedDate(getDateKey(event.target.value))} />
            </label>
            <label>
              Current week
              <input name="week" type="number" min="1" max="42" value={pregnancyProfile.week} onChange={handleProfileChange} />
            </label>
            <label>
              Due date
              <input name="dueDate" type="date" value={pregnancyProfile.dueDate} onChange={handleProfileChange} />
            </label>
          </div>
        </section>

        <section className="symptom-section panel">
          <div className="panel-head">
            <h3>Symptoms tracker</h3>
            <span>{entries.length} logs</span>
          </div>

          <div className="symptom-layout">
            <div className="symptom-summary">
              <div className="summary-box">
                <span className="summary-label">Today’s mood</span>
                <strong>Calm</strong>
              </div>
              <div className="summary-box">
                <span className="summary-label">Energy</span>
                <strong>Good</strong>
              </div>
              <div className="summary-box">
                <span className="summary-label">Hydration</span>
                <strong>82%</strong>
              </div>
            </div>

            <form className="symptom-form" onSubmit={handleAddEntry}>
              <label>
                Symptom
                <select name="symptom" value={symptomForm.symptom} onChange={handleSymptomChange}>
                  <option>Headache</option>
                  <option>Fatigue</option>
                  <option>Morning sickness</option>
                  <option>Back pain</option>
                  <option>Heartburn</option>
                </select>
              </label>

              <label>
                Intensity
                <select name="intensity" value={symptomForm.intensity} onChange={handleSymptomChange}>
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </label>

              <label>
                Notes
                <textarea
                  name="note"
                  value={symptomForm.note}
                  onChange={handleSymptomChange}
                  placeholder="Add a quick note about how you feel..."
                />
              </label>

              <button type="submit" className="primary-btn">Save entry</button>
            </form>
          </div>

          <div className="entry-list">
            {entries.map((entry) => (
              <article key={entry.id} className="entry-item">
                <div>
                  <span className="entry-tag">{entry.symptom}</span>
                  <p>{entry.note}</p>
                </div>
                <div className="entry-meta">
                  <strong>{entry.intensity}</strong>
                  <span>{entry.date}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="growth-calendar-grid">
          <div className="panel growth-panel">
            <div className="panel-head">
              <h3>Baby growth</h3>
              <span>Week 24</span>
            </div>

            <div className="growth-visual">
              <div className="growth-bubble">👶</div>
              <div className="growth-meter">
                <div className="growth-fill" />
              </div>
            </div>

            <div className="growth-list">
              {growthData.map((item) => (
                <div key={item.label} className="growth-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel calendar-panel">
            <div className="panel-head">
              <h3>Appointments</h3>
              <span>Upcoming</span>
            </div>

            <div className="calendar-list">
              {orderedAppointments.map((item, index) => (
                <div key={`${item.day}-${item.date}-${index}`} className={`calendar-item ${item.tone}`}>
                  <div className="calendar-date">
                    <span>{item.day}</span>
                    <strong>{item.date}</strong>
                  </div>
                  <div className="calendar-detail">
                    <h4>{item.title}</h4>
                    <p>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className="appointment-form" onSubmit={handleAppointmentSubmit}>
              <input
                type="text"
                value={appointmentForm.title}
                onChange={(event) => {
                  setAppointmentForm((current) => ({ ...current, title: event.target.value }))
                  setAppointmentError('')
                }}
                placeholder="Appointment title"
                aria-label="Appointment title"
                required
              />
              <div className="appointment-form-row">
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(event) => {
                    setAppointmentForm((current) => ({ ...current, date: event.target.value }))
                    setAppointmentError('')
                  }}
                  aria-label="Appointment date"
                  required
                />
                <input
                  type="time"
                  value={appointmentForm.time}
                  onChange={(event) => {
                    setAppointmentForm((current) => ({ ...current, time: event.target.value }))
                    setAppointmentError('')
                  }}
                  aria-label="Appointment time"
                  required
                />
                <button type="submit" className="secondary-btn">Add</button>
              </div>
              {appointmentError && <p className="form-error" role="alert">{appointmentError}</p>}
            </form>

            <div className="appointment-questions">
              <div className="appointment-questions-head">
                <h4>Questions for your provider</h4>
                <span>{openAppointmentQuestions} open</span>
              </div>
              {appointmentQuestions.length === 0 ? (
                <p className="appointment-questions-empty">Save questions here before your next visit.</p>
              ) : (
                <ul className="appointment-question-list">
                  {appointmentQuestions.map((question) => (
                    <li key={question.id} className={question.answered ? 'appointment-question answered' : 'appointment-question'}>
                      <label>
                        <input
                          type="checkbox"
                          checked={question.answered}
                          onChange={() => setAppointmentQuestions((current) => current.map((item) => (
                            item.id === question.id ? { ...item, answered: !item.answered } : item
                          )))}
                        />
                        <span>
                          <small>{question.category}</small>
                          {question.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        className="medication-remove"
                        aria-label={`Remove question: ${question.text}`}
                        onClick={() => setAppointmentQuestions((current) => current.filter((item) => item.id !== question.id))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="appointment-question-form" onSubmit={handleAppointmentQuestionSubmit}>
                <input
                  type="text"
                  value={appointmentQuestionInput}
                  onChange={(event) => setAppointmentQuestionInput(event.target.value)}
                  placeholder="What would you like to ask?"
                  aria-label="Question for your provider"
                  required
                />
                <select
                  value={appointmentQuestionCategory}
                  onChange={(event) => setAppointmentQuestionCategory(event.target.value)}
                  aria-label="Question category"
                >
                  {appointmentQuestionCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
                <button type="submit" className="secondary-btn">Add question</button>
              </form>
            </div>
          </div>
        </section>

        <section id="care-plan" className="content-grid">
          <aside className="panel checklist-panel">
            <div className="panel-head">
              <h3>Today’s care</h3>
              <span>{careChecklist.filter((item) => item.checked).length}/{careChecklist.length} done</span>
            </div>

            <div className="care-progress">
              <div className="care-progress-bar" style={{ width: `${careProgress}%` }} />
            </div>

            <ul className="checklist-list">
              {careChecklist.map((item) => (
                <li key={item.id}>
                  <label className="checklist-item">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCareItemToggle(item.id)}
                    />
                    <span>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>

            <form className="care-form" onSubmit={handleCareChecklistSubmit}>
              <input
                type="text"
                value={careChecklistInput}
                onChange={(event) => setCareChecklistInput(event.target.value)}
                placeholder="Add a new care reminder"
                aria-label="Add care reminder"
              />
              <button type="submit" className="secondary-btn">Add</button>
            </form>
          </aside>
        </section>

        <section className="panel hospital-bag-panel">
          <div className="panel-head">
            <h3>Hospital bag</h3>
            <span>{hospitalBag.filter((item) => item.packed).length}/{hospitalBag.length} packed</span>
          </div>
          <div className="care-progress" role="progressbar" aria-label="Hospital bag packing progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={hospitalBagProgress}>
            <div className="care-progress-bar" style={{ width: `${hospitalBagProgress}%` }} />
          </div>

          <div className="hospital-bag-groups">
            {hospitalBagCategories.map((category) => {
              const categoryItems = hospitalBag.filter((item) => item.category === category)
              if (!categoryItems.length) {
                return null
              }

              return (
                <div className="hospital-bag-group" key={category}>
                  <h4>{category}</h4>
                  <ul className="hospital-bag-list">
                    {categoryItems.map((item) => (
                      <li key={item.id} className={item.packed ? 'hospital-bag-item packed' : 'hospital-bag-item'}>
                        <label>
                          <input
                            type="checkbox"
                            checked={item.packed}
                            onChange={() => setHospitalBag((current) => current.map((entry) => (
                              entry.id === item.id ? { ...entry, packed: !entry.packed } : entry
                            )))}
                          />
                          <span>{item.text}</span>
                        </label>
                        <button
                          type="button"
                          className="medication-remove"
                          aria-label={`Remove ${item.text}`}
                          onClick={() => setHospitalBag((current) => current.filter((entry) => entry.id !== item.id))}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <form className="hospital-bag-form" onSubmit={handleHospitalBagSubmit}>
            <input
              type="text"
              value={hospitalBagInput}
              onChange={(event) => setHospitalBagInput(event.target.value)}
              placeholder="Add an item"
              aria-label="Hospital bag item"
              required
            />
            <select
              value={hospitalBagCategory}
              onChange={(event) => setHospitalBagCategory(event.target.value)}
              aria-label="Item category"
            >
              {hospitalBagCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <button type="submit" className="secondary-btn">Add item</button>
          </form>
        </section>

        <section className="panel baby-names-panel">
          <div className="panel-head">
            <h3>Baby name shortlist</h3>
            <span>{babyNames.length} {babyNames.length === 1 ? 'name' : 'names'}</span>
          </div>

          <form className="baby-name-form" onSubmit={handleBabyNameSubmit}>
            <input
              type="text"
              value={babyNameForm.name}
              onChange={(event) => setBabyNameForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Add a name"
              aria-label="Baby name"
              required
            />
            <input
              type="text"
              value={babyNameForm.note}
              onChange={(event) => setBabyNameForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Optional note or meaning"
              aria-label="Note or meaning"
            />
            <button type="submit" className="secondary-btn">Add name</button>
          </form>

          {babyNames.length === 0 ? (
            <p className="baby-names-empty">Your saved names will appear here.</p>
          ) : (
            <ul className="baby-name-list">
              {[...babyNames].sort((first, second) => Number(second.favorite) - Number(first.favorite)).map((item) => (
                <li key={item.id} className="baby-name-item">
                  <div className="baby-name-copy">
                    <strong>{item.name}</strong>
                    {item.note && <p>{item.note}</p>}
                  </div>
                  <div className="baby-name-actions">
                    <button
                      type="button"
                      className={item.favorite ? 'baby-name-favorite active' : 'baby-name-favorite'}
                      aria-label={item.favorite ? `Remove ${item.name} from favorites` : `Favorite ${item.name}`}
                      aria-pressed={item.favorite}
                      onClick={() => setBabyNames((current) => current.map((name) => (
                        name.id === item.id ? { ...name, favorite: !name.favorite } : name
                      )))}
                    >
                      {item.favorite ? 'Favorite' : 'Mark favorite'}
                    </button>
                    <button
                      type="button"
                      className="medication-remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => setBabyNames((current) => current.filter((name) => name.id !== item.id))}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel birth-preferences-panel">
          <div className="panel-head">
            <h3>Birth preferences</h3>
            <span>Saved to your account</span>
          </div>
          <div className="birth-preferences-grid">
            <label>
              Support person
              <input
                type="text"
                value={birthPreferences.supportPerson}
                onChange={(event) => setBirthPreferences((current) => ({ ...current, supportPerson: event.target.value }))}
                placeholder="Name"
              />
            </label>
            <label>
              Feeding plan
              <select
                value={birthPreferences.feedingPlan}
                onChange={(event) => setBirthPreferences((current) => ({ ...current, feedingPlan: event.target.value }))}
              >
                <option>Undecided</option>
                <option>Breastfeeding</option>
                <option>Formula feeding</option>
                <option>Combination feeding</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Labor preferences
              <textarea
                value={birthPreferences.laborPreferences}
                onChange={(event) => setBirthPreferences((current) => ({ ...current, laborPreferences: event.target.value }))}
                placeholder="Comfort preferences or requests"
                rows="3"
              />
            </label>
            <label>
              Additional notes
              <textarea
                value={birthPreferences.notes}
                onChange={(event) => setBirthPreferences((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Anything you want to remember"
                rows="3"
              />
            </label>
          </div>
        </section>

        <section className="panel mood-panel">
          <div className="panel-head">
            <h3>Daily mood</h3>
            <span>Today</span>
          </div>

          <div className="mood-summary">
            <div className="mood-emoji" aria-label={`Current mood ${mood.value}`}>{mood.emoji}</div>
            <div>
              <strong>{mood.value}</strong>
              <p>{mood.text}</p>
            </div>
          </div>

          <div className="mood-options">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={mood.value === option.value ? 'mood-option active' : 'mood-option'}
                onClick={() => handleMoodChange(option.value)}
              >
                <span>{option.emoji}</span>
                {option.value}
              </button>
            ))}
          </div>
        </section>

        <section className="panel meal-panel">
          <div className="panel-head">
            <h3>Meal planner</h3>
            <span>{mealPlan.filter((meal) => meal.checked).length}/{mealPlan.length} planned</span>
          </div>

          <div className="meal-list">
            {mealPlan.map((meal) => (
              <button
                key={meal.id}
                type="button"
                className={meal.checked ? 'meal-item checked' : 'meal-item'}
                onClick={() => handleMealToggle(meal.id)}
              >
                <div>
                  <span className="meal-title">{meal.title}</span>
                  <strong>{meal.meal}</strong>
                </div>
                <span className="meal-status">{meal.checked ? 'Done' : 'Plan'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel medication-panel">
          <div className="panel-head">
            <h3>Medication & vitamins</h3>
            <span>{medications.filter((item) => item.taken).length}/{medications.length} taken</span>
          </div>

          {medications.length === 0 ? (
            <p className="medication-empty">No medication reminders for this date.</p>
          ) : (
            <ul className="medication-list">
              {medications.map((medication) => (
                <li key={medication.id} className={medication.taken ? 'medication-item taken' : 'medication-item'}>
                  <label>
                    <input
                      type="checkbox"
                      checked={medication.taken}
                      onChange={() => handleMedicationToggle(medication.id)}
                    />
                    <span className="medication-details">
                      <strong>{medication.name}</strong>
                      <small>{medication.dose} · {medication.time}</small>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="medication-remove"
                    aria-label={`Remove ${medication.name}`}
                    onClick={() => setMedications((current) => current.filter((item) => item.id !== medication.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="medication-form" onSubmit={handleMedicationSubmit}>
            <input
              type="text"
              value={medicationForm.name}
              onChange={(event) => setMedicationForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Medication or vitamin"
              aria-label="Medication or vitamin name"
              required
            />
            <input
              type="text"
              value={medicationForm.dose}
              onChange={(event) => setMedicationForm((current) => ({ ...current, dose: event.target.value }))}
              placeholder="Dose, e.g. 1 tablet"
              aria-label="Medication dose"
              required
            />
            <div className="medication-form-row">
              <input
                type="time"
                value={medicationForm.time}
                onChange={(event) => setMedicationForm((current) => ({ ...current, time: event.target.value }))}
                aria-label="Scheduled time"
                required
              />
              <button type="submit" className="secondary-btn">Add reminder</button>
            </div>
          </form>
        </section>

        <section className="nutrition-journal-grid">
          <div className="panel nutrition-panel">
            <div className="panel-head">
              <h3>Nutrition tracker</h3>
              <span>Today</span>
            </div>

            <div className="nutrition-list">
              {nutritionData.map((goal) => (
                <div key={goal.name} className="nutrition-item">
                  <div className="nutrition-row">
                    <span>{goal.name}</span>
                    <label className="nutrition-input-label">
                      <input
                        type="number"
                        min="0"
                        value={goal.value.replace(/[^0-9.]/g, '')}
                        onChange={(event) => handleNutritionChange(goal.name, `${event.target.value}${goal.value.replace(/[0-9.]/g, '')}`)}
                        aria-label={`${goal.name} amount`}
                      />
                      <strong>{goal.value.replace(/[0-9.]/g, '')}</strong>
                    </label>
                  </div>
                  <div className="nutrition-meter">
                    <div className="nutrition-fill" style={{ width: goal.progress }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="journal-section" className="panel journal-panel">
            <div className="panel-head">
              <h3>Journal</h3>
              <span>{journalData.length} notes</span>
            </div>

            <div className="journal-list">
              {journalData.map((entry, index) => (
                <article key={`${entry.title}-${index}`} className="journal-item">
                  <span className="journal-tag">{entry.tag}</span>
                  <h4>{entry.title}</h4>
                  <p>{entry.text}</p>
                </article>
              ))}
            </div>

            <form className="journal-form" onSubmit={handleJournalSubmit}>
              <textarea
                value={journalForm.text}
                onChange={(event) => {
                  setJournalForm((current) => ({ ...current, text: event.target.value }))
                  setJournalError('')
                }}
                placeholder="Write a quick reflection..."
                aria-label="Journal note"
                required
              />
              <div className="journal-form-row">
                <select
                  value={journalForm.tag}
                  onChange={(event) => setJournalForm((current) => ({ ...current, tag: event.target.value }))}
                  aria-label="Journal mood"
                >
                  <option>Today</option>
                  <option>Positive</option>
                  <option>Balanced</option>
                  <option>Restful</option>
                </select>
                <button type="submit" className="secondary-btn">Add note</button>
              </div>
              {journalError && <p className="form-error" role="alert">{journalError}</p>}
            </form>
          </div>
        </section>

        <section className="wellness-grid">
          <div className="panel hydration-panel">
            <div className="panel-head">
              <h3>Hydration</h3>
              <span>{waterCount}/{hydrationGoal} glasses</span>
            </div>
            <div className="hydration-summary">
              <strong>{Math.round((waterCount / hydrationGoal) * 100)}%</strong>
              <p>Keep sipping throughout the day.</p>
            </div>
            <div className="glass-row" aria-label="Daily water glasses">
              {Array.from({ length: hydrationGoal }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index < waterCount ? 'water-glass filled' : 'water-glass'}
                  onClick={() => setWaterCount(index + 1)}
                  aria-label={`Log ${index + 1} glasses of water`}
                >
                  {index < waterCount ? '●' : '○'}
                </button>
              ))}
            </div>
          </div>

          <div className="panel movement-panel">
            <div className="panel-head">
              <h3>Baby kicks</h3>
              <span>Today</span>
            </div>
            <div className="kick-summary">
              <div>
                <strong>{kickCount}</strong>
                <span>movements logged</span>
              </div>
              <button type="button" className="primary-btn kick-button" onClick={() => setKickCount((count) => count + 1)}>
                + Log a kick
              </button>
            </div>
            <div className="kick-dots" aria-label={`${kickCount} kicks logged`}>
              {Array.from({ length: Math.min(kickCount, 12) }, (_, index) => <span key={index} />)}
            </div>
            <div className="movement-session">
              <div className="movement-session-head">
                <strong>Timed session</strong>
                {activeMovementSession && <span>{movementSessionDuration} · {activeMovementSession.count} movements</span>}
              </div>
              {activeMovementSession ? (
                <div className="movement-session-controls">
                  <button type="button" className="movement-tap-button" onClick={handleMovementLog}>Log movement</button>
                  <button
                    type="button"
                    className="movement-finish-button"
                    onClick={handleMovementSessionFinish}
                    disabled={activeMovementSession.count === 0}
                  >
                    Finish session
                  </button>
                </div>
              ) : (
                <button type="button" className="movement-start-button" disabled={Boolean(activeContraction)} onClick={handleMovementSessionStart}>
                  Start session
                </button>
              )}
              {movementSessions.length > 0 && (
                <ul className="movement-session-list">
                  {movementSessions.slice(0, 3).map((session) => (
                    <li key={session.id}>
                      <span>{session.time}</span>
                      <strong>{session.count} movements</strong>
                      <small>{formatDuration(session.duration)}</small>
                      <button
                        type="button"
                        aria-label={`Remove movement session at ${session.time}`}
                        onClick={() => setMovementSessions((current) => current.filter((item) => item.id !== session.id))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="panel contraction-panel">
            <div className="panel-head">
              <h3>Contraction timer</h3>
              <span>{contractionHistory.length} logged</span>
            </div>
            <div className="contraction-clock" aria-live="polite">{contractionDuration}</div>
            <button
              type="button"
              className={activeContraction ? 'contraction-button active' : 'contraction-button'}
              disabled={!activeContraction && Boolean(activeMovementSession)}
              onClick={activeContraction ? handleContractionStop : handleContractionStart}
            >
              {activeContraction ? 'Stop contraction' : 'Start contraction'}
            </button>
            <ul className="contraction-list">
              {contractionHistory.slice(0, 4).map((contraction) => (
                <li key={contraction.id}>
                  <span>{contraction.time}</span>
                  <strong>{formatDuration(contraction.duration)}</strong>
                  <small>{contraction.interval === null ? 'First' : `${formatDuration(contraction.interval)} apart`}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel sleep-panel">
            <div className="panel-head">
              <h3>Sleep log</h3>
              <span>Last night</span>
            </div>
            <div className="sleep-summary">
              <strong>{sleepHours}</strong>
              <span>Restful sleep</span>
            </div>
            <form className="sleep-form" onSubmit={handleSleepSubmit}>
              <input name="sleep" type="text" placeholder="e.g. 8h 10m" aria-label="Sleep duration" />
              <button type="submit" className="secondary-btn">Update</button>
            </form>
          </div>
        </section>

        <section className="panel timeline-panel">
          <div className="panel-head">
            <h3>Milestone timeline</h3>
          </div>
          <div className="timeline">
            {timeline.map((item) => (
              <div key={item.week} className="timeline-item">
                <div className="dot" />
                <div className="timeline-body">
                  <p>{item.week}</p>
                  <h4>{item.title}</h4>
                </div>
                <span className={`status ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel tips-panel">
          <div className="panel-head">
            <h3>Wellness notes</h3>
            <span>Today</span>
          </div>
          <ul>
            {wellnessTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App
