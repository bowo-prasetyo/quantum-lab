// Routes:
//   #/lab/1, #/lab/2, #/lab/3   the lab for that many qubits
//   #/lessons                   the lesson path
//   #/lessons/:id               one lesson
//   #/concepts                  Quantum Concepts
//   #/help                      how to use the lab
//   #/manual                    old User Manual address → the lessons
// Anything else goes to the 1-qubit lab.

import { Lab } from './lab.js';
import { Lessons } from './pages/lessons.js';
import { Lesson } from './pages/lesson.js';
import { Concepts } from './pages/concepts.js';
import { Help } from './pages/help.js';

export const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/lab/1' },
    {
      path: '/lab/:n(1|2|3)',
      component: Lab,
      props: route => ({ n: Number(route.params.n) })
    },
    { path: '/lessons', component: Lessons },
    { path: '/lessons/:id', component: Lesson, props: true },
    { path: '/concepts', component: Concepts },
    { path: '/help', component: Help },
    { path: '/manual', redirect: '/lessons' },
    { path: '/:pathMatch(.*)*', redirect: '/lab/1' }
  ],
  scrollBehavior: () => ({ top: 0 })
});
