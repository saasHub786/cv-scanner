import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ScoreRing from '../components/ScoreRing';
import { FiArrowLeft, FiDownload, FiMessageSquare, FiCheckCircle, FiXCircle, FiAlertTriangle, FiStar, FiTarget, FiBookOpen, FiUser, FiBriefcase, FiClock, FiSend, FiFile } from 'react-icons/fi';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    if (id) loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    try {
      const { data } = await api.getCandidate(id);
      if (data.success) {
        setCandidate(data.candidate);
        // If questions already generated
        if (data.candidate.questions_generated && data.candidate.interview_questions?.length > 0) {
          setQuestions(data.candidate.interview_questions);
        }
      } else {
        toast.error('Candidate not found');
        navigate('/history');
      }
    } catch (error) {
      toast.error('Failed to load candidate results');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const { data } = await api.generateQuestions(id);
      if (data.success) {
        setQuestions(data.questions);
        setShowQuestions(true);
        const msg = data.creditsRemaining !== undefined
          ? `Questions generated! ${data.creditsRemaining} credits remaining`
          : 'Interview questions generated!';
        toast.success(msg);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to generate questions';
      toast.error(msg);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const getRecommendationClass = (rec) => {
    switch (rec) {
      case 'Shortlist': return 'bg-green-100 text-green-800 border-green-300';
      case 'Consider': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Reject': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analysis..." />
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="page-container max-w-5xl">
      {/* Back button */}
      <Link to="/history" className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-6">
        <FiArrowLeft />
        <span>Back to History</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{candidate.candidate_name}</h1>
            <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getRecommendationClass(candidate.recommendation)}`}>
              {candidate.recommendation}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-1">
              <FiBriefcase />
              <span>{candidate.job_title || 'N/A'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiClock />
              <span>Scanned {formatDate(candidate.created_at)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiFile />
              <span>{candidate.filename}</span>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {!showQuestions && !questionsLoading && (
            <button onClick={handleGenerateQuestions} className="btn-primary flex items-center space-x-2">
              <FiMessageSquare />
              <span>Generate Interview Questions</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Section */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Overall Match</h3>
            <ScoreRing score={candidate.match_score} size={140} strokeWidth={12} />

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Skills Match</span>
                <span className={`text-sm font-bold ${getScoreColor(candidate.skills_match_score)}`}>
                  {candidate.skills_match_score}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Experience</span>
                <span className={`text-sm font-bold ${getScoreColor(candidate.experience_score)}`}>
                  {candidate.experience_score}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Education</span>
                <span className={`text-sm font-bold ${getScoreColor(candidate.education_score)}`}>
                  {candidate.education_score}%
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm font-medium text-gray-700">Overall Fit</span>
                <span className={`text-sm font-bold ${getScoreColor(candidate.overall_fit_score)}`}>
                  {candidate.overall_fit_score}%
                </span>
              </div>
            </div>

            {candidate.years_of_experience && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Years of Experience</p>
                <p className="text-2xl font-bold text-gray-900">{candidate.years_of_experience}</p>
              </div>
            )}

            {candidate.education_match && (
              <div className="mt-2">
                <span className={`badge ${
                  candidate.education_match === 'Yes' ? 'badge-green' :
                  candidate.education_match === 'Partial' ? 'badge-yellow' : 'badge-red'
                }`}>
                  Education: {candidate.education_match}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Why Best Fit */}
          {candidate.why_best_fit && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FiStar className="text-yellow-500" />
                <span>Why Best Fit</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{candidate.why_best_fit}</p>
            </div>
          )}

          {/* Strengths */}
          {candidate.strengths && (
            <div className="card border-l-4 border-green-400">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FiCheckCircle className="text-green-500" />
                <span>Strengths</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{candidate.strengths}</p>
            </div>
          )}

          {/* Weaknesses */}
          {candidate.weaknesses && (
            <div className="card border-l-4 border-orange-400">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FiAlertTriangle className="text-orange-500" />
                <span>Areas for Improvement</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{candidate.weaknesses}</p>
            </div>
          )}

          {/* Red Flags */}
          {candidate.red_flags && candidate.red_flags !== 'None detected' && (
            <div className="card border-l-4 border-red-400 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center space-x-2">
                <FiXCircle className="text-red-500" />
                <span>Red Flags</span>
              </h3>
              <p className="text-red-700 leading-relaxed">{candidate.red_flags}</p>
            </div>
          )}

          {/* Experience Summary */}
          {candidate.experience_summary && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FiTarget className="text-primary-500" />
                <span>Experience Summary</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{candidate.experience_summary}</p>
            </div>
          )}

          {/* Education Details */}
          {candidate.education_details && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <FiBookOpen className="text-purple-500" />
                <span>Education</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">{candidate.education_details}</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Matched Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.matched_skills?.length > 0 ? (
              candidate.matched_skills.map((skill, i) => (
                <span key={i} className="badge-green">{skill}</span>
              ))
            ) : (
              <p className="text-sm text-gray-400">No matched skills</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Partial Match Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.partial_match_skills?.length > 0 ? (
              candidate.partial_match_skills.map((skill, i) => (
                <span key={i} className="badge-yellow">{skill}</span>
              ))
            ) : (
              <p className="text-sm text-gray-400">None</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.missing_skills?.length > 0 ? (
              candidate.missing_skills.map((skill, i) => (
                <span key={i} className="badge-red">{skill}</span>
              ))
            ) : (
              <p className="text-sm text-gray-400">No missing skills</p>
            )}
          </div>
        </div>
      </div>

      {/* Extra Skills */}
      {candidate.extra_skills?.length > 0 && (
        <div className="mt-6 card">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Extra / Bonus Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.extra_skills.map((skill, i) => (
              <span key={i} className="badge-blue">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Interview Questions Section */}
      {(showQuestions || candidate.questions_generated) && questions && questions.length > 0 ? (
        <div className="mt-6 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FiMessageSquare className="text-primary-600" />
              <span>Interview Questions</span>
            </h3>
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="btn-secondary text-sm"
            >
              {showQuestions ? 'Hide' : 'Show'}
            </button>
          </div>

          {showQuestions && (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge-blue text-xs">{q.category}</span>
                    <span className="text-xs text-gray-400">Q{q.id}</span>
                  </div>
                  <p className="text-gray-900 font-medium">{q.question}</p>
                  {q.what_to_listen_for && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">What to listen for: </span>
                      {q.what_to_listen_for}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 card text-center py-8">
          {questionsLoading ? (
            <div>
              <LoadingSpinner size="md" />
              <p className="text-gray-500 mt-2">Generating interview questions...</p>
            </div>
          ) : (
            <div>
              <FiMessageSquare className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-gray-500">Generate personalized interview questions for this candidate</p>
              <button onClick={handleGenerateQuestions} className="btn-primary mt-4 flex items-center space-x-2 mx-auto">
                <FiSend />
                <span>Generate Questions</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
