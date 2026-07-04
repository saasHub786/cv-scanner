import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { FiSearch, FiUsers, FiLayers, FiMessageSquare, FiTrendingUp, FiShield, FiZap, FiCheck, FiStar, FiArrowRight, FiMenu, FiX } from 'react-icons/fi';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([
    { id: 1, name: 'Free', credits: 5, price: 0, badge: 'Free', is_popular: 0 },
    { id: 2, name: 'Starter', credits: 50, price: 5, badge: 'Popular', is_popular: 1 },
    { id: 3, name: 'Premium', credits: 200, price: 20, badge: 'Best Value', is_popular: 0 },
    { id: 4, name: 'Enterprise', credits: 500, price: 50, badge: 'Pro', is_popular: 0 },
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.getCreditPlans().then(({ data }) => {
      if (data.success && data.plans?.length >= 4) setPlans(data.plans);
    }).catch(() => {});
  }, []);

  const features = [
    { icon: FiZap, title: 'AI-Powered Analysis', desc: 'Gemini AI scans resumes against job descriptions for precise matching.' },
    { icon: FiLayers, title: 'Bulk Upload Up to 1000 CVs', desc: 'Upload hundreds of resumes at once and rank them by match score.' },
    { icon: FiMessageSquare, title: 'Smart Interview Questions', desc: 'AI generates 8 tailored interview questions per candidate.' },
    { icon: FiTrendingUp, title: 'Detailed Scoring', desc: 'Skills match, experience relevance, education fit & overall score.' },
    { icon: FiShield, title: 'Enterprise Security', desc: 'JWT auth, SQL injection protection, encrypted data.' },
    { icon: FiUsers, title: 'Team Ready', desc: 'Multi-user support with admin panel for team management.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 rounded-lg p-1.5"><FiSearch className="text-white text-lg" /></div>
              <span className="text-xl font-bold text-gray-900">CV<span className="text-primary-600">Scanner</span></span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
                  <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
                </>
              )}
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-600">Features</a>
            <a href="#pricing" className="block text-sm text-gray-600">Pricing</a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-sm block text-center">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="block text-sm text-gray-600">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm block text-center">Get Started Free</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <FiZap className="text-green-600" />
            <span>AI-Powered Resume Screening</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Scan & Rank<br />
            <span className="text-primary-600">Hundreds of CVs</span> in Minutes
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Upload up to 1000 resumes, paste a job description, and let AI find your best candidates.
            Score, rank, compare & generate interview questions — all in one place.
          </p>
          <div className="flex items-center justify-center space-x-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">Go to Dashboard <FiArrowRight className="inline ml-2" /></Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-3">Start Free <FiArrowRight className="inline ml-2" /></Link>
                <a href="#pricing" className="btn-secondary text-lg px-8 py-3">View Pricing</a>
              </>
            )}
          </div>
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-400">
            <span>✨ No credit card</span>
            <span>🔒 Secure</span>
            <span>⚡ 5 free scans</span>
          </div>
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '1000+', label: 'CVs Per Batch' },
            { num: '5 Sec', label: 'Per CV Analysis' },
            { num: '99.9%', label: 'Accuracy Rate' },
            { num: '$0', label: 'Starting Price' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-bold text-gray-900">{s.num}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500 mb-12">Three simple steps to find your ideal candidates</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload CVs', desc: 'Upload up to 1000 CVs (PDF/DOCX). Add candidate names or let AI detect them.' },
              { step: '2', title: 'Paste Job Description', desc: 'Select an existing job or paste a new one. AI analyzes every skill requirement.' },
              { step: '3', title: 'Get Ranked Results', desc: 'AI scores each candidate, ranks them, and generates interview questions.' },
            ].map((s, i) => (
              <div key={i} className="card text-center">
                <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary-600">{s.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-500">Everything you need to streamline your hiring process</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <f.icon className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-500">1 CV scan = 1 credit</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className={`card relative ${plan.is_popular ? 'border-2 border-primary-400 ring-2 ring-primary-100' : ''}`}>
                {!!plan.is_popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-0.5 rounded-full text-xs font-medium">
                    {plan.badge}
                  </div>
                ) : null}
                {plan.badge && plan.badge !== 'Popular' && !plan.is_popular ? (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full text-xs font-medium ${
                    plan.badge === 'Best Value' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {plan.badge}
                  </div>
                ) : null}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="my-4">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm">/one-time</span>}
                  </div>
                  <p className="text-2xl font-bold text-primary-600 mb-4">{plan.credits} Credits</p>
                  <div className="text-sm text-gray-500 mb-6">
                    <p>📄 {plan.credits} CV scans</p>
                  </div>
                  {plan.price === 0 ? (
                    isAuthenticated ? (
                      <Link to="/dashboard" className="btn-primary w-full">Get Started</Link>
                    ) : (
                      <Link to="/register" className="btn-primary w-full">Get Started Free</Link>
                    )
                  ) : (
                    <button onClick={() => {
                      if (!isAuthenticated) { navigate('/register'); return; }
                      api.purchasePlan(plan.id).then(({ data }) => {
                        if (data.success) {
                          alert(`✅ ${data.message}\nBalance: ${data.balance} credits`);
                          window.location.reload();
                        }
                      }).catch(e => alert(e.response?.data?.message || 'Purchase failed'));
                    }} className="btn-primary w-full">Buy Now</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Credits */}
          <div className="mt-8 card text-center max-w-lg mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">Need More? Custom Credits</h3>
            <p className="text-sm text-gray-500 mb-4">$0.10 per credit. Buy any amount.</p>
            {isAuthenticated ? (
              <Link to="/pricing" className="btn-primary">Custom Purchase</Link>
            ) : (
              <Link to="/register" className="btn-primary">Register to Buy</Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-blue-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-blue-100 mb-8 text-lg">Start with 5 free scans. No credit card required.</p>
          {isAuthenticated ? (
            <Link to="/bulk-scan" className="inline-flex items-center space-x-2 bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
              <span>Start Scanning</span>
              <FiArrowRight />
            </Link>
          ) : (
            <Link to="/register" className="inline-flex items-center space-x-2 bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
              <span>Get Started Free</span>
              <FiArrowRight />
            </Link>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FiSearch className="text-primary-400" />
            <span className="text-lg font-bold text-white">CVScanner</span>
          </div>
          <p className="text-sm">AI-Powered Resume Screening for Modern HR Teams</p>
          <div className="mt-4 text-xs">
            © 2026 CVScanner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
