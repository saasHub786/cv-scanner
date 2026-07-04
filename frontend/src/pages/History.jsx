import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSearch, FiFilter, FiClock, FiBriefcase, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi';

export default function History() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    recommendation: '',
    minScore: '',
    search: ''
  });
  const limit = 12;

  useEffect(() => {
    loadCandidates();
  }, [page]);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.getCandidates(params);
      if (data.success) {
        setCandidates(data.candidates);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCandidates();
  };

  const totalPages = Math.ceil(total / limit);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
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

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan History</h1>
        <p className="text-gray-500 mt-1">View all your previously scanned candidates</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or job title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-10"
              />
            </div>
          </form>

          {/* Recommendation filter */}
          <select
            value={filters.recommendation}
            onChange={(e) => handleFilterChange('recommendation', e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All Ratings</option>
            <option value="Shortlist">Shortlist</option>
            <option value="Consider">Consider</option>
            <option value="Reject">Reject</option>
          </select>

          {/* Min score filter */}
          <select
            value={filters.minScore}
            onChange={(e) => handleFilterChange('minScore', e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All Scores</option>
            <option value="80">80%+</option>
            <option value="60">60%+</option>
            <option value="40">40%+</option>
          </select>

          <button onClick={loadCandidates} className="btn-primary">
            <FiFilter className="inline mr-1" />
            Apply
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="card text-center py-16">
          <FiClock className="text-gray-300 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No scans found</h3>
          <p className="text-gray-500 mb-4">
            {total === 0 ? "You haven't scanned any CVs yet." : 'No results match your filters.'}
          </p>
          <Link to="/scan" className="btn-primary">
            Scan Your First CV
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/results/${candidate.id}`}
                className="card hover:shadow-md transition-all hover:border-primary-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiUser className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{candidate.candidate_name}</p>
                      <p className="text-xs text-gray-500 truncate">{candidate.job_title || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(candidate.match_score)}`}>
                    {candidate.match_score}%
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-3">
                  <FiBriefcase className="flex-shrink-0" />
                  <span className="truncate">{candidate.filename}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={getRecommendationBadge(candidate.recommendation)}>
                    {candidate.recommendation}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(candidate.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
              >
                <FiChevronLeft />
                <span>Previous</span>
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
              >
                <span>Next</span>
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
