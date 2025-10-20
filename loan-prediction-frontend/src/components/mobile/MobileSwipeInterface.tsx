import React, { useState, useRef } from 'react';
import { SwipeCard, LoanApplication } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface MobileSwipeInterfaceProps {
  applications: LoanApplication[];
  onApprove?: (applicationId: string) => void;
  onDeny?: (applicationId: string) => void;
  onRequestInfo?: (applicationId: string) => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export const MobileSwipeInterface: React.FC<MobileSwipeInterfaceProps> = ({
  applications,
  onApprove,
  onDeny,
  onRequestInfo,
  currentIndex = 0,
  onIndexChange,
}) => {
  const [localIndex, setLocalIndex] = useState(0);
  const [swipeStart, setSwipeStart] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const index = currentIndex ?? localIndex;
  const currentApplication = applications[index];

  if (!currentApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-3xl">🎉</p>
          <p className="text-2xl font-bold text-slate-900 mt-4">All Applications Processed!</p>
          <p className="text-slate-600 mt-2">Great work today!</p>
        </div>
      </div>
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = () => {
    // Optional: Add visual feedback during swipe
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setSwiping(false);
    const swipeEnd = e.changedTouches[0].clientX;
    const diff = swipeStart - swipeEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left - deny
        handleDeny();
      } else {
        // Swiped right - approve
        handleApprove();
      }
    }
  };

  const handleApprove = () => {
    onApprove?.(currentApplication.id);
    moveToNext();
  };

  const handleDeny = () => {
    onDeny?.(currentApplication.id);
    moveToNext();
  };

  const handleRequestInfo = () => {
    onRequestInfo?.(currentApplication.id);
    moveToNext();
  };

  const moveToNext = () => {
    const newIndex = index + 1;
    if (currentIndex !== undefined && onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setLocalIndex(newIndex);
    }
  };

  const moveToPrevious = () => {
    const newIndex = Math.max(0, index - 1);
    if (currentIndex !== undefined && onIndexChange) {
      onIndexChange(newIndex);
    } else {
      setLocalIndex(newIndex);
    }
  };

  const getRiskColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      case 'critical':
        return 'bg-red-700';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskEmoji = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      case 'critical':
        return '⛔';
      default:
        return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Quick Decisions</h1>
        <p className="text-slate-600 mt-2">
          {index + 1} of {applications.length} applications
        </p>
        <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / applications.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 flex items-center justify-center px-4 transition-transform ${
          swiping ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Applicant Name */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {currentApplication.applicant.firstName} {currentApplication.applicant.lastName}
            </h2>
            <p className="text-slate-600 mt-2">
              Loan ID: {currentApplication.id}
            </p>
          </div>

          {/* Loan Amount */}
          <div className="text-center bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 font-semibold">LOAN AMOUNT</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {formatCurrency(currentApplication.loanDetails.loanAmount)}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              for {currentApplication.loanDetails.purpose.replace('_', ' ')}
            </p>
          </div>

          {/* Risk Assessment */}
          <div className={`text-center ${getRiskColor(currentApplication.aiAnalysis.riskCategory)} text-white rounded-lg p-4`}>
            <p className="text-sm font-semibold opacity-90">RISK LEVEL</p>
            <p className="text-4xl font-bold mt-2">
              {getRiskEmoji(currentApplication.aiAnalysis.riskCategory)} {currentApplication.aiAnalysis.riskScore}%
            </p>
            <p className="text-sm mt-2 opacity-90">
              {currentApplication.aiAnalysis.riskCategory.toUpperCase()}
            </p>
          </div>

          {/* AI Recommendation */}
          <div className="bg-slate-100 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600 font-semibold">AI RECOMMENDATION</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {currentApplication.aiAnalysis.recommendation}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Confidence: {currentApplication.aiAnalysis.confidence}%
            </p>
          </div>

          {/* Quick Facts */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 p-3 rounded">
              <p className="text-slate-600 font-semibold">Credit Score</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {currentApplication.financials.creditScore}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <p className="text-slate-600 font-semibold">DTI</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {currentApplication.financials.debtToIncomeRatio.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <p className="text-slate-600 font-semibold">Income</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                ${(currentApplication.financials.annualIncome / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <p className="text-slate-600 font-semibold">Employment</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {currentApplication.applicant.employmentLength} yrs
              </p>
            </div>
          </div>

          {/* Swipe Instructions */}
          <div className="text-center text-sm text-slate-600 py-4">
            <p>👈 Swipe LEFT to DENY</p>
            <p>or</p>
            <p>Swipe RIGHT to APPROVE 👉</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 max-w-md mx-auto w-full">
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            className="flex-1 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 font-bold text-lg transition"
          >
            ❌ DENY
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 font-bold text-lg transition"
          >
            ✅ APPROVE
          </button>
        </div>
        <button
          onClick={handleRequestInfo}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 font-semibold transition"
        >
          📋 REQUEST INFO
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6 max-w-md mx-auto w-full">
        <button
          onClick={moveToPrevious}
          disabled={index === 0}
          className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          ← Previous
        </button>
        <button
          onClick={moveToNext}
          disabled={index >= applications.length - 1}
          className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default MobileSwipeInterface;
