import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { User, Lock } from 'lucide-react';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwords.new_password !== passwords.confirm) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await userAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });

      setPasswords({ current_password: '', new_password: '', confirm: '' });
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error changing password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </div>
      <div className="lg:hidden">
        <Sidebar />
      </div>

      {/* Background Radial Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" />
        <div className="absolute inset-0" style={{
          background: `radial-gradient(600px at 20% 20%, rgba(59, 130, 246, 0.05), transparent 40%),
                      radial-gradient(600px at 80% 80%, rgba(139, 92, 246, 0.05), transparent 40%)`
        }} />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
        <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Profile Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and preferences</p>
            <br></br>
          </div>

          {/* Profile Info Card */}
          <section className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-xl shadow-black/20">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Profile Information
            </h3>

            {/* Avatar + Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">{user?.username}</h4>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-4 text-sm">
              {[
                ['Username', user?.username],
                ['Email', user?.email],
                ['Role', user?.role]
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400">{label}</p>
                  <p className="text-white font-medium capitalize">{value}</p>
                </div>
              ))}
            </div>
          </section>


        </div>
      </main>
    </div>
  );
}
