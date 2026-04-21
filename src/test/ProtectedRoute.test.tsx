import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Mock the store
const mockUseStore = vi.fn();
vi.mock('../store', () => ({
  default: mockUseStore,
}));

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    mockUseStore.mockReturnValue({
      isAuthenticated: false,
      checkAuth: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Since it redirects, the protected content should not be there
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockUseStore.mockReturnValue({
      isAuthenticated: true,
      checkAuth: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});