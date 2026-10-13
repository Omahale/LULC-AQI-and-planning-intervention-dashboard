import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Hotspots from './Hotspots';

const { mockGetHotspots } = vi.hoisted(() => ({
  mockGetHotspots: vi.fn(),
}));

vi.mock('../services/aqiService', () => ({
  aqiService: {
    getHotspots: mockGetHotspots,
  },
}));

beforeEach(() => {
  mockGetHotspots.mockResolvedValue({
    data: [
      {
        rank: 1,
        location: 'School Zone',
        aqi: 148,
        pm25: 134,
        pm10: 182,
        no2: 52,
        so2: 24,
        co: 18,
        pollutant: 'PM2.5',
        risk: 'Critical',
        priority_score: 680,
        priority_level: 'Critical',
        vulnerability_factor: 1.93,
      },
      {
        rank: 2,
        location: 'Industrial Belt',
        aqi: 287,
        pm25: 260,
        pm10: 210,
        no2: 84,
        so2: 36,
        co: 25,
        pollutant: 'PM2.5',
        risk: 'Critical',
        priority_score: 520,
        priority_level: 'Very High',
        vulnerability_factor: 1.33,
      },
    ],
  });
});

describe('Hotspots prioritization', () => {
  it('loads exposure-weighted hotspot data and shows the priority score', async () => {
    render(<Hotspots />);

    expect(await screen.findByText('School Zone')).toBeInTheDocument();
    expect(screen.getAllByText('Priority score').length).toBeGreaterThan(0);
    expect(screen.getByText('680')).toBeInTheDocument();
  });
});
