/**
 * Server-side geocoding utility for GrubSpot.
 * Uses OpenStreetMap Nominatim to resolve Indian mess addresses to lat/lng.
 */

const https = require('https');

/**
 * Attempt to extract coordinates from a Google Maps URL.
 * Follows short links (maps.app.goo.gl) and parses the final URL.
 */
async function extractCoordsFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let finalUrl = url;

  // Resolve short links
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    try {
      finalUrl = await new Promise((resolve) => {
        https.get(url, (res) => {
          resolve(res.headers.location || url);
        }).on('error', () => resolve(url));
      });
    } catch (e) {
      // ignore
    }
  }

  // Look for !3dLAT!4dLNG or @LAT,LNG
  // e.g. !3d13.0601958!4d77.6419932
  const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }

  // e.g. @13.0601958,77.6394183
  const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  
  // e.g. q=13.0601958,77.6394183
  const qMatch = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  return null;
}

/**
 * Geocode an address string or extract from Google Map URL to { lat, lng }.
 * Prioritizes the Google Map URL if provided.
 * Appends "Bengaluru, Karnataka, India" context if Nominatim fallback is used.
 * Returns null if geocoding fails.
 */
async function geocodeAddress(address, googleMapUrl = null) {
  if (googleMapUrl) {
    const urlCoords = await extractCoordsFromUrl(googleMapUrl);
    if (urlCoords) {
      console.log(`[Geocode] Successfully extracted coordinates from Google Maps URL: ${urlCoords.lat}, ${urlCoords.lng}`);
      return urlCoords;
    }
  }

  if (!address || address.trim() === '') return null;

  // Add Bengaluru context to improve Indian address resolution
  const hasBengaluru = /bengaluru|bangalore|banglore/i.test(address);
  const fullAddress = hasBengaluru
    ? address.trim()
    : `${address.trim()}, Bengaluru, Karnataka, India`;

  // Bengaluru bounding box: left, top, right, bottom
  const viewbox = '77.3,13.2,77.9,12.6';

  const makeRequest = (queryStr) => {
    return new Promise((resolve) => {
      const query = encodeURIComponent(queryStr);
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in&viewbox=${viewbox}&bounded=0`;
      const options = { headers: { 'User-Agent': 'GrubSpot/1.0 (mess-finder-bengaluru)', 'Accept-Language': 'en' } };

      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && parsed.length > 0) {
              resolve({ lat: parseFloat(parsed[0].lat), lng: parseFloat(parsed[0].lon) });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  };

  let coords = await makeRequest(fullAddress);
  
  // Fallback: If full address fails, Nominatim often chokes on long descriptive prefixes.
  // Extract the last 3 comma-separated segments (e.g. "Kothanur, Bengaluru, Karnataka")
  if (!coords && fullAddress.includes(',')) {
    const parts = fullAddress.split(',').map(p => p.trim());
    if (parts.length > 3) {
      const simplified = parts.slice(-3).join(', ');
      console.log(`[Geocode] Retrying simplified address: "${simplified}"`);
      coords = await makeRequest(simplified);
    }
  }

  if (!coords) {
    console.warn(`[Geocode] No results for: "${fullAddress}"`);
  }
  
  return coords;
}

module.exports = { geocodeAddress };
