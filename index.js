const Widget = {
    properties: {
        img1: `https://picsum.photos/id/${Math.floor(Math.random() * 50)}/300/300`,
        img2: `https://picsum.photos/id/${Math.floor(Math.random() * 50)}/300/300`,
        img3: `https://picsum.photos/id/${Math.floor(Math.random() * 50)}/300/300`,
        img4: `https://picsum.photos/id/${Math.floor(Math.random() * 50)}/300/300`,
        //in seconds, default is 3
        imageShowTime: 3,
        // set the one tenth step, default is 1 second
        transitionTime: 20,
        animationType: 'Transition 2',
        transitionDirection: 'Left-Right',
        particlesColor: 'rgb(0,255,0)',
        particlesColor2: 'rgb(255,255,0)',
        particlesPerColumn: 10,
        particlesPerRow: 10,
        skewSize: 1
    }
}

class myBanner {
    constructor(options) {
        // this.time = 0;
        this.frameRate = 60;
        this.startTime = new Date().getTime();
        this.framesPerSecond = 0;
        this.animationType = options.animationType;
        this.transitionDirection = options.transitionDirection;

        //transition options start
        this.transitionTime = +options.transitionTime > 0 ? +options.transitionTime * 100 : 1000;
        //transition options end

        // particles settings start
        this.rows = options.particlesPerColumn > 0 ? options.particlesPerColumn : 10;
        this.cols = options.particlesPerRow > 0 ? options.particlesPerRow : 10;
        this.particlesColor = options.particlesColor;
        this.particlesColor2 = options.particlesColor2;
        this.currentColor = this.particlesColor;
        this.particles = [];
        // particles settings end

        //image options start
        this.imageShowTime = (+options.imageShowTime > 0 ? +options.imageShowTime * 1000 : 3000) + this.transitionTime;
        this.images = [];
        this.currentImage = 0;
        this.maxImages = 4;
        //image options end


        //elements set start
        this.container = document.getElementById('widget-wrapper');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        //elements set end

        //set dimensions start
        this.ratio = window.devicePixelRatio;
        this.w = this.container.offsetWidth * this.ratio;
        this.h = this.container.offsetHeight * this.ratio;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.particleWidth = this.w / this.cols;
        this.particleHeight = this.h / this.rows;
        this.skewPercent = options.skewSize / 10;
        this.skewSize = this.particleWidth * this.skewPercent;
        this.skewSizeAbs = Math.abs(this.skewSize);
        this.currentClipPosition = 0;
        //set dimensions end

        this.isPaused = false;
        this.loop = null;

        //wait until all images are loaded
        Promise.all(this.createImages(options)).then(() => {
            this.setupResize();
            this.createParticles();
            this.render();
        });  
    }

    // add listener for resize
    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    //update dimensions
    resize() {
        this.ratio = window.devicePixelRatio;
        this.w = this.canvas.width = this.container.offsetWidth * this.ratio;
        this.h = this.canvas.height = this.container.offsetHeight * this.ratio;
        this.particleWidth = this.w / this.cols;
        this.particleHeight = this.h / this.rows;
        this.skewSize = this.particleWidth * this.skewPercent;
        this.skewSizeAbs = Math.abs(this.skewSize);
        this.particles = [];
        this.createParticles();
    }

    //TODO: add Widget.optimisedImageUrls
    createImages(options) {
        const promiseArray = [];

        for(let i = 0; i < this.maxImages; i++) {
            promiseArray.push(new Promise((res, rej) => {
                const img = document.createElement('img');
                img.width = this.w;
                img.height = this.h;
                img.onload = res;
                img.src = options[`img${i+1}`];
                this.images.push({
                    img,
                    opacity: 0,
                    visibleTime: 0
                });
            }));
        }

        return promiseArray;
    }

    drawImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.animationType === 'Transition 1') {
            [current, next].forEach((image, i) => {
                this.ctx.save();
                this.ctx.globalAlpha = image.opacity;
                //Show the images in a row
                // this.ctx.drawImage(image.img, i* (this.w/this.images.length), 0, this.w/this.maxImages, this.h);
                
                this.ctx.drawImage(image.img, 0, 0, this.w, this.h);
                this.ctx.restore();
            });
        } else if (this.animationType === 'Transition 2') {
            let clipTopXPoint;
            let clipBottomXPoint;

            if (this.skewSize < 0) {
                clipTopXPoint = this.currentClipPosition;
                clipBottomXPoint = this.currentClipPosition + this.particleWidth + this.skewSizeAbs;
            } else if (this.skewSize > 0) {
                clipTopXPoint = this.currentClipPosition + this.particleWidth + this.skewSizeAbs;
                clipBottomXPoint = this.currentClipPosition;
            } else {
                clipTopXPoint = clipBottomXPoint = this.currentClipPosition;
            }

            // draw firstImage
            // draw image 1
            if (this.transitionDirection === 'Left-Right') {
                this.ctx.drawImage(next.img, 0, 0, this.w, this.h);
            } else if (this.transitionDirection === 'Right-Left') {
                this.ctx.drawImage(current.img, 0, 0, this.w, this.h);
            }

            // draw second image
            this.ctx.save();
            // draw clip path 2
            this.ctx.beginPath();
            this.ctx.moveTo(clipTopXPoint, 0);
            this.ctx.lineTo(this.w, 0);
            this.ctx.lineTo(this.w, this.h);
            this.ctx.lineTo(clipBottomXPoint, this.h);
            this.ctx.clip();
            // draw image 2
            if (this.transitionDirection === 'Left-Right') {
                this.ctx.drawImage(current.img, 0, 0, this.w, this.h);
            } else if (this.transitionDirection === 'Right-Left') {
                this.ctx.drawImage(next.img, 0, 0, this.w, this.h);
            }
            this.ctx.restore();

        } else if (this.animationType === 'Transition 3') {

        }
    }

    updateImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.animationType === 'Transition 1') {
            if (current.visibleTime <= 0) {
                current.opacity = 1;
            }

            if (current.visibleTime >= this.imageShowTime) {
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
                current.visibleTime = 0;
            }

            if (current.visibleTime >= (this.imageShowTime - this.transitionTime)) {

                const changeOpacityStep = 1 / (this.transitionTime / (1000/this.frameRate));

                if (current.opacity > 0) {
                    // hide current images
                    current.opacity -= changeOpacityStep;
                    current.opacity = current.opacity < 0 ? 0 : current.opacity;

                    // show next image
                    if (next.opacity < 1) {
                        next.opacity += changeOpacityStep;
                        next.opacity = next.opacity > 1 ? 1 : next.opacity;
                    }
                }
            }
        } else if (this.animationType === 'Transition 2') {
            if (current.visibleTime >= this.imageShowTime + this.transitionTime) {
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
                current.visibleTime = 0;
            }

            if (current.visibleTime >= this.imageShowTime) {
                let clipStep = (this.w + this.particleWidth + this.skewSizeAbs) / (this.transitionTime / (1000 / this.frameRate));

                if (this.transitionDirection === 'Left-Right') {
                    this.currentClipPosition += clipStep;
                } else if (this.transitionDirection === 'Right-Left') {
                    this.currentClipPosition -= clipStep;
                }
            } else {
                if (this.transitionDirection === 'Left-Right') {
                    this.currentClipPosition = 0 - (this.particleWidth + this.skewSizeAbs);
                } else if (this.transitionDirection === 'Right-Left') {
                    this.currentClipPosition = this.w;
                }
            }
        } else if (this.animationType === 'Transition 3') {

        }

        current.visibleTime += 1000 / (this.frameRate);
    }

    createParticles() {
        if (this.animationType === 'Transition 1') {
            let additionalColumns = Math.ceil((this.skewSizeAbs * this.rows) / (this.particleWidth)) * 2;

            for(let row = 0; row < this.rows; row++) {
                for(let column = 0; column < this.cols + additionalColumns; column++) {
                    let x = this.particleWidth * column - this.particleWidth*(additionalColumns/2) + (this.skewSizeAbs * row);
                    let y = this.particleHeight * row;

                    this.particles.push({
                        x: x,
                        y: y,
                        liveTime: this.images[this.currentImage].visibleTime,
                        fill: 'transparent'
                    });
                }
            }
        } else if (this.animationType === 'Transition 2') {
            let particlesPerLine = 4;
            let linesCount = this.animationType === 'Left-Right' || this.animationType === 'Right-left' ? this.rows : this.cols;
            let x;
            let y;

            for (let row = 0; row < linesCount; row++) {
              for (let particle = 0; particle < particlesPerLine; particle++) {
                let width = this.particleWidth;
                y = this.particleHeight * row;

                switch (this.transitionDirection) {
                  case "Left-Right":
                    x = (width + this.skewSizeAbs + width * particle) * -1 /* + this.w / 2 */;
                    break;
                  case "Right-Left":
                    x = (this.w + this.skewSizeAbs) + (width * particle )/*  - this.w / 2 */;
                    break;
                  case "Up-Down":
                    x = width * row;
                    y = this.particleHeight * particle * -1 /* + this.h / 2 */;
                    break;
                  case "Bottom-up":
                    x = width * row;
                    y = this.h + this.particleHeight * particle /* - this.h / 2 */;
                    break;
                }

                // let gradient = this.ctx.createLinearGradient(x - this.skewSizeAbs, y + this.particleHeight/2, x + width + this.skewSizeAbs, y + this.particleHeight/2);
                // gradient.addColorStop(0, 'transparent');
                // gradient.addColorStop(0.33, this.particlesColor);
                // gradient.addColorStop(0.66, this.particlesColor);
                // gradient.addColorStop(1, 'transparent');

                this.particles.push({
                  startXPosition: x,
                  startYPosition: y,
                  x: x,
                  y: y,
                  liveTime: this.images[this.currentImage].visibleTime,
                  fill: 'rgba(255,255, 0,.5)',
                  speed: Math.random() * (particlesPerLine - particle) * 150 + 100
                });
              }
            }

        } else if (this.animationType === 'Transition 3') {

        }
    }

    drawParticles() {
        if (this.animationType === 'Transition 1') {
            this.particles.forEach(({ x, y, fill }, i) => {
                if (fill !== 'transparent') {
                    this.ctx.fillStyle = fill;
                    this.ctx.beginPath();
                    // TODO: DELETE AFTER DEBUG
                    // if (i >= 0) {
                    //     this.ctx.fillStyle = 'rgba(255, 0, 0, .5)';
                    // }
                    // TODO: DELETE AFTER DEBUG
                    this.ctx.moveTo(x - this.skewSize, y);
                    // +1 to fix spaces between particles
                    this.ctx.lineTo(x + this.particleWidth - this.skewSize + 1, y);
                    this.ctx.lineTo(x + this.particleWidth + 1, y + this.particleHeight + 1);
                    this.ctx.lineTo(x, y + this.particleHeight + 1);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            });
        } else if (this.animationType === 'Transition 2') {
            this.particles.forEach(({ x, y, fill }, i) => {
                if (fill !== 'transparent') {
                    this.ctx.fillStyle = fill;
                    this.ctx.beginPath();
                    // TODO: DELETE AFTER DEBUG
                    this.ctx.moveTo(x - this.skewSize, y);
                    // +1 to fix spaces between particles
                    this.ctx.lineTo(x + this.particleWidth - this.skewSize + 1, y);
                    this.ctx.lineTo(x + this.particleWidth + 1, y + this.particleHeight + 1);
                    this.ctx.lineTo(x, y + this.particleHeight + 1);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            });
        } else if (this.animationType === 'Transition 3') {

        }
        
    }

    updateParticles() {
        this.particles.forEach((p, i) => {
            /* start counting of particle lifetime */
            p.liveTime += 1000 / this.frameRate;

            if (this.animationType === 'Transition 1') {
                if (p.liveTime > (this.imageShowTime - this.transitionTime)) {
                    if (p.fill === 'transparent') {
                        p.fill = Math.random() < 0.25 ? this.currentColor : 'transparent';
                    }
                    
                    if (p.liveTime > this.imageShowTime) {
                        p.fill = Math.random() < 0.25 ? 'transparent' : this.currentColor;

                        if (p.fill === 'transparent') {
                            p.liveTime = this.images[this.currentImage].visibleTime;
                        }
                    }
                }
            } else if (this.animationType === 'Transition 2') {
                let xStep = p.speed;
                let yStep = p.speed;
                let isOverEdge;
                

                // set values according to direction of the animation
                switch (this.transitionDirection) {
                    case 'Left-Right':
                        yStep = 0;
                        isOverEdge = p.x > this.w + this.skewSizeAbs;
                        break;
                    case 'Right-Left':
                        xStep *= -1;
                        yStep = 0;
                        isOverEdge = p.x < (this.particleWidth + this.skewSizeAbs) * -1;
                        break;
                    case 'Up-Down':
                        xStep = 0;
                        isOverEdge = p.y > this.h;
                        break;
                    case 'Bottom-up':
                        xStep = 0;
                        yStep *= -1;

                        isOverEdge = p.y < this.particleHeight * -1;
                        break;
                }

                // apply values
                if (p.liveTime >= (this.imageShowTime - this.transitionTime)) {
                    
                    p.x += xStep;
                    p.y += yStep;

                    if (isOverEdge) {
                        p.x = p.startXPosition;
                        p.y = p.startYPosition;

                        if (p.liveTime >= this.imageShowTime - this.transitionTime) {
                            p.liveTime = this.images[this.currentImage].visibleTime;
                            // fill with color
                            this.currentColor = (this.currentImage + 1) % 2 === 0 ? this.particlesColor2 : this.particlesColor;
                            p.fill = this.currentColor;
                        }
                    }
                } else {
                    p.fill = 'transparent';
                }

            } else if(this.animationType === 'Transition 3') {

            }
        });
    }

    draw() {
        this.clear();
        this.drawImages();
        this.drawParticles();
    }

    update() {
        this.updateImages();
        this.updateParticles();
    }

    clear() {
        this.ctx.clearRect(0,0, this.w, this.h);
    }

    fixFrameRate() {
        // get the proper frameRate count in case if it is more than 60
        if ((new Date().getTime() - this.startTime) <= 1000) {
            this.framesPerSecond += 1;
        } else {
            this.startTime = new Date().getTime();

            if (this.frameRate < this.framesPerSecond) {
                this.frameRate = this.framesPerSecond;
            }

            this.framesPerSecond = 0;
        }
    }

    render() {
        if (!this.isPaused) {
            this.fixFrameRate();
            
            this.draw();
            this.update();
        }

        
        this.loop = window.requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        if (this.loop) { 
            window.cancelAnimationFrame(this.loop);
            this.loop = null;
        }
    }
}

let banner;

// helpers start
const settings = document.getElementById('settings');
const checkBox = document.getElementById('toggler');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
let myEv = new Event('settings-changed');

window.addEventListener('settings-changed', addSettings);

playBtn.addEventListener('click', () => {
    if (banner) {
        banner.isPaused = false;
    }

    playBtn.classList.add('active');
    pauseBtn.classList.remove('active');
});
pauseBtn.addEventListener('click', () => {
    if (banner) {
        banner.isPaused = true;
    }

    pauseBtn.classList.add('active');
    playBtn.classList.remove('active');
});

checkBox.addEventListener('change', (e) => e.stopPropagation());
settings.addEventListener('change', () => {window.dispatchEvent(myEv)});



let timeout;
addSettings();


function addSettings() {
    clearTimeout(timeout);

    const animationType = document.getElementById('animation-type').value;
    const transitionDirection = document.getElementById('direction').value;
    const transitionTime = +document.getElementById('speed').value;
    const imageShowTime = +document.getElementById('image-duration').value;
    const particlesPerRow = +document.getElementById('particles-per-row').value;
    const particlesPerColumn = +document.getElementById('particles-per-column').value;
    const particlesColor = document.getElementById('particles-color').value;
    const particlesColor2 = document.getElementById('particles-color2').value;
    const skewSize = +document.getElementById('skew').value
    
    if (banner) {
        banner.destroy();
        banner = {};
    }

    playBtn.classList.add('active');
    pauseBtn.classList.remove('active');

    Widget.properties = {
        ...Widget.properties,
        animationType,
        transitionDirection,
        transitionTime,
        imageShowTime,
        particlesPerRow,
        particlesPerColumn,
        particlesColor,
        particlesColor2,
        skewSize
    }

    banner = new myBanner({
        ...Widget.properties
    });
}
//helpers end