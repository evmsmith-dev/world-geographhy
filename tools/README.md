# Map tools

These scripts build the game's map files. The game doesn't use them; they're here so the maps can be rebuilt.

## build-geo.mjs: Land & Water maps (the six continents and the United States)

Builds `europe-geo.json`, `africa-geo.json`, `asia-geo.json`, `oceania-geo.json`, `namerica-geo.json` and `samerica-geo.json` in `data/maps/`.

1. Download these files from https://github.com/nvkelso/natural-earth-vector/tree/master/geojson into one folder:
   `ne_10m_geography_marine_polys.geojson`, `ne_50m_lakes.geojson`, `ne_10m_geography_regions_polys.geojson`
2. `npm i d3-geo polygon-clipping`
3. `node tools/build-geo.mjs <that folder> data/maps`

The list of features and each continent map's projection are at the top of the script. The projections were recovered from the existing country maps, to within 0.03 pixels, so the features line up with the countries.

Natural Earth has no Mojave Desert, so the script draws its outline by hand from a list of longitude/latitude points (`HAND` in the script). Edit those points to reshape it.

## build-parks.mjs: the National Parks map

Builds `data/maps/usparks.json`: 23 national parks on the US map, drawn over the states. Outlines come from Natural Earth's
`ne_10m_parks_and_protected_lands_area.geojson`; Natural Earth doesn't have Arches, Acadia, Mammoth Cave or Carlsbad Caverns,
so those are a point from the National Park Service, written in the script. To add a park, add a line to `PARKS` in the script,
then add its fun fact to `data/facts.json` (under `geo`) and its short name to `PARK_ALIAS` in `src/02-topics.js`, and change
the count on the `us-parks` topic.

1. Download `ne_10m_parks_and_protected_lands_area.geojson` from https://github.com/nvkelso/natural-earth-vector (the `geojson` folder) into a folder.
2. In a folder with `d3-geo` installed (`npm install d3-geo`): `node tools/build-parks.mjs <that folder> data/maps`

The United States' Land & Water (`us-geo.json`) uses the US map's own projection, and its mountains, plains and deserts are
cut to the lower 48 states so they don't spill into Canada or Mexico. It needs `data/maps/us.json` in the output folder.

## build-us.mjs: US Regions and Cities

Builds `data/maps/usregions.json` (the 5 regions taught in school, each made from its states in `data/maps/us.json`) and
`data/maps/uscities.json` (25 cities, located from Natural Earth's `ne_10m_populated_places_simple.geojson`). The states in each
region and the list of cities are at the top of the script.

1. Download `ne_10m_populated_places_simple.geojson` from https://github.com/nvkelso/natural-earth-vector (the `geojson` folder) into a folder.
2. In a folder with `d3-geo` and `polygon-clipping` installed: `node tools/build-us.mjs <that folder> data/maps`
