import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the admin dashboard heading', () => {
  render(<App />);
  const heading = screen.getByText(/Todo dashboard/i);
  expect(heading).toBeInTheDocument();
});
