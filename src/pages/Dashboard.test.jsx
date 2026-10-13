import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

const { mockGetAreaStats, mockGetAccuracy, mockGetAreaBreakdown, mockGetTrend } = vi.hoisted(() => ({
  mockGetAreaStats: vi.fn(),
  mockGetAccuracy: vi.fn(),
  mockGetAreaBreakdown: vi.fn(),
  mockGetTrend: vi.fn(),
}));

vi.mock('../services/lulcService', () => ({
  lulcService: {
    getAreaStats: mockGetAreaStats,
    getAccuracy: mockGetAccuracy,
  },
}));

vi.mock('../services/aqiService', () => ({
  aqiService: {
    getAreaBreakdown: mockGetAreaBreakdown,
    getTrend: mockGetTrend,
  },
}));

vi.mock('../components/MapView', () => ({
  default: ({ showLulcLayer, showHotspots }) => (
    <div data-testid="map-view" data-show-lulc={String(showLulcLayer)} data-show-hotspots={String(showHotspots)} />
  ),
}));

beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  mockGetAreaStats.mockResolvedValue({
    source: 'live_gee',
    data: [
      { class_name: 'Built-up', area_km2: 26.4, percent: 42 },
      { class_name: 'Vegetation', area_km2: 18.7, percent: 31 },
      { class_name: 'Water', area_km2: 9.2, percent: 15 },
    ],
  });

  mockGetAccuracy.mockResolvedValue({ data: { overall_accuracy: 0.91, kappa: 0.88 } });
  mockGetAreaBreakdown.mockResolvedValue({
    data: {
      areas: [
        { area: 'Nashik NMC', aqi: 142, pm25: 82, pm10: 112, no2: 41, so2: 18, co: 14, status: 'Moderate' },
        { area: 'Satpur', aqi: 171, pm25: 96, pm10: 128, no2: 44, so2: 21, co: 19, status: 'Unhealthy' },
        { area: 'Gangapur Road', aqi: 128, pm25: 71, pm10: 95, no2: 37, so2: 16, co: 12, status: 'Moderate' },
      ],
    },
  });

  mockGetTrend.mockResolvedValue({
    data: [
      { month: 'Jan 2026', aqi: 118 },
      { month: 'Feb 2026', aqi: 126 },
      { month: 'Mar 2026', aqi: 134 },
    ],
  });
});

describe('Dashboard live LULC distribution', () => {
  it('loads the live LULC distribution from the backend instead of dummy data', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(mockGetAreaStats).toHaveBeenCalled();
    });

    expect(await screen.findByText('Built-up')).toBeInTheDocument();
  });

  it('shows an area selector with AQI and pollutant concentration for the selected Nashik area', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(mockGetAreaBreakdown).toHaveBeenCalled();
    });

    expect((await screen.findAllByText('Area AQI Overview')).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Select area').length).toBeGreaterThan(0);
    expect((await screen.findAllByText('PM2.5')).length).toBeGreaterThan(0);
  });

  it('loads the year-wise monthly AQI trend from the backend API', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(mockGetTrend).toHaveBeenCalled();
    });

    expect(mockGetTrend).toHaveBeenCalledTimes(1);
  });

  it('shows no mock trend data when the backend responds without rows', async () => {
    mockGetTrend.mockResolvedValueOnce({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockGetTrend).toHaveBeenCalled();
    });

    expect(await screen.findByText('No AQI trend available yet.')).toBeInTheDocument();
  });
});
