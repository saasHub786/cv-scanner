import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiFileText, FiBriefcase, FiMapPin, FiCalendar } from 'react-icons/fi';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', department: '', location: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const { data } = await api.getJobs({ limit: 50 });
      if (data.success) setJobs(data.jobs);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setForm({ title: '', description: '', department: '', location: '' });
    setShowModal(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      department: job.department || '',
      location: job.location || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast.error('Title and description are required.');
      return;
    }
    if (form.description.length < 50) {
      toast.error('Description must be at least 50 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingJob) {
        const { data } = await api.updateJob(editingJob.id, form);
        if (data.success) toast.success('Job updated!');
      } else {
        const { data } = await api.createJob(form);
        if (data.success) toast.success('Job created!');
      }
      setShowModal(false);
      loadJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (job) => {
    try {
      const { data } = await api.toggleJob(job.id);
      if (data.success) {
        toast.success(`Job ${job.is_active ? 'paused' : 'activated'}`);
        loadJobs();
      }
    } catch (error) {
      toast.error('Failed to toggle job');
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This action cannot be undone.`)) return;
    try {
      const { data } = await api.deleteJob(job.id);
      if (data.success) {
        toast.success('Job deleted');
        loadJobs();
      }
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="text-gray-500 mt-1">Create and manage positions for CV matching</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
          <FiPlus />
          <span>New Job</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <FiFileText className="text-gray-300 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs yet</h3>
          <p className="text-gray-500 mb-4">Create your first job description to start scanning CVs</p>
          <button onClick={openCreateModal} className="btn-primary">
            Create Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className={`card hover:shadow-md transition-shadow ${!job.is_active ? 'opacity-75' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiBriefcase className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    {job.department && (
                      <p className="text-xs text-gray-500">{job.department}</p>
                    )}
                  </div>
                </div>
                <span className={`badge ${job.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {job.description.substring(0, 200)}...
              </p>

              <div className="flex items-center space-x-3 text-xs text-gray-400 mb-4">
                {job.location && (
                  <span className="flex items-center space-x-1">
                    <FiMapPin />
                    <span>{job.location}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <FiCalendar />
                  <span>{formatDate(job.created_at)}</span>
                </span>
                <span className="font-medium">{job.candidate_count || 0} candidates</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(job)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 className="text-gray-400 hover:text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleToggle(job)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={job.is_active ? 'Pause' : 'Activate'}
                  >
                    {job.is_active
                      ? <FiToggleRight className="text-green-500" />
                      : <FiToggleLeft className="text-gray-400" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <Link
                  to={`/scan?jobId=${job.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Scan for this job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingJob ? 'Edit Job' : 'Create New Job'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Software Engineer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g., Engineering"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g., Remote / New York"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description * <span className="text-gray-400">(min 50 characters)</span>
                  </label>
                  <textarea
                    rows={10}
                    placeholder="Paste the full job description including requirements, responsibilities, qualifications..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field resize-y"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.description.length} characters</p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2">
                    {saving && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{editingJob ? 'Update' : 'Create'} Job</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
