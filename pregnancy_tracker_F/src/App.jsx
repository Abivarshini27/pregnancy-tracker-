import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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

const checklist = [
  'Drink 8+ glasses of water',
  'Walk for 20 minutes today',
  'Take prenatal vitamin',
  'Track baby kicks before bed',
]

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
  const [sleepHours, setSleepHours] = useState('7h 42m')
  const [nutritionData, setNutritionData] = useState(nutritionGoals)
  const [journalData, setJournalData] = useState(journalEntries)
  const [journalForm, setJournalForm] = useState({ text: '', tag: 'Today' })
  const [journalError, setJournalError] = useState('')
  const [appointmentData, setAppointmentData] = useState(appointments)
  const [appointmentForm, setAppointmentForm] = useState({ title: '', date: '', time: '' })
  const [appointmentError, setAppointmentError] = useState('')
  const [pregnancyProfile, setPregnancyProfile] = useState({ week: '24', dueDate: '2027-04-18' })
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [isRestoringSession, setIsRestoringSession] = useState(true)
  const daysLeft = getDaysUntil(pregnancyProfile.dueDate)
  const babySize = getBabySize(Number(pregnancyProfile.week) || 1)
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

        setFormData((current) => ({ ...current, email: user.email || current.email }))
        if (Array.isArray(trackerData.entries)) {
          setEntries(trackerData.entries)
        }
        if (typeof trackerData.waterCount === 'number') {
          setWaterCount(trackerData.waterCount)
        }
        if (typeof trackerData.kickCount === 'number') {
          setKickCount(trackerData.kickCount)
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

      if (Array.isArray(trackerData.entries)) {
        setEntries(trackerData.entries)
      }
      if (typeof trackerData.waterCount === 'number') {
        setWaterCount(trackerData.waterCount)
      }
      if (typeof trackerData.kickCount === 'number') {
        setKickCount(trackerData.kickCount)
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
    if (!isAuthenticated || !isDataLoaded) {
      return
    }

    const saveTrackerData = async () => {
      try {
        setSyncError('')
        await request('/tracker', {
          method: 'PUT',
          body: JSON.stringify({ entries, waterCount, kickCount, sleepHours, nutrition: nutritionData, journal: journalData, appointments: appointmentData, profile: pregnancyProfile }),
        })
      } catch (error) {
        setSyncError('Your latest tracker update could not be saved.')
      }
    }

    saveTrackerData()
  }, [entries, waterCount, kickCount, sleepHours, nutritionData, journalData, appointmentData, pregnancyProfile, isAuthenticated, isDataLoaded])

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
          </div>
        </section>

        <section id="care-plan" className="content-grid">
          <aside className="panel checklist-panel">
            <div className="panel-head">
              <h3>Today’s care</h3>
              <span>4 items</span>
            </div>
            <ul>
              {checklist.map((item) => (
                <li key={item}>
                  <input type="checkbox" defaultChecked={item.includes('water') || item.includes('vitamin')} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>

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
