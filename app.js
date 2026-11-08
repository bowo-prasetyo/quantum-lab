import { router } from './router.js';
import { initTheme } from './theme.js';

initTheme();

const app = Vue.createApp({
  // Keyed by path, so switching lab size mounts a fresh lab with its own
  // state, worker and saved data.
  template: `<router-view :key="$route.path" />`
});

app.use(router);
app.mount('#app');
