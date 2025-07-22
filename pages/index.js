import { useState } from 'react'

export default function Home() {
  const [step, setStep] = useState('passcode')
  const [passcodeInput, setPasscodeInput] = useState('')
  const [passcodeError, setPasscodeError] = useState(false)

  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const PASSCODE = process.env.NEXT_PUBLIC_PASSCODE || '2428'

  const checkPasscode = () => {
    if (passcodeInput === PASSCODE) {
      setStep('form')
      setPasscodeError(false)
    } else {
      setPasscodeError(true)
    }
  }

  const submitForm = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    if (!website || !email) {
      setError('Please enter both website and email.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website, email }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Error generating grade.')
      }
    } catch (e) {
      setError('Server error. Please try again later.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif', padding: '0 1rem' }}>
      {step === 'passcode' && (
        <div>
          <h1>Welcome to GraderBot</h1>
          <p>Please enter the passcode to continue:</p>
          <input
            type="password"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            style={{ padding: '0.5rem', fontSize: '1rem', width: '100%', marginBottom: '0.5rem' }}
          />
          <button onClick={checkPasscode} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>Submit</button>
          {passcodeError && <p style={{ color: 'red' }}>Incorrect passcode.</p>}
        </div>
      )}

      {step === 'form' && (
        <div>
          <h1>GraderBot - Restaurant Website Grader</h1>
          <p>Enter your restaurant website URL and your email to get your AI-powered grade.</p>

          <label>Restaurant Website URL:</label><br />
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            style={{ padding: '0.5rem', fontSize: '1rem', width: '100%', marginBottom: '1rem' }}
          />

          <label>Your Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: '0.5rem', fontSize: '1rem', width: '100%', marginBottom: '1rem' }}
          />

          <button onClick={submitForm} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Grading...' : 'Get Your Grade'}
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {result && (
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h2>Your Restaurant Website Grade: {result.grade}</h2>
              <p><strong>Summary:</strong> {result.summary}</p>
              <p><strong>Suggestions:</strong></p>
              <ul>
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}