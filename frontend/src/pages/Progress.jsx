import { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { TrendingUp, Award, Target, CheckCircle } from 'lucide-react';

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await studentAPI.getProgress();
      setProgress(response.data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (!progress || progress.total_worksheets === 0) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">My Progress</h1>
            <div className="card text-center py-12">
              <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No progress data yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Complete some worksheets to see your progress
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8">My Progress</h1>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {progress.average_score.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {progress.total_worksheets}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">worksheets</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {((progress.submissions.filter(s => s.score >= 70).length / progress.total_worksheets) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Recent Submissions
            </h3>

            <div className="space-y-3">
              {progress.submissions.slice(0, 10).map((submission, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      submission.score >= 70 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <CheckCircle className={`w-6 h-6 ${
                        submission.score >= 70 ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        Worksheet #{submission.worksheet_id}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(submission.submitted_at).toLocaleDateString()} at{' '}
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      submission.score >= 70 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {submission.score.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {submission.score >= 90 ? 'Excellent!' :
                       submission.score >= 70 ? 'Good' :
                       submission.score >= 50 ? 'Fair' : 'Needs Improvement'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
                💡 Insights
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• Your average score is {progress.average_score > 70 ? 'above' : 'below'} the passing threshold</li>
                <li>• You've completed {progress.total_worksheets} worksheet{progress.total_worksheets !== 1 ? 's' : ''}</li>
                <li>• Keep practicing to improve your scores!</li>
              </ul>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <h3 className="text-lg font-semibold mb-4 text-green-900 dark:text-green-100">
                🎯 Goals
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Complete all assigned worksheets
                </li>
                <li className="flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-600" />
                  Maintain an 80%+ average
                </li>
                <li className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-yellow-600" />
                  Review incorrect answers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}