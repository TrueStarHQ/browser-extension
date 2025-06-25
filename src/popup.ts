import { mount } from 'svelte';
import PopupContent from './PopupContent.svelte';

const app = mount(PopupContent, {
  target: document.getElementById('popup-content')!,
});

export default app;
