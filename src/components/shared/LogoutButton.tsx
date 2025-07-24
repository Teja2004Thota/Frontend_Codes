// src/components/shared/LogoutButton.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner'; // or use your toast system

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');

    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  return (
    <Button
      variant="destructive"
      className="flex gap-2 items-center"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4" />
      Logout
    </Button>
  );
};

export default LogoutButton;
