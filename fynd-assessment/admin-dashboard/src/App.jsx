
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, Legend } from 'recharts'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
    const [reviews, setReviews] = useState([])
    const [filteredReviews, setFilteredReviews] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'settings', 'users'

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reviews`)
            const data = await res.json()
            if (data.success) {
                setReviews(data.data.reviews)
                setAnalytics(data.data.analytics)
                setLoading(false)
            }
        } catch (err) {
            console.error('Error fetching reviews:', err)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
        const interval = setInterval(fetchReviews, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let result = reviews

        // Rating Filter
        if (filter !== 'all') {
            result = result.filter(r => r.rating === parseInt(filter))
        }

        // Search Filter
        if (searchTerm) {
            const lowerReq = searchTerm.toLowerCase()
            result = result.filter(r =>
                (r.reviewText && r.reviewText.toLowerCase().includes(lowerReq)) ||
                (r.adminSummary && r.adminSummary.toLowerCase().includes(lowerReq))
            )
        }

        setFilteredReviews(result)
    }, [filter, searchTerm, reviews])

    const deleteReview = async (id) => {
        if (!confirm('Are you sure you want to delete this review?')) return
        try {
            const res = await fetch(`${API_URL}/api/reviews/${id}`, { method: 'DELETE' })
            if (res.ok) fetchReviews()
        } catch (err) {
            console.error('Failed to delete:', err)
        }
    }

    const handleExport = () => {
        if (reviews.length === 0) return alert('No data to export')

        const headers = ['ID', 'Rating', 'Review Text', 'AI Summary', 'Recommended Action', 'Date']
        const csvContent = [
            headers.join(','),
            ...reviews.map(r => [
                r.id,
                r.rating,
                `"${(r.reviewText || '').replace(/"/g, '""')}"`,
                `"${(r.adminSummary || '').replace(/"/g, '""')}"`,
                `"${(r.recommendedActions || '').replace(/"/g, '""')}"`,
                new Date(r.createdAt).toISOString()
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `fynd_reviews_export_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
    }

    const chartData = analytics ? [
        { rating: '1 Star', count: analytics.ratingDistribution['1'] || 0, color: '#EF4444' },
        { rating: '2 Star', count: analytics.ratingDistribution['2'] || 0, color: '#F97316' },
        { rating: '3 Star', count: analytics.ratingDistribution['3'] || 0, color: '#EAB308' },
        { rating: '4 Star', count: analytics.ratingDistribution['4'] || 0, color: '#84CC16' },
        { rating: '5 Star', count: analytics.ratingDistribution['5'] || 0, color: '#22C55E' },
    ] : []

    // Helper to parse actions
    const parseActions = (text) => {
        if (!text) return []
        // Split by numbered lists like "1. ", "2. "
        return text.split(/\d+\.\s+/).filter(a => a.trim().length > 0)
    }

    // Render Helpers
    const renderDashboard = () => (
        <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-1px', color: '#0F172A' }}>Overview</h1>
                    <p style={{ color: '#64748B', margin: 0 }}>Welcome back, here is your performance report.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '10px 20px', borderRadius: '24px', border: '1px solid #E2E8F0', width: '240px', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    />
                    <button
                        onClick={handleExport}
                        style={{
                            background: '#0F172A', color: 'white', border: 'none', padding: '12px 24px',
                            borderRadius: '24px', fontWeight: '600', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span>📥</span> Export CSV
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div className="stat-card">
                    <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Reviews</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', color: '#0F172A' }}>{analytics?.totalReviews || 0}</div>
                    <span className="badge badge-blue">All time</span>
                </div>

                <div className="stat-card">
                    <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Rating</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1.5px', color: '#0F172A' }}>{analytics?.averageRating?.toFixed(1) || 0}</div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                        {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= Math.round(analytics?.averageRating || 0) ? '#F59E0B' : '#E2E8F0', fontSize: '1.2rem' }}>★</span>)}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="stat-card" style={{ padding: '16px', gridColumn: 'span 1' }}>
                    <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '600', marginBottom: '12px' }}>Rating Distribution</div>
                    <div style={{ height: '120px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="stat-card" style={{ padding: '16px', gridColumn: 'span 1' }}>
                    <div style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0' }}>Sentiment Share</div>
                    <div style={{ height: '140px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="count"
                                    nameKey="rating"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={4}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#64748B', marginRight: '8px' }}>Filter:</span>
                {['all', '5', '4', '3', '2', '1'].map(f => (
                    <button
                        key={f}
                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All Reviews' : `${f} Stars`}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="table-container">
                {filteredReviews.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔍</div>
                        No reviews found matching your search.
                    </div>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review.id} className="review-row animate-in" style={{ transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '48px', height: '48px',
                                        background: review.rating >= 4 ? '#ECFDF5' : review.rating >= 3 ? '#FEF9C3' : '#FEF2F2',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '700', fontSize: '1.2rem',
                                        color: review.rating >= 4 ? '#059669' : review.rating >= 3 ? '#D97706' : '#DC2626',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        {review.rating}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '1.05rem', marginBottom: '4px' }}>{review.name || 'Anonymous User'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span>📅 {new Date(review.createdAt).toLocaleDateString()}</span>
                                            <span style={{ width: '4px', height: '4px', background: '#CBD5E1', borderRadius: '50%' }}></span>
                                            <span>🕒 {new Date(review.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon btn-delete" onClick={() => deleteReview(review.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <p style={{ color: '#334155', lineHeight: '1.7', margin: '0 0 24px 64px', fontSize: '1.05rem', fontStyle: review.reviewText ? 'normal' : 'italic' }}>
                                {review.reviewText || <span style={{ color: '#94A3B8' }}>No written feedback provided.</span>}
                            </p>

                            <div style={{ marginLeft: '64px', background: 'linear-gradient(to bottom right, #F8FAFC, #F1F5F9)', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '1rem' }}>📌</span> AI Summary
                                        </div>
                                        <div style={{
                                            fontSize: '1rem', color: '#0F172A', lineHeight: '1.7',
                                            background: 'white', padding: '20px', borderRadius: '12px',
                                            border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap'
                                        }}>
                                            {review.adminSummary}
                                        </div>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '1rem' }}>💡</span> Recommended Actions
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                            {parseActions(review.recommendedActions).length > 0 ? (
                                                parseActions(review.recommendedActions).map((action, idx) => (
                                                    <div key={idx} style={{
                                                        background: '#F0F9FF', border: '1px solid #BAE6FD',
                                                        padding: '10px 16px', borderRadius: '24px',
                                                        color: '#0369A1', fontSize: '0.95rem', fontWeight: '500',
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <span style={{ color: '#0EA5E9', fontWeight: 'bold' }}>{idx + 1}.</span> {action}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '0.95rem', color: '#0F172A' }}>{review.recommendedActions}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    )

    const renderUsers = () => (
        <div className="animate-in">
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 32px 0', letterSpacing: '-1px', color: '#0F172A' }}>Team Members</h1>
            <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '20px', fontSize: '0.875rem', color: '#64748B' }}>User</th>
                            <th style={{ padding: '20px', fontSize: '0.875rem', color: '#64748B' }}>Role</th>
                            <th style={{ padding: '20px', fontSize: '0.875rem', color: '#64748B' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', fontWeight: '600' }}>Admin User</td>
                            <td style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}> <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>Super Admin</span> </td>
                            <td style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}><span style={{ color: '#166534', fontWeight: '600' }}>Active</span></td>
                        </tr>
                        <tr>
                            <td style={{ padding: '20px', fontWeight: '600' }}>Support System</td>
                            <td style={{ padding: '20px' }}> <span style={{ background: '#F3E8FF', color: '#6B21A8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>Bot</span> </td>
                            <td style={{ padding: '20px' }}><span style={{ color: '#166534', fontWeight: '600' }}>Active</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderSettings = () => (
        <div className="animate-in">
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 32px 0', letterSpacing: '-1px', color: '#0F172A' }}>Settings</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 16px 0' }}>Appearance</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Dark Mode</div>
                            <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Enable dark theme for the dashboard.</div>
                        </div>
                        <button style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer' }}>Coming Soon</button>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#DC2626' }}>Danger Zone</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Reset Database</div>
                            <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Delete all reviews and analytics logic.</div>
                        </div>
                        <button style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: '600', cursor: 'pointer' }} onClick={() => alert('This is disabled in demo mode.')}>Reset Data</button>
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading && !analytics) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748B' }}>Loading Dashboard...</div>

    return (
        <div className="dashboard-container" style={{ display: 'block', padding: '0', background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Top Navigation */}
            <nav style={{
                background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 40px', height: '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>F</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px', color: '#0F172A', margin: 0 }}>Fynd Admin</h2>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                </div>
            </nav>

            {/* Main Content */}
            <div className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'settings' && renderSettings()}
            </div>
        </div>
    )
}

export default App

