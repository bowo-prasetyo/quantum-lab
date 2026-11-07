// Routes:
//   #/lab/1, #/lab/2, #/lab/3   the lab for that many qubits
//   #/concepts                  Quantum Concepts
//   #/manual                    User Manual
// Anything else goes to the 1-qubit lab, the start of the learning path.

import { Lab } from './lab.js';
import { Concepts } from './pages/concepts.js';
import { Manual } from './pages/manual.js';

export const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/lab/1' },
    {
      path: '/lab/:n(1|2|3)',
      component: Lab,
      props: route => ({ n: Number(route.params.n) })
    },
    { path: '/concepts', component: Concepts },
    { path: '/manual', component: Manual },
    { path: '/:pathMatch(.*)*', redirect: '/lab/1' }
  ],
  scrollBehavior: () => ({ top: 0 })
});
