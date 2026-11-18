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

Builds `data/maps/usparks.json`: 45 national parks on the US map, drawn over the states. Outlines come from Natural Earth's
`ne_10m_parks_and_protected_lands_area.geojson`; Natural Earth doesn't have Arches, Acadia, Mammoth Cave or Carlsbad Caverns,
so those (and some others) are a point at the park, written in the script. To add a park, add a line to `PARKS` in the script,
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

## build-landmarks.mjs: Landmarks

Builds `data/maps/<continent>-landmarks.json`: famous landmarks on each continent's map, each a tap circle, and
`data/maps/us-landmarks.json`: US Landmarks on the United States map, each checked against its state (none of them also on
North America's tab). Each landmark is a
longitude/latitude written in the script, with the country it's in; the script checks that it lands inside that country on the map
(a few in the water, like the Statue of Liberty, are placed on the shore next to them). The map projections are shared with
`build-geo.mjs` in `projections.mjs`. To add a landmark, add a line to `LANDMARKS`, then its fun fact to `data/facts.json` (under
`geo`), and change the count on its continent's `landmarkTopic` line in `src/02-topics.js`. Then draw it (below).

In a folder with `d3-geo` installed: `node tools/build-landmarks.mjs data/maps`

## borders.mjs: borders as the UN draws them

Natural Earth's maps show who controls a place. Where that differs from the UN and almost every school atlas, this
redraws it:
- **Crimea** moves from Russia to Ukraine on the Europe map (UN General Assembly Resolution 68/262), joined to mainland
  Ukraine, and comes out of Russia's flashcard shape.
- **Western Sahara**: Morocco is cut at its recognised southern border (27°40'N), and the part south of it becomes gray
  land, like the rest of Western Sahara (the UN lists it as a territory whose future hasn't been decided).

`node tools/borders.mjs <folder with d3-geo and polygon-clipping installed>`, then `tools/add-areas.mjs`. It is safe to run
more than once. A data test checks Simferopol, Sevastopol and Kerch are in Ukraine and Morocco stops at the border.

## add-areas.mjs: real sizes and positions, for Mystery Country

Adds two fields to every country (the six continent maps) and every state (`data/maps/us.json`): `area`, its real area in
km², and `ll`, the longitude and latitude of the middle of its biggest piece of land. Mystery Country's size clue ranks on
`area`, and its direction clue uses `ll` where the game has no named part for a place (South America, Oceania, and
Canada, the US and Mexico). The map shapes can't be used for this: Russia is cut off at the map's edge, and Alaska is drawn
at about a third of its size. Shapes are measured on the globe with d3-geo, from world-atlas (Natural Earth) for countries
and us-atlas (US Census) for states. Vatican City is too small for the atlas to measure, so it gets its official 0.49 km².

`node tools/add-areas.mjs <folder with world-atlas, us-atlas, topojson-client and d3-geo installed>`. Run it again after
rebuilding a country or state map. A data test checks every place has both fields.

## build-pictures.mjs: the landmark drawings

Builds `assets/landmarks/`: one small SVG drawing for each landmark (200 by 160, with rounded corners and its own sky, so it
looks the same in light and dark mode). Each drawing is written by hand as shapes in `tools/pictures/` (one file per
continent, plus `usa.mjs` for US Landmarks, with shared pieces like clouds and arches in `common.mjs`). The file name comes from the landmark's name
(`Chichén Itzá` → `chichen-itza.svg`).

1. Edit a drawing in `tools/pictures/<continent>.mjs` (or add one, named exactly like the landmark).
2. `node tools/build-pictures.mjs` (no packages needed).
3. For a new landmark, also add its file to the list in `sw.js`, so it works offline.

A data test checks that every landmark has a drawing, that each file matches `tools/pictures/`, and that `sw.js` lists them all.

