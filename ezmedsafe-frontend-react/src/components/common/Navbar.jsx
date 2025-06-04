import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth'; // Custom hook

function Navbar() {
  const { logout } = useAuth();

  return (
    <nav className='bg-blue-600 p-4 shadow-md'>
      <div className='max-w-7xl mx-auto flex justify-between items-center'>
        <Link to='/' className='text-white text-2xl font-bold tracking-tight'>
          ezMedSafe
        </Link>
        <div className='space-x-4 flex items-center'>
          <Link to='/'>
            <Button variant='ghost' className='text-white hover:bg-blue-700'>
              Home
            </Button>
          </Link>
          <Link to='/history'>
            <Button variant='ghost' className='text-white hover:bg-blue-700'>
              History
            </Button>
          </Link>
          <Button
            onClick={logout}
            variant='secondary'
            className='bg-white text-blue-600 hover:bg-gray-100'
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
