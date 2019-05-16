"use strict"

import {Background} from './background.js';

let canvas = document.getElementById('background');
let context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let background = new Background('img/old-paper.jpg',
    'img/dust-far.jpg',
    'img/dust-near.jpg',
    'img/vignette.png',
    'img/scanlines.png');

let drawBackground = function (time) {
    background.draw(context, canvas);
};

(function () {
    let lastTime = 0;
    let vendors = ['ms', 'moz', 'webkit', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            let currTime = new Date().getTime();
            let timeToCall = Math.max(0, 33 - (currTime - lastTime));
            let id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

let filterStrength = 20;
let frameTime = 0, lastLoop = new Date, thisLoop;
(function animloop(time) {
    window.requestAnimationFrame(animloop);
    let thisFrameTime = (thisLoop = new Date) - lastLoop;
    frameTime += (thisFrameTime - frameTime) / filterStrength;
    lastLoop = thisLoop;
    if (frameTime > 1.0) {
        drawBackground(time);
        frameTime = 0.0
    }
})();