/**
 * Animated circular score ring
 * Shows match percentage with color coding
 */
export default function ScoreRing({ score = 0, size = 100, strokeWidth = 8, label = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  const getColor = (val) => {
    if (val >= 80) return '#22c55e'; // Green
    if (val >= 60) return '#eab308'; // Yellow
    if (val >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getBgColor = (val) => {
    if (val >= 80) return 'text-green-600';
    if (val >= 60) return 'text-yellow-600';
    if (val >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const color = getColor(score);
  const textColor = getBgColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${textColor}`}>
            {Math.round(score)}%
          </span>
        </div>
      </div>
      {label && <span className="mt-1 text-xs text-gray-500 font-medium">{label}</span>}
    </div>
  );
}
