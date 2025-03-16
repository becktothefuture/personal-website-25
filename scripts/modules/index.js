
import { initMouseMonitors } from './mousemonitors.js';
import { initScrollVideo } from './scrollVideo.js';

function initializeModules() {
    initMouseMonitors();
    initScrollVideo();
}

initializeModules();