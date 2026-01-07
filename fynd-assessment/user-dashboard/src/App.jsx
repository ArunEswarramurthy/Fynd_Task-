import { useState, useEffect } from 'react'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
    const [name, setName] = useState('')
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [review, setReview] = useState('')
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState(null)
    const [error, setError] = useState(null)

    // Typing animation
    const [displayedResponse, setDisplayedResponse] = useState('')

    useEffect(() => {
        if (response) {
            let i = 0
            const timer = setInterval(() => {
                if (i < response.length) {
                    setDisplayedResponse(prev => response.substring(0, i + 1))
                    i++
                } else {
                    clearInterval(timer)
                }
            }, 15) // Faster typing
            return () => clearInterval(timer)
        }
    }, [response])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Please select a rating to continue')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating, reviewText: review })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to submit review')

            setResponse(data.data.userResponse)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const styles = {
        container: {
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '680px',
            margin: '0 auto',
            textAlign: 'left'
        },
        heroText: {
            textAlign: 'center',
            marginBottom: '56px',
        },
        h1: {
            fontSize: '3.5rem',
            fontWeight: '700',
            color: '#1C1B1F',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            lineHeight: '1.1'
        },
        subtitle: {
            fontSize: '1.25rem',
            color: '#49454F',
            fontWeight: '400'
        },
        starsContainer: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            margin: '32px 0 48px',
            cursor: 'pointer'
        },
        textAreaContainer: {
            background: '#F3F4F6',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '8px',
            border: '2px solid transparent',
            transition: 'all 0.2s',
            ':focus-within': {
                background: '#FFFFFF',
                borderColor: '#6750A4'
            }
        },
        textArea: {
            width: '100%',
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            color: '#1C1B1F',
            minHeight: '120px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'Outfit, sans-serif'
        },
        label: {
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#49454F',
            marginBottom: '8px',
            display: 'block',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
        }
    }

    // Icons
    const StarIcon = ({ filled }) => (
        <svg width="48" height="48" viewBox="0 0 24 24" fill={filled ? "#FFD700" : "#E2E2E2"} xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.2s', transform: filled ? 'scale(1.1)' : 'scale(1)', filter: filled ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))' : 'none' }}>
            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z" />
        </svg>
    )

    if (response) {
        return (
            <div style={styles.container} className="animate-fade-in">
                <div className="card" style={{ textAlign: 'center', padding: '64px 40px' }}>
                    <div style={{ width: '80px', height: '80px', background: '#EADDFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12L3.41 13.41L9 16.17L21 4.17L19.59 2.75L9 16.17Z" fill="#21005D" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '24px', color: '#1C1B1F' }}>Thank You!</h2>

                    <div style={{ background: '#F5F5FA', borderRadius: '20px', padding: '32px', textAlign: 'left', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.5rem' }}>✨</span>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#6750A4' }}>AI Response</h3>
                        </div>
                        <p style={{ fontSize: '1.125rem', lineHeight: '1.7', color: '#49454F' }}>
                            {displayedResponse}
                        </p>
                    </div>

                    <button className="btn-primary" onClick={() => {
                        setResponse(null)
                        setRating(0)
                        setReview('')
                        setName('')
                        setDisplayedResponse('')
                    }} style={{ width: 'auto', padding: '0 48px', margin: '0 auto' }}>
                        Submit Another Review
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={styles.container} className="animate-fade-in">
            <div style={styles.heroText}>
                <h1 style={styles.h1}>Feedback</h1>
                <p style={styles.subtitle}>Help us improve directly with AI-powered feedback.</p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={styles.label}>Full Name (Optional)</label>
                        <div className="text-area-container" style={{ padding: '8px 16px' }}>
                            <input
                                type="text"
                                style={{ ...styles.textArea, minHeight: 'auto', padding: '8px 0' }}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <label style={styles.label}>Rate your experience</label>
                        <div style={styles.starsContainer} onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onClick={() => setRating(star)}
                                    style={{ transform: hoverRating >= star || rating >= star ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                >
                                    <StarIcon filled={star <= (hoverRating || rating)} />
                                </div>
                            ))}
                        </div>
                        {rating > 0 && <div className="animate-slide-up" style={{ color: '#6750A4', fontWeight: '600', marginTop: '-24px' }}>
                            {['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][rating - 1]}
                        </div>}
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={styles.label}>Your Thoughts (Optional)</label>
                        <div className="text-area-container">
                            <textarea
                                style={styles.textArea}
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="What did you like? What can we do better?"
                                maxLength={2000}
                            />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#79747E' }}>
                            {review.length} / 2000
                        </div>
                    </div>

                    {error && (
                        <div className="animate-fade-in" style={{ padding: '16px', background: '#FFD8E4', color: '#31111D', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#B3261E"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                        {loading ? (
                            <>
                                <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                Processing with AI...
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </>
                        ) : (
                            <>Submit Feedback <span style={{ fontSize: '1.2em' }}>→</span></>
                        )}
                    </button>

                </form>
            </div>

            <div style={{ textAlign: 'center', marginTop: '48px', opacity: 0.5, fontSize: '0.875rem' }}>
                <p>Powered by Qubid AI • Secure & Private</p>
            </div>
        </div>
    )
}

export default App
