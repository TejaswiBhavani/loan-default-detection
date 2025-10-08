import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileToggle }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Single Assessment', href: '/assess/single', icon: UserIcon },
    { name: 'Batch Processing', href: '/assess/batch', icon: DocumentDuplicateIcon },
    { name: 'Prediction History', href: '/history', icon: ClockIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const NavItem: React.FC<{ item: typeof navigation[0] }> = ({ item }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
      onClick={() => onMobileToggle()}
    >
      <item.icon
        className={`mr-3 flex-shrink-0 h-6 w-6 ${
          location.pathname === item.href
            ? 'text-blue-500'
            : 'text-gray-400 group-hover:text-gray-500'
        }`}
      />
      {item.name}
    </NavLink>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 flex z-40 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={onMobileToggle}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">LoanPredict</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">LoanPredict</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
