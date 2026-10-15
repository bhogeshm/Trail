import fs from 'node:fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoContains } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const all = feature(topo, topo.objects.countries);
const land = { type: 'FeatureCollection', features: all.features.filter(f => f.id !== '010') };
const proj = geoNaturalEarth1().fitExtent([[40, 70], [1880, 1060]], land);
const step = 13;
const dots = [];
for (let y = step / 2; y < 1080; y += step) for (let x = step / 2; x < 1920; x += step) {
  const ll = proj.invert([x, y]);
  if (!ll || !isFinite(ll[0])) continue;
  if (land.features.some(f => geoContains(f, ll))) dots.push([Math.round(x), Math.round(y)]);
}
const c = { mumbai: [72.88, 19.08], singapore: [103.82, 1.35], dubai: [55.27, 25.2], london: [-0.13, 51.5], newyork: [-74.0, 40.71] };
const cities = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, proj(v).map(n => +n.toFixed(1))]));
// partner network: seeded pseudo-random financial hubs
const hubs = [[8.54,47.37],[2.35,48.86],[13.4,52.52],[4.9,52.37],[-3.7,40.42],[12.5,41.9],[6.13,49.61],[-9.14,38.72],[114.17,22.32],[139.69,35.69],[151.21,-33.87],[-79.38,43.65],[-87.63,41.88],[-122.42,37.77],[-46.63,-23.55],[18.42,-33.92],[51.53,25.29],[46.68,24.71],[50.58,26.23],[47.98,29.37],[58.4,23.6],[77.21,28.61],[80.27,13.08],[121.47,31.23],[126.98,37.57],[100.5,13.75],[106.85,-6.2],[101.69,3.14],[144.96,-37.81],[174.78,-36.85],[-99.13,19.43],[-58.38,-34.6],[36.82,-1.29],[3.38,6.52],[31.24,30.04],[28.98,41.01],[37.62,55.75],[-6.26,53.35],[10.75,59.91],[18.07,59.33],[-80.19,25.76],[-95.37,29.76]];
const partners = hubs.map(v => proj(v).map(n => +n.toFixed(1)));
fs.writeFileSync('build/map.json', JSON.stringify({ dots, cities, partners }));
console.log(dots.length, cities);
