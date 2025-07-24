import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { User, LogIn, Eye, EyeOff, Lock } from 'lucide-react';
import axios from 'axios';
import { API_PATHS } from '@/routes/paths';

const Login = () => {
  const [staffNo, setStaffNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(API_PATHS.auth.login, {
        staffNo,
        password,
      });

      const { token, role, userId } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('role', role);

      switch (role) {
        case 'admin': navigate('/admin', { replace: true }); break;
        case 'subadmin': navigate('/subadmin', { replace: true }); break;
        case 'user': navigate('/user', { replace: true }); break;
        default: setError('Invalid role');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleReset = async () => {
    setError('');

    if (!staffNo || !newPass || !confirmPass) {
      setError('All fields are required');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passwords must match');
      return;
    }

    try {
      await axios.post(API_PATHS.auth.resetPassword, {
        staffNo,
        newPassword: newPass,
        confirmPassword: confirmPass,
      });

      alert('Password reset successfully. Please login again.');
      setShowResetForm(false);
      setNewPass('');
      setConfirmPass('');
      setStaffNo('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-purple-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-pink-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        {showResetForm ? (
          <Card className="w-full p-6 shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-xl animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-white bg-white">
                  <img src="/images/600.png" alt="Auth Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reset Password
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Staff Number</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    value={staffNo}
                    onChange={(e) => setStaffNo(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Enter your staff number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <Button
                onClick={handleReset}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Reset Password
              </Button>

              <button 
                type="button" 
                onClick={() => {
                  setShowResetForm(false);
                  setError('');
                }}
                className="w-full text-sm text-center text-blue-600 hover:underline py-2"
              >
                Back to Login
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full p-6 shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-xl animate-fade-in">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-white bg-white">
<div className="mb-6">  {/* Reduced bottom margin */}
  <img 
    src="/images/600.png" 
    alt="Auth Logo" 
    className="mx-auto w-50 h-33 object-contain"  
  />
  <h1 className="text-2xl font-bold mt-6 text-center">Welcome Back</h1>  {/* Increased top margin */}
  <p className="text-gray-600 text-center mt-2">Please sign in to your account</p>  {/* Added top margin */}
</div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <p className="text-muted-foreground mt-2">Please sign in to your account</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffno" className="text-sm font-medium">Staff Number</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="staffno"
                        type="text"
                        placeholder="Enter your staff number"
                        value={staffNo}
                        onChange={(e) => setStaffNo(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-blue-600 hover:underline">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowResetForm(true);
                        setError('');
                      }}
                    >
                      Reset Password?
                    </button>
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;
