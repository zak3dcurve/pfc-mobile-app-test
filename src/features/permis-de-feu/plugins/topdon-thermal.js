// src/plugins/topdon-thermal.js

import { registerPlugin } from '@capacitor/core';

const TopdonThermal = registerPlugin('TopdonThermal', {
  web: () => import('./web').then(m => new m.TopdonThermalWeb()),
});

export default TopdonThermal;
