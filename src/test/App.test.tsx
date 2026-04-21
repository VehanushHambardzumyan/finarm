import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';

// Mock the store
vi.mock('../store', () => ({
  useStore: () => ({
    checkAuth: vi.fn(),
    loadAccounts: vi.fn(),
    loadTransactions: vi.fn(),
    isAuthenticated: false,
  }),
}));

// Mock lazy components
vi.mock('../pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('../pages/Register', () => ({ default: () => <div>Register Page</div> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('../pages/Accounts', () => ({ default: () => <div>Accounts Page</div> }));
vi.mock('../pages/Transactions', () => ({ default: () => <div>Transactions Page</div> }));
vi.mock('../pages/Income', () => ({ default: () => <div>Income Page</div> }));
vi.mock('../pages/Expenses', () => ({ default: () => <div>Expenses Page</div> }));
vi.mock('../pages/Budgets', () => ({ default: () => <div>Budgets Page</div> }));
vi.mock('../pages/Goals', () => ({ default: () => <div>Goals Page</div> }));
vi.mock('../pages/Reports', () => ({ default: () => <div>Reports Page</div> }));
vi.mock('../pages/Notifications', () => ({ default: () => <div>Notifications Page</div> }));
vi.mock('../pages/Settings', () => ({ default: () => <div>Settings Page</div> }));
vi.mock('../pages/Profile', () => ({ default: () => <div>Profile Page</div> }));
vi.mock('../pages/Admin', () => ({ default: () => <div>Admin Page</div> }));

// Mock components
vi.mock('../components/Header', () => ({ default: () => <header>Header</header> }));
vi.mock('../components/Layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders Login page on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});