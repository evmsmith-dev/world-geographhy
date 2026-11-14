// The projections of the game's maps, used by the scripts that draw places on them (build-geo.mjs, build-landmarks.mjs).
import * as d3 from 'd3-geo';

// Each continent map's projection (azimuthal equal-area), recovered to within 0.03 px of the existing country maps.
export const PROJ = {
  europe:   {c:[12, 52.95],     s:1345.53, t:[434.24, 466.53], w:1000, h:901},
  africa:   {c:[16.99, 2.01],   s:690.51,  t:[505.13, 438.8],  w:1000, h:892},
  asia:     {c:[86, 27.01],     s:562.64,  t:[451.74, 332.3],  w:1000, h:703},
  oceania:  {c:[158, -18],      s:622.86,  t:[482.03, 358.5],  w:1000, h:700},
  namerica: {c:[-96, 44],       s:794.25,  t:[484.85, 552.98], w:1000, h:1056},
  samerica: {c:[-59.99, -20.05],s:1177.09, t:[462.78, 675.62], w:1000, h:1422},
  // the United States map (us-atlas, 975 × 610) is Albers USA; its lower 48 part is this Albers projection.
  // Places on land are cut to the lower 48 states, so a range doesn't spill into Canada or Mexico.
  us:       {make: () => d3.geoAlbers().scale(1300).translate([487.5, 305]), w:975, h:610, landOnly:true},
};

// a d3 projection for one of the maps above
export const projectionFor = P => P.make ? P.make() : d3.geoAzimuthalEqualArea().rotate([-P.c[0], -P.c[1]]).scale(P.s).translate(P.t).clipAngle(90).precision(0.1);
