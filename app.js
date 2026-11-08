import { router } from './router.js';
import { initTheme } from './theme.js';
import { initLocale, i18nPlugin } from './locale.js';

initTheme();
initLocale();

const app = Vue.createApp({
  // Keyed by path, so switching lab size mounts a fresh lab with its own
  // state, worker and saved data.
  template: `<router-view :key="$route.path" />`
});

app.use(router);
app.use(i18nPlugin);
app.mount('#app');
