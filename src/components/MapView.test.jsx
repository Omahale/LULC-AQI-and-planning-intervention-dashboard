import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapView from './MapView';

const { mockGetTileUrl, mockGetHotspots } = vi.hoisted(() => ({
  mockGetTileUrl: vi.fn(),
  mockGetHotspots: vi.fn(),
}));

vi.mock('../services/lulcService', () => ({
  lulcService: {
    getTileUrl: mockGetTileUrl,
  },
}));

vi.mock('../services/aqiService', () => ({
  aqiService: {
    getHotspots: mockGetHotspots,
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: ({ url, opacity }) => <div data-testid="tile-layer" data-url={url} data-opacity={String(opacity)} />,
  CircleMarker: ({ children }) => <div data-testid="circle-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  GeoJSON: () => <div data-testid="geojson" />,
}));

beforeEach(() => {
  mockGetTileUrl.mockResolvedValue({
    available: true,
    tile_url: 'https://example.com/lulc/{z}/{x}/{y}',
    reason: null,
  });

  mockGetHotspots.mockImplementation(() => new Promise(() => {}));
});

describe('MapView', () => {
  it('renders the LULC layer as soon as the tile is ready even if hotspots are still loading', async () => {
    render(<MapView showLulcLayer showHotspots autoRefreshMs={300000} />);

    await waitFor(() => {
      const lulcTiles = screen.getAllByTestId('tile-layer');
      expect(lulcTiles.some((tile) => tile.getAttribute('data-url') === 'https://example.com/lulc/{z}/{x}/{y}')).toBe(true);
    });
  });
});
