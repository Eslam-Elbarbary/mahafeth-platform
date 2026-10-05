import type { CityKey, MapPin } from '@/content/types';

export const OUTLINE =
  'M38.0 146.0 C45.7 144.0 71.7 155.7 82.0 152.0 C92.3 148.3 90.3 129.3 100.0 124.0 C109.7 118.7 136.7 124.0 140.0 120.0 C143.3 116.0 120.0 106.7 120.0 100.0 C120.0 93.3 133.3 86.7 140.0 80.0 C146.7 73.3 148.7 67.7 160.0 60.0 C171.3 52.3 192.0 37.0 208.0 34.0 C224.0 31.0 237.3 35.0 256.0 42.0 C274.7 49.0 302.7 66.3 320.0 76.0 C337.3 85.7 342.0 87.3 360.0 100.0 C378.0 112.7 404.7 142.7 428.0 152.0 C451.3 161.3 484.7 154.7 500.0 156.0 C515.3 157.3 513.3 159.7 520.0 160.0 C526.7 160.3 535.3 154.7 540.0 158.0 C544.7 161.3 542.0 176.7 548.0 180.0 C554.0 183.3 569.0 174.0 576.0 178.0 C583.0 182.0 586.7 197.7 590.0 204.0 C593.3 210.3 592.3 210.7 596.0 216.0 C599.7 221.3 607.3 229.3 612.0 236.0 C616.7 242.7 618.3 252.0 624.0 256.0 C629.7 260.0 642.0 257.3 646.0 260.0 C650.0 262.7 648.7 267.3 648.0 272.0 C647.3 276.7 640.0 283.0 642.0 288.0 C644.0 293.0 655.0 295.0 660.0 302.0 C665.0 309.0 667.3 324.3 672.0 330.0 C676.7 335.7 682.7 332.7 688.0 336.0 C693.3 339.3 698.7 339.3 704.0 350.0 C709.3 360.7 713.3 391.0 720.0 400.0 C726.7 409.0 723.0 401.7 744.0 404.0 C765.0 406.3 825.7 408.0 846.0 414.0 C866.3 420.0 867.0 422.3 866.0 440.0 C865.0 457.7 851.0 504.0 840.0 520.0 C829.0 536.0 820.0 529.3 800.0 536.0 C780.0 542.7 746.7 554.7 720.0 560.0 C693.3 565.3 660.7 565.3 640.0 568.0 C619.3 570.7 608.7 572.0 596.0 576.0 C583.3 580.0 574.0 582.3 564.0 592.0 C554.0 601.7 546.7 627.7 536.0 634.0 C525.3 640.3 514.7 631.7 500.0 630.0 C485.3 628.3 462.7 625.0 448.0 624.0 C433.3 623.0 423.3 625.3 412.0 624.0 C400.7 622.7 387.3 613.3 380.0 616.0 C372.7 618.7 371.3 633.3 368.0 640.0 C364.7 646.7 363.3 652.0 360.0 656.0 C356.7 660.0 351.3 666.0 348.0 664.0 C344.7 662.0 344.7 652.0 340.0 644.0 C335.3 636.0 326.7 625.3 320.0 616.0 C313.3 606.7 306.7 598.7 300.0 588.0 C293.3 577.3 286.7 562.7 280.0 552.0 C273.3 541.3 266.7 533.3 260.0 524.0 C253.3 514.7 246.7 503.3 240.0 496.0 C233.3 488.7 225.3 486.0 220.0 480.0 C214.7 474.0 211.3 468.7 208.0 460.0 C204.7 451.3 204.0 440.7 200.0 428.0 C196.0 415.3 190.7 396.0 184.0 384.0 C177.3 372.0 167.3 363.3 160.0 356.0 C152.7 348.7 145.3 347.3 140.0 340.0 C134.7 332.7 134.0 322.0 128.0 312.0 C122.0 302.0 112.0 290.7 104.0 280.0 C96.0 269.3 87.3 258.7 80.0 248.0 C72.7 237.3 65.3 226.0 60.0 216.0 C54.7 206.0 52.0 196.7 48.0 188.0 C44.0 179.3 37.7 171.0 36.0 164.0 C34.3 157.0 30.3 148.0 38.0 146.0 Z';

/**
 * Dotted Saudi Arabia map with city pins. `.pin.is-on`, the `.map__beacon` position and the
 * `.map__cap` city text are written imperatively by the showcase scroll handler; `initialCity`
 * only sets the first paint.
 */
export function SaudiMap({
  pins,
  focusCity,
  initialCity,
}: {
  pins: MapPin[];
  focusCity?: CityKey;
  initialCity: CityKey;
}) {
  const start = pins.find((pin) => pin.city === initialCity) ?? pins[0];
  return (
    <div className="mapw" aria-hidden="true">
      <div className="map__cap">
        <i />
        <b>{start?.label}</b>
      </div>
      <div className="map" id="map" data-focus-city={focusCity}>
        <svg viewBox="0 0 880 700">
          <defs>
            <pattern id="mapDots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="2.4" />
            </pattern>
            <clipPath id="mapClip">
              <path d={OUTLINE} />
            </clipPath>
          </defs>
          <rect className="map__fill" width="880" height="700" clipPath="url(#mapClip)" />
          <path className="map__ol" d={OUTLINE} />
          {start && (
            <g
              className="map__beacon"
              style={{ transform: `translate(${start.x}px, ${start.y}px)` }}
            >
              <circle className="map__glow" r="46" />
              <circle className="map__ring" r="20" />
            </g>
          )}
          {pins.map((pin) => (
            <g
              key={pin.city}
              className={pin.city === initialCity ? 'pin is-on' : 'pin'}
              data-city={pin.city}
              transform={`translate(${pin.x} ${pin.y})`}
            >
              <circle className="pin__halo" r="22" />
              <circle className="pin__dot" r="8" />
              <text x="18" y="-14">
                {pin.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
