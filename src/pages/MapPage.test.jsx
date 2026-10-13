import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import MapPage from './MapPage';

vi.mock('../components/MapView', () => ({
  default: ({ showLulcLayer, showHotspots }) => (
    <div
      data-testid="map-view"
      data-show-lulc={String(showLulcLayer)}
      data-show-hotspots={String(showHotspots)}
    />
  ),
}));

describe('MapPage filters', () => {
  it('applies the selected map layer when the filter button is clicked', () => {
    render(<MapPage />);

    fireEvent.change(screen.getByLabelText('Map Layer'), {
      target: { value: 'LULC' },
    });

    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));

    expect(screen.getByTestId('map-view')).toHaveAttribute('data-show-lulc', 'true');
    expect(screen.getByTestId('map-view')).toHaveAttribute('data-show-hotspots', 'false');
  });
});
