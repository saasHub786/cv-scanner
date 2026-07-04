import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUpload, FiFile, FiX, FiTrash2, FiCheckCircle, FiAlertCircle, FiBriefcase, FiSearch } from 'react-icons/fi';

export default function ScanCV() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1: setup, 2: scanning, 3: done
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [form, setForm] = useState({
    candidateName: '',
    jobId: '',
    jobTitle: '',
    jobDescription: '',
    useExistingJob: true,
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data } = await api.getActiveJobs();
      if (data.success) setJobs(data.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFileError('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError('Only PDF and DOCX files are accepted.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5MB.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    // Validate
    if (!file) {
      toast.error('Please select a CV file to scan.');
      return;
    }

    const desc = form.useExistingJob ? null : form.jobDescription;
    if (!desc && !form.jobId) {
      toast.error('Please provide a job description or select an existing job.');
      return;
    }

    if (!form.useExistingJob && (!form.jobDescription || form.jobDescription.length < 50)) {
      toast.error('Job description must be at least 50 characters.');
      return;
    }

    setScanning(true);
    setStep(2);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('candidateName', form.candidateName || 'Unknown Candidate');

      if (form.useExistingJob && form.jobId) {
        formData.append('jobId', form.jobId);
      } else {
        formData.append('jobTitle', form.jobTitle || 'Position');
        formData.append('jobDescription', form.jobDescription);
      }

      const { data } = await api.scanCV(formData);

      clearInterval(progressInterval);
      setScanProgress(100);

      if (data.success) {
        setResult(data.candidate);
        setStep(3);
        toast.success('CV scanned successfully!');
        setTimeout(() => {
          navigate(`/results/${data.candidate.id}`, { replace: true });
        }, 1500);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setScanProgress(0);
      setStep(1);
      const message = error.response?.data?.message || 'Scan failed. Please try again.';
      toast.error(message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan CV</h1>
        <p className="text-gray-500 mt-1">Upload a resume and match it against a job description</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <FiCheckCircle /> : s}
            </div>
            <span className={`ml-2 text-sm ${step >= s ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Setup' : s === 2 ? 'Scanning' : 'Results'}
            </span>
            {s < 3 && <div className={`h-0.5 w-12 mx-2 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="space-y-6">
          {/* File Upload */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CV / Resume</h2>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <FiUpload className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-gray-400 mt-1">Supports PDF and DOCX (max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiFile className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={removeFile} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                  <FiTrash2 className="text-red-500" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="mt-3 flex items-center space-x-2 text-red-600 text-sm">
                <FiAlertCircle />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Candidate Name */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Name (optional)</label>
            <input
              type="text"
              placeholder="e.g., John Smith"
              value={form.candidateName}
              onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
              className="input-field max-w-md"
            />
          </div>

          {/* Job Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <FiBriefcase className="inline mr-2" />
              Job Description
            </h2>

            <div className="space-y-4">
              {/* Existing job vs new job toggle */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setForm({ ...form, useExistingJob: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.useExistingJob
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Select Existing Job
                </button>
                <button
                  onClick={() => setForm({ ...form, useExistingJob: false, jobId: '' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !form.useExistingJob
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  New Job Description
                </button>
              </div>

              {form.useExistingJob ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select a Job</label>
                  {jobsLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">No jobs yet.</p>
                      <button
                        onClick={() => setForm({ ...form, useExistingJob: false })}
                        className="text-primary-600 text-sm font-medium hover:underline mt-1"
                      >
                        Create one now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.jobId}
                      onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                      className="input-field"
                    >
                      <option value="">-- Select a job --</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} {job.department ? `(${job.department})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Software Engineer"
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      className="input-field max-w-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description * <span className="text-gray-400">(min 50 characters)</span>
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Paste the full job description here including responsibilities, requirements, qualifications, and nice-to-haves..."
                      value={form.jobDescription}
                      onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                      className="input-field resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={scanning || !file}
            className="btn-primary w-full py-3 text-lg flex items-center justify-center space-x-2"
          >
            <FiSearch />
            <span>Scan CV</span>
          </button>
        </div>
      )}

      {/* Step 2: Scanning */}
      {step === 2 && (
        <div className="card text-center py-16">
          <LoadingSpinner size="xl" />
          <h3 className="text-xl font-semibold text-gray-900 mt-6">Analyzing CV...</h3>
          <p className="text-gray-500 mt-2">Our AI is scanning the resume and matching against the job requirements</p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-8">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300 progress-animate"
                style={{ width: `${Math.min(scanProgress, 95)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(scanProgress)}% complete</p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-500">Parsing CV</p>
            </div>
            <div className="text-center">
              <div className="h-2 w-2 bg-primary-500 rounded-full animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-500">AI Analysis</p>
            </div>
            <div className="text-center">
              <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse mx-auto mb-2" />
              <p className="text-xs text-gray-500">Generating Report</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && result && (
        <div className="card text-center py-12">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-green-600 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Scan Complete!</h3>
          <p className="text-gray-500 mt-2">Redirecting to results page...</p>
          <div className="mt-6">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
