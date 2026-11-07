// Top navigation: lab size selector plus the reference pages.

export const AppNav = {
  template: `
    <nav class="card nav">
      <span class="nav-label">Lab:</span>
      <router-link
        v-for="n in [1, 2, 3]"
        :key="n"
        :to="'/lab/' + n"
        class="nav-link"
        active-class="active"
      >{{ n }} {{ n === 1 ? 'qubit' : 'qubits' }}</router-link>

      <span class="nav-sep"></span>

      <router-link to="/concepts" class="nav-link" active-class="active">Concepts</router-link>
      <router-link to="/manual" class="nav-link" active-class="active">User Manual</router-link>
    </nav>
  `
};
