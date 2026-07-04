import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFileText, FiUsers, FiTrendingUp, FiArrowRight, FiClock, FiAward, FiActivity, FiLayers } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, candRes, jobsRes] = await Promise.all([
        api.getCandidateStats(),
        api.getCandidates({ limit: 5 }),
        api.getJobs({ limit: 5 }),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (candRes.data.success) setRecentCandidates(candRes.data.candidates);
      if (jobsRes.data.success) setRecentJobs(jobsRes.data.jobs);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'Shortlist': return 'badge-green';
      case 'Consider': return 'badge-yellow';
      case 'Reject': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your recruitment overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiSearch className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalScans || 0}</p>
          <p className="text-sm text-gray-500">Total Scans</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUsers className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.shortlisted || 0}</p>
          <p className="text-sm text-gray-500">Shortlisted</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.avgScore || 0}%</p>
          <p className="text-sm text-gray-500">Avg Match Score</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiAward className="text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.topScore || 0}%</p>
          <p className="text-sm text-gray-500">Top Score</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/scan" className="card hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiSearch className="text-blue-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Scan Single CV</h3>
                <p className="text-sm text-gray-500">Upload and analyze one resume</p>
              </div>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        <Link to="/bulk-scan" className="card hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiLayers className="text-purple-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bulk Scan CVs</h3>
                <p className="text-sm text-gray-500">Upload up to 50 CVs, rank & shortlist top candidates</p>
              </div>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        <Link to="/jobs" className="card hover:shadow-md transition-shadow group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiFileText className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Jobs</h3>
                <p className="text-sm text-gray-500">Create and manage job descriptions</p>
              </div>
            </div>
            <FiArrowRight className="text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <FiClock className="text-gray-400" />
              <span>Recent Scans</span>
            </h3>
            <Link to="/history" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          {recentCandidates.length === 0 ? (
            <div className="text-center py-8">
              <FiActivity className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No scans yet</p>
              <Link to="/scan" className="text-primary-600 text-sm font-medium hover:underline">
                Scan your first CV
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  to={`/results/${candidate.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {candidate.candidate_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {candidate.job_title || 'No job title'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 ml-3">
                    <span className={`text-sm font-bold ${getScoreColor(candidate.match_score)}`}>
                      {candidate.match_score}%
                    </span>
                    <span className={getRecommendationBadge(candidate.recommendation)}>
                      {candidate.recommendation}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <FiFileText className="text-gray-400" />
              <span>Recent Jobs</span>
            </h3>
            <Link to="/jobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <FiFileText className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No jobs created yet</p>
              <Link to="/jobs" className="text-primary-600 text-sm font-medium hover:underline">
                Create your first job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">
                      {job.department || 'General'} · {job.candidate_count || 0} candidates
                    </p>
                  </div>
                  <span className={`badge ${job.is_active ? 'badge-green' : 'badge-gray'} ml-3`}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
