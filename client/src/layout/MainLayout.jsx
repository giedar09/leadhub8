import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Contactos', href: '/contacts', icon: UsersIcon },
    { name: 'Chats', href: '/chats', icon: ChatBubbleLeftRightIcon },
    { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
    { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar para móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-lg">
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600">Leadhub8</Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Cerrar menú</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group flex items-center rounded-md py-2 px-2 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                  <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuario'}</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-blue-700"
                  >
                    <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar para escritorio */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Link to="/dashboard" className="text-2xl font-bold text-blue-600">Leadhub8</Link>
          </div>
          
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group flex items-center rounded-md py-2 px-2 text-base font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-blue-500" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="inline-block h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                  <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name || 'Usuario'}</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-blue-700"
                  >
                    <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Barra superior */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              {/* Aquí iría una barra de búsqueda si se necesita */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificaciones y otros elementos de la barra superior */}
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 