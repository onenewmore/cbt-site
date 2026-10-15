// Every unit: [id, factor to base unit, 中文名, English name, symbol]
// Groups: metric / imperial / other.  Base units: length m, weight kg, volume L, area m².
export const UNIT_CATEGORIES = {
  length: {
    base: 'm',
    def: 'cm',
    groups: {
      metric: [
        ['mm', 0.001, '毫米', 'Millimeter', 'mm'],
        ['cm', 0.01, '厘米', 'Centimeter', 'cm'],
        ['dm', 0.1, '分米', 'Decimeter', 'dm'],
        ['m', 1, '米', 'Meter', 'm'],
        ['km', 1000, '千米', 'Kilometer', 'km'],
      ],
      imperial: [
        ['in', 0.0254, '英寸', 'Inch', 'in'],
        ['ft', 0.3048, '英尺', 'Foot', 'ft'],
        ['yd', 0.9144, '码', 'Yard', 'yd'],
        ['mi', 1609.344, '英里', 'Mile', 'mi'],
        ['nmi', 1852, '海里', 'Nautical mile', 'nmi'],
      ],
    },
  },
  weight: {
    base: 'kg',
    def: 'kg',
    groups: {
      metric: [
        ['mg', 1e-6, '毫克', 'Milligram', 'mg'],
        ['g', 0.001, '克', 'Gram', 'g'],
        ['kg', 1, '千克', 'Kilogram', 'kg'],
        ['t', 1000, '吨', 'Metric ton', 't'],
      ],
      imperial: [
        ['oz', 0.028349523125, '盎司', 'Ounce', 'oz'],
        ['lb', 0.45359237, '磅', 'Pound', 'lb'],
        ['ston', 907.18474, '短吨（美吨）', 'Short ton (US)', 'short ton'],
        ['lton', 1016.0469088, '长吨（英吨）', 'Long ton (UK)', 'long ton'],
      ],
      other: [
        ['jin', 0.5, '市斤', 'Jin (Chinese catty)', '斤'],
      ],
    },
  },
  volume: {
    base: 'l',
    def: 'l',
    groups: {
      metric: [
        ['ml', 0.001, '毫升', 'Milliliter', 'ml'],
        ['l', 1, '升', 'Liter', 'L'],
        ['m3', 1000, '立方米', 'Cubic meter', 'm³'],
      ],
      imperial: [
        ['floz', 0.0295735295625, '液量盎司（美）', 'Fluid ounce (US)', 'fl oz'],
        ['pt', 0.473176473, '品脱（美）', 'Pint (US)', 'pt'],
        ['qt', 0.946352946, '夸脱（美）', 'Quart (US)', 'qt'],
        ['gal', 3.785411784, '加仑（美）', 'Gallon (US)', 'gal'],
        ['galuk', 4.54609, '加仑（英）', 'Gallon (UK)', 'gal UK'],
        ['in3', 0.016387064, '立方英寸', 'Cubic inch', 'in³'],
        ['ft3', 28.316846592, '立方英尺', 'Cubic foot', 'ft³'],
      ],
    },
  },
  area: {
    base: 'm2',
    def: 'm2',
    groups: {
      metric: [
        ['mm2', 1e-6, '平方毫米', 'Square millimeter', 'mm²'],
        ['cm2', 1e-4, '平方厘米', 'Square centimeter', 'cm²'],
        ['m2', 1, '平方米', 'Square meter', 'm²'],
        ['ha', 10000, '公顷', 'Hectare', 'ha'],
        ['km2', 1e6, '平方千米', 'Square kilometer', 'km²'],
      ],
      imperial: [
        ['in2', 0.00064516, '平方英寸', 'Square inch', 'in²'],
        ['ft2', 0.09290304, '平方英尺', 'Square foot', 'ft²'],
        ['yd2', 0.83612736, '平方码', 'Square yard', 'yd²'],
        ['acre', 4046.8564224, '英亩', 'Acre', 'acre'],
        ['mi2', 2589988.110336, '平方英里', 'Square mile', 'mi²'],
      ],
      other: [
        ['mu', 10000 / 15, '亩', 'Mu (Chinese acre)', '亩'],
      ],
    },
  },
  temperature: {
    special: true,
    def: 'c',
    groups: {
      metric: [
        ['c', null, '摄氏度', 'Celsius', '°C'],
        ['k', null, '开尔文', 'Kelvin', 'K'],
      ],
      imperial: [
        ['f', null, '华氏度', 'Fahrenheit', '°F'],
      ],
    },
  },
};
