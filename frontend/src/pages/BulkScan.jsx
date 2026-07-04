import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUpload, FiFile, FiTrash2, FiCheckCircle, FiAlertCircle, FiBriefcase, FiSearch, FiUsers, FiChevronDown, FiChevronUp, FiMessageSquare, FiX, FiStar } from 'react-icons/fi';

export default function BulkScan() {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1: upload, 2: configure, 3: scanning, 4: results
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [candidateNames, setCandidateNames] = useState({});
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);

  // Step 2: shortlist config
  const [form, setForm] = useState({
    jobId: '',
    jobTitle: '',
    jobDescription: '',
    useExistingJob: true,
    shortlistCount: 3
  });

  // Expanded cards
  const [expandedCards, setExpandedCards] = useState({});
  // Questions state per candidate
  const [questions, setQuestions] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState({});

  useEffect(() => { loadJobs(); }, []);

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

  const handleFilesSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024;

    const valid = selectedFiles.filter(f => {
      if (!allowedTypes.includes(f.type)) { toast.error(`${f.name}: Only PDF/DOCX allowed`); return false; }
      if (f.size > maxSize) { toast.error(`${f.name}: Max 5MB`); return false; }
      return true;
    });

    if (files.length + valid.length > 1000) {
      toast.error('Maximum 1000 files allowed');
      return;
    }

    setFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNameChange = (index, name) => {
    setCandidateNames(prev => ({ ...prev, [index]: name }));
  };

  const startScan = async () => {
    if (files.length === 0) { toast.error('Upload at least 1 CV'); return; }

    const desc = form.useExistingJob ? null : form.jobDescription;
    if (!desc && !form.jobId) { toast.error('Select a job or paste a description'); return; }
    if (!form.useExistingJob && (!form.jobDescription || form.jobDescription.length < 50)) {
      toast.error('Job description must be at least 50 characters'); return;
    }

    setScanning(true);
    setStep(3);
    setScanProgress({ current: 0, total: files.length });

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('cvs', f));
      if (form.useExistingJob && form.jobId) formData.append('jobId', form.jobId);
      else {
        formData.append('jobTitle', form.jobTitle || 'Position');
        formData.append('jobDescription', form.jobDescription);
      }
      // Send candidate names
      const names = files.map((_, i) => candidateNames[i] || '');
      formData.append('candidateNames', JSON.stringify(names));

      const { data } = await api.bulkScanCVs(formData);

      setScanProgress({ current: data.totalScanned, total: data.totalScanned });

      if (data.success) {
        setResults(data.results);
        setStep(4);
        toast.success(`Scanned ${data.successfulScans} CVs! ${data.failedScans > 0 ? `${data.failedScans} failed.` : ''}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Bulk scan failed';
      toast.error(message);
      setStep(2);
    } finally {
      setScanning(false);
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
      case 'Shortlist': return 'bg-green-100 text-green-800 border border-green-300';
      case 'Consider': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Reject': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const toggleCard = (index) => {
    setExpandedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleGenerateQuestions = async (result, index) => {
    if (!result.candidateId) {
      toast.error('Candidate not saved. Cannot generate questions.');
      return;
    }
    setQuestionsLoading(prev => ({ ...prev, [index]: true }));
    try {
      const { data } = await api.generateQuestions(result.candidateId);
      if (data.success) {
        setQuestions(prev => ({ ...prev, [index]: data.questions }));
        toast.success('Questions generated!');
      }
    } catch (error) {
      toast.error('Failed to generate questions');
    } finally {
      setQuestionsLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk CV Scanner</h1>
        <p className="text-gray-500 mt-1">Upload multiple CVs, scan them all at once, and pick your top candidates</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-4 mb-8">
        {[
          { num: 1, label: 'Upload CVs' },
          { num: 2, label: 'Configure' },
          { num: 3, label: 'Scanning' },
          { num: 4, label: 'Results' }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s.num ? <FiCheckCircle /> : s.num}
            </div>
            <span className={`ml-2 text-sm ${step >= s.num ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {i < 3 && <div className={`h-0.5 w-12 mx-2 ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CVs (up to 50)</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
            >
              <FiUpload className="text-5xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Drop your files here or click to browse</p>
              <p className="text-sm text-gray-400 mt-1">Supports PDF and DOCX (max 5MB each, up to 1000 files)</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" onChange={handleFilesSelect} className="hidden" />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <FiFile className="text-primary-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-red-100 rounded text-red-500">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                <button onClick={() => setStep(2)} className="btn-primary">Next: Configure</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Configure */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Candidate Names */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FiUsers />
              <span>Candidate Names ({files.length} CVs)</span>
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 w-8">{i + 1}.</span>
                  <span className="text-sm text-gray-600 flex-1 truncate">{f.name}</span>
                  <input
                    type="text"
                    placeholder="Candidate name (optional)"
                    value={candidateNames[i] || ''}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    className="input-field text-sm py-1.5 w-64"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Job Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <FiBriefcase className="inline mr-2" />
              Job Description
            </h2>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button onClick={() => setForm({ ...form, useExistingJob: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.useExistingJob ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  Select Existing Job
                </button>
                <button onClick={() => setForm({ ...form, useExistingJob: false, jobId: '' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !form.useExistingJob ? 'bg-primary-100 text-primary-700 border border-primary-300' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                  New Job Description
                </button>
              </div>

              {form.useExistingJob ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select a Job</label>
                  {jobsLoading ? <LoadingSpinner size="sm" /> : jobs.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-sm">No jobs yet.</p>
                      <button onClick={() => setForm({ ...form, useExistingJob: false })}
                        className="text-primary-600 text-sm font-medium hover:underline mt-1">Create one now</button>
                    </div>
                  ) : (
                    <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} className="input-field">
                      <option value="">-- Select a job --</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title} {job.department ? `(${job.department})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                    <input type="text" placeholder="e.g., Senior Software Engineer" value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="input-field max-w-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                    <textarea rows={8} placeholder="Paste the full job description..."
                      value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                      className="input-field resize-y" />
                  </div>
                </div>
              )}

              {/* Shortlist Count */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many candidates do you want to shortlist?
                </label>
                <div className="flex items-center space-x-3">
                  <input type="number" min={1} max={files.length} value={form.shortlistCount}
                    onChange={(e) => setForm({ ...form, shortlistCount: Math.min(files.length, Math.max(1, parseInt(e.target.value) || 1)) })}
                    className="input-field w-24 text-center" />
                  <span className="text-sm text-gray-500">out of {files.length} candidates</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">The top {form.shortlistCount} highest-scoring candidates will be highlighted</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button onClick={startScan} disabled={scanning} className="btn-primary flex-1 py-3 text-lg flex items-center justify-center space-x-2">
              <FiSearch />
              <span>Scan All {files.length} CVs</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Scanning */}
      {step === 3 && (
        <div className="card text-center py-16">
          <LoadingSpinner size="xl" />
          <h3 className="text-xl font-semibold text-gray-900 mt-6">Scanning CVs...</h3>
          <p className="text-gray-500 mt-2">Analyzing {scanProgress.total} CVs against the job requirements</p>
          <div className="max-w-md mx-auto mt-8">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }} />
            </div>
            <p className="text-sm text-gray-500 mt-2">{scanProgress.current} / {scanProgress.total} complete</p>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="h-2 w-2 bg-primary-500 rounded-full animate-pulse" />
            <span>Processing... each CV takes ~5-10 seconds</span>
          </div>
        </div>
      )}

      {/* STEP 4: Results */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-gray-900">{results.length}</p>
              <p className="text-sm text-gray-500">Total Scanned</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{results.filter(r => r.success && r.matchScore >= 80).length}</p>
              <p className="text-sm text-gray-500">Strong Matches (80%+)</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-yellow-600">{results.filter(r => r.success && r.matchScore >= 60 && r.matchScore < 80).length}</p>
              <p className="text-sm text-gray-500">Consider (60-79%)</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{form.shortlistCount}</p>
              <p className="text-sm text-gray-500">Top Shortlist Target</p>
            </div>
          </div>

          {/* Credits info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiStar className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Credits Used: {results.filter(r => r.success).length} scan(s)</span>
            </div>
            <Link to="/pricing" className="text-sm font-medium text-yellow-700 hover:text-yellow-800 underline">
              Buy more credits →
            </Link>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Ranked Candidates
              <span className="text-sm font-normal text-gray-500 ml-2">(sorted by match score)</span>
            </h2>

            {results.map((result, index) => {
              const isTop = index < form.shortlistCount && result.success;
              const isExpanded = expandedCards[index];
              const hasQuestions = questions[index];

              return (
                <div key={index} className={`card border-2 transition-all ${isTop ? 'border-green-400 bg-green-50/30' : 'border-gray-200'}`}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCard(index)}>
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      {/* Rank */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isTop ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>#{index + 1}</div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold truncate ${result.success ? 'text-gray-900' : 'text-red-600'}`}>
                            {result.candidateName || result.filename}
                          </h3>
                          {result.success && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRecommendationBadge(result.recommendation)}`}>
                              {result.recommendation}
                            </span>
                          )}
                          {isTop && result.success && (
                            <span className="badge-green text-xs">TOP {form.shortlistCount}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{result.filename}</p>
                      </div>
                    </div>

                    {/* Score + Expand */}
                    <div className="flex items-center space-x-4">
                      {result.success ? (
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(result.matchScore)}`}>{result.matchScore}%</p>
                          <div className="flex space-x-1">
                            {result.matchedSkills?.slice(0, 3).map((s, i) => (
                              <span key={i} className="badge-green text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm text-red-600">Failed</p>
                        </div>
                      )}
                      {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && result.success && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Why Best Fit */}
                      {result.whyBestFit && (
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 mb-1">✅ Why Best Fit</h4>
                          <p className="text-sm text-gray-700">{result.whyBestFit}</p>
                        </div>
                      )}

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.strengths && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="text-sm font-semibold text-green-700 mb-1">💪 Strengths</h4>
                            <p className="text-sm text-gray-700">{result.strengths}</p>
                          </div>
                        )}
                        {result.weaknesses && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <h4 className="text-sm font-semibold text-orange-700 mb-1">⚠️ Cons / Weaknesses</h4>
                            <p className="text-sm text-gray-700">{result.weaknesses}</p>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.matchedSkills?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Matched Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {result.matchedSkills.map((s, i) => (
                                <span key={i} className="badge-green text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.missingSkills?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 mb-2">Missing Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {result.missingSkills.map((s, i) => (
                                <span key={i} className="badge-red text-xs">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interview Questions Button */}
                      {!hasQuestions && (
                        <button
                          onClick={() => handleGenerateQuestions(result, index)}
                          disabled={questionsLoading[index]}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          {questionsLoading[index] ? (
                            <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Generating...</span></>
                          ) : (
                            <><FiMessageSquare /><span>Generate Interview Questions</span></>
                          )}
                        </button>
                      )}

                      {/* Interview Questions Display */}
                      {hasQuestions && hasQuestions.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-blue-800 flex items-center space-x-2">
                              <FiMessageSquare />
                              <span>Interview Questions</span>
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {hasQuestions.map((q) => (
                              <div key={q.id} className="p-3 bg-white rounded-lg border border-blue-100">
                                <div className="flex items-start justify-between mb-1">
                                  <span className="badge-blue text-xs">{q.category}</span>
                                  <span className="text-xs text-gray-400">Q{q.id}</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{q.question}</p>
                                {q.what_to_listen_for && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <span className="font-medium">Listen for: </span>{q.what_to_listen_for}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Failed message */}
                  {isExpanded && !result.success && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-red-600">Error: {result.error}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scan Again */}
          <div className="text-center">
            <button onClick={() => { setStep(1); setFiles([]); setResults([]); setQuestions({}); setExpandedCards({}); }}
              className="btn-primary">Scan Another Batch</button>
          </div>
        </div>
      )}
    </div>
  );
}
