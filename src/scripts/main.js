// Local scripts
import './common/example';

// import CSS
import '@styles/main.scss';

// Tailwind
import '@styles/tailwind.css';

// Dynamically load in client side component JS
export const components = import.meta.glob('../../dxp/component-service/**/js/frontend.js', {eager: true});
