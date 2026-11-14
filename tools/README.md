# Map tools

These scripts build the game's map files. The game doesn't use them; they're here so the maps can be rebuilt.

## build-geo.mjs: Land & Water maps

Builds `europe-geo.json`, `africa-geo.json`, `asia-geo.json`, `oceania-geo.json`, `namerica-geo.json` and `samerica-geo.json` in `data/maps/`.

1. Download these files from https://github.com/nvkelso/natural-earth-vector/tree/master/geojson into one folder:
   `ne_10m_geography_marine_polys.geojson`, `ne_50m_lakes.geojson`, `ne_10m_geography_regions_polys.geojson`
2. `npm i d3-geo polygon-clipping`
3. `node tools/build-geo.mjs <that folder> data/maps`

The list of features and each continent map's projection are at the top of the script. The projections were recovered from the existing country maps, to within 0.03 pixels, so the features line up with the countries.

Natural Earth has no Mojave Desert, so the script draws its outline by hand from a list of longitude/latitude points (`HAND` in the script). Edit those points to reshape it.
