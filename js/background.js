"use strict"

export function Background(moonSrc, dustFarSrc, dustNearSrc, vignetteSrc, scanlinesSrc) {
	let moon = new Image();
	let dustFar = new Image();
	let dustNear = new Image();
	let scanlines = new Image();
	let vignette = new Image();

	moon.src = moonSrc;
	dustFar.src = dustFarSrc;
	dustNear.src = dustNearSrc;
	vignette.src = vignetteSrc;
	scanlines.src = scanlinesSrc;

	let timer = 0.0;

	function isLoadingCompleted() {
		return moon.complete && dustFar.complete && dustNear.complete && vignette.complete && scanlines.complete;
	}

	function fillImage(ctx, img, x, y) {
		let cw = ctx.canvas.width,
			ch = ctx.canvas.height,
			iw = img.width,
			ih = img.height;
		
		x = (x%iw - iw) % iw;
		y = (y%ih - ih) % ih;
		for( let nx = x; nx < cw; nx += iw ) {
			for( let ny = y; ny < ch; ny += ih ) {
				ctx.drawImage( img, nx, ny );
			}
		}
	}

	function draw(context, canvas) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;	

		context.globalAlpha = 1;
		context.fillStyle = '#111';
		context.fillRect(0, 0, canvas.width, canvas.height);

		timer += 0.035;

		if (isLoadingCompleted()) {
			context.fillStyle = '#111';
			context.globalAlpha = 1.0;
			context.drawImage(moon, 0, 0, canvas.width, canvas.height);

			context.globalAlpha = 0.4;
			context.globalCompositeOperation = 'lighter';
			fillImage(context, dustFar, 2 * timer, 2 * timer);

			context.globalAlpha = 0.3;
			fillImage(context, dustNear, 5 * timer, 5 * timer);
			context.globalAlpha = 0.1;
			fillImage(context, dustNear, 25 * timer, 25 * timer);

			context.globalAlpha = 0.5;
			context.globalCompositeOperation = 'source-over';
			context.drawImage(vignette, 0, 0, canvas.width, canvas.height);

			context.globalAlpha = 0.3;
			let pattern = context.createPattern(scanlines, 'repeat');
  			context.fillStyle = pattern;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
	}

	return {
		draw: draw
	};
}