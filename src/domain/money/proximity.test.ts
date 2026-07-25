import { distanceMeters, findNearbyPlace } from "./proximity";
import { WatchedPlace } from "@domain/entities/WatchedPlace";

function makePlace(overrides: Partial<WatchedPlace>): WatchedPlace {
  return {
    id: "p1",
    name: "Mall",
    latitude: 40.0,
    longitude: -74.0,
    radiusMeters: 150,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("distanceMeters", () => {
  it("returns 0 for identical coordinates", () => {
    expect(distanceMeters(40, -74, 40, -74)).toBe(0);
  });

  it("returns a plausible distance for two nearby points", () => {
    // Roughly 111km per degree of latitude — 0.001 degrees is ~111m.
    const d = distanceMeters(40.0, -74.0, 40.001, -74.0);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe("findNearbyPlace", () => {
  it("returns null when no place is within its radius", () => {
    const places = [makePlace({ latitude: 40.0, longitude: -74.0, radiusMeters: 100 })];
    // ~1.1km away — well outside a 100m radius.
    expect(findNearbyPlace(places, 40.01, -74.0)).toBeNull();
  });

  it("returns the place when the coordinate falls within its radius", () => {
    const places = [makePlace({ id: "mall", latitude: 40.0, longitude: -74.0, radiusMeters: 200 })];
    const result = findNearbyPlace(places, 40.0005, -74.0); // ~55m away
    expect(result?.id).toBe("mall");
  });

  it("returns the nearest place when radii overlap", () => {
    const places = [
      makePlace({ id: "far", latitude: 40.0, longitude: -74.0, radiusMeters: 500 }),
      makePlace({ id: "near", latitude: 40.0002, longitude: -74.0, radiusMeters: 500 }),
    ];
    const result = findNearbyPlace(places, 40.0003, -74.0);
    expect(result?.id).toBe("near");
  });

  it("returns null for an empty places list", () => {
    expect(findNearbyPlace([], 40.0, -74.0)).toBeNull();
  });
});
