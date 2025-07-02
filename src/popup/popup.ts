import { mount } from 'svelte';

import Popup from './Popup.svelte';

const app = mount(Popup, {
  target: document.getElementById('popup-content')!,
});

export default app;
