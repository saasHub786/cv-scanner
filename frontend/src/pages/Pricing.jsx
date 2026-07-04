import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiCheck, FiStar, FiShoppingCart, FiTrendingUp, FiCreditCard } from 'react-icons/fi';

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([
    { id: 1, name: 'Free', credits: 5, price: 0, badge: 'Free', is_popular: 0 },
    { id: 2, name: 'Starter', credits: 50, price: 5, badge: 'Popular', is_popular: 1 },
    { id: 3, name: 'Premium', credits: 200, price: 20, badge: 'Best Value', is_popular: 0 },
    { id: 4, name: 'Enterprise', credits: 500, price: 50, badge: 'Pro', is_popular: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [customCredits, setCustomCredits] = useState(100);
  const [customTotal, setCustomTotal] = useState(10.00);
  const [purchasingCustom, setPurchasingCustom] = useState(false);

  useEffect(() => {
    api.getCreditPlans().then(({ data }) => {
      if (data.success) setPlans(data.plans);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (planId) => {
    if (!isAuthenticated) { navigate('/register'); return; }
    setPurchasing(planId);
    try {
      const { data } = await api.purchasePlan(planId);
      if (data.success) {
        toast.success(data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const handleCustomPurchase = async () => {
    if (!isAuthenticated) { navigate('/register'); return; }
    setPurchasingCustom(true);
    try {
      const { data } = await api.customPurchase(customCredits);
      if (data.success) toast.success(data.message);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasingCustom(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-blue-100 text-lg">1 CV scan = 1 credit</p>
          <p className="text-blue-200 text-sm mt-2">Credits never expire. Use them anytime.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-2xl shadow-lg p-6 relative ${plan.is_popular ? 'ring-2 ring-primary-500 scale-105' : ''}`}>
              {!!plan.is_popular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <FiStar className="text-yellow-300" />
                  <span>{plan.badge}</span>
                </div>
              ) : null}
              {plan.badge && !plan.is_popular && plan.badge !== 'Popular' ? (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium text-white ${
                  plan.badge === 'Best Value' ? 'bg-green-500' : 'bg-purple-500'
                }`}>
                  {plan.badge}
                </div>
              ) : null}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/once</span>}
                </div>
                <p className="text-3xl font-bold text-primary-600 mb-4">{plan.credits}</p>
                <p className="text-sm text-gray-500 mb-2">CV Scans</p>
                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-left">
                  <p className="flex items-center space-x-2"><FiCheck className="text-green-500 flex-shrink-0" /><span>{plan.credits} CV scans</span></p>
                  <p className="flex items-center space-x-2"><FiCheck className="text-green-500 flex-shrink-0" /><span>AI-powered analysis</span></p>
                  <p className="flex items-center space-x-2"><FiCheck className="text-green-500 flex-shrink-0" /><span>Bulk upload support</span></p>
                  <p className="flex items-center space-x-2"><FiCheck className="text-green-500 flex-shrink-0" /><span>Interview questions</span></p>
                </div>
                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={purchasing === plan.id}
                  className={`w-full mt-6 py-3 rounded-xl font-semibold transition ${
                    plan.price === 0
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'btn-primary'
                  }`}
                >
                  {purchasing === plan.id ? (
                    <><LoadingSpinner size="sm" /><span className="ml-2">Processing...</span></>
                  ) : plan.price === 0 ? (
                    'Get Free'
                  ) : (
                    `Buy $${plan.price}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Credits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <FiTrendingUp className="text-primary-600 text-3xl mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-900">Custom Credits</h3>
            <p className="text-sm text-gray-500">Buy any amount. $0.10 per credit.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Credits</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={customCredits}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setCustomCredits(val);
                  setCustomTotal(val * 0.10);
                }}
                className="input-field text-center text-2xl font-bold"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-3xl font-bold text-primary-600">${customTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={handleCustomPurchase}
              disabled={purchasingCustom || customCredits < 1}
              className="btn-primary w-full py-3 flex items-center justify-center space-x-2"
            >
              {purchasingCustom ? (
                <><LoadingSpinner size="sm" /><span>Processing...</span></>
              ) : (
                <><FiCreditCard /><span>Buy {customCredits} Credits</span></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
