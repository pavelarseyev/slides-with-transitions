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
        particlesColor: 'rgba(255,255,255, 1)',
        particlesColor2: 'rgb(0,0,0, 1)',
        particlesPerColumn: 10,
        particlesPerRow: 10,
        skewSize: 1
    }
}

class myBanner {
    constructor(options, debug) {
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
        this.shadowColor = '';
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
        this.skewSize = Math.floor(this.particleWidth * this.skewPercent);
        this.skewSizeAbs = Math.abs(this.skewSize);
        this.currentClipPosition = this.w * this.skewSize;
        //set dimensions end
        this.debug = debug;
        this.isPaused = true;
        this.loop = null;

        //wait until all images are loaded
        Promise.all(this.createImages(options)).then(async () => {
            this.calculateShadowColor();
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

    calculateShadowColor() {
        let colorArray = this.currentColor.split(',');
        let alpha = parseFloat(colorArray[colorArray.length - 1].replace(/[^0-9.]/gi, '')) / 2;
        this.shadowColor = this.currentColor.replace(/(\d\))$/gi, `${alpha})`);
    }

    changeCurrentImageOnLoop(current, instantly) {
        if (!instantly) {
            if (current.visibleTime > this.imageShowTime) {
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
                current.visibleTime = 0;
            }
        } else {
            this.currentImage++;
            this.currentImage = this.currentImage % this.images.length;
            current.visibleTime = 0;
        }
    }

    //TODO: add Widget.optimisedImageUrls
    createImages(options) {
        const promiseArray = [];

        for(let i = 0; i < this.maxImages; i++) {
            promiseArray.push(new Promise((res, rej) => {
                const img = document.createElement('img');
                img.width = this.w;
                img.height = this.h;
                img.crossOrigin = 'Anonymous';
                img.onload = res;
                img.src = options[`img${i+1}`];
                this.images.push({
                    img,
                    opacity: i === 0 ? 1 : 0,
                    visibleTime: 0
                });
            }));
        }

        return promiseArray;
    }

    drawImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.animationType === 'Transition 1' || this.animationType === 'Transition 3') {
            [current, next].forEach(image => {
                this.ctx.save();
                this.ctx.globalAlpha = image.opacity;
                this.ctx.drawImage(image.img, 0, 0, this.w, this.h);
                this.ctx.restore();
            });
        } else if (this.animationType === 'Transition 2') {
            let clipTopXPoint;
            let clipBottomXPoint;

            if (this.skewSize < 0) {
                clipTopXPoint = this.currentClipPosition;
                clipBottomXPoint = this.currentClipPosition + this.skewSizeAbs * this.rows;
            } else if (this.skewSize > 0) {
                clipTopXPoint = this.currentClipPosition + this.skewSizeAbs * this.rows;
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
            // draw shadow
            this.ctx.shadowOffsetX = -this.particleWidth + 5;
            this.ctx.shadowOffsetY = 0;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.shadowColor;
            this.ctx.fillStyle = 'none';
            this.ctx.beginPath();
            this.ctx.moveTo(clipTopXPoint + 5, 0);
            this.ctx.lineTo(clipTopXPoint + this.particleWidth, 0);
            this.ctx.lineTo(clipBottomXPoint + this.particleWidth, this.h);
            this.ctx.lineTo(clipBottomXPoint + 5, this.h);
            this.ctx.closePath();
            this.ctx.fill();
            
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

        }

        if (this.debug) {
            this.ctx.save();
            this.ctx.fillStyle = 'blue';
            this.ctx.font = `${this.h / 6}px sans-serif`;
            let text = this.ctx.measureText("Image 1");
            this.ctx.fillText(`Image ${this.currentImage}`, this.w/2 - text.width/2, this.h/2 - this.h / 12);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    updateImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.animationType === 'Transition 1' || this.animationType === 'Transition 3') {
            if (current.visibleTime <= 0) {
                current.opacity = 1;
            }

            if (this.animationType === 'Transition 1') {
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
            }

            this.changeCurrentImageOnLoop(current);
           
        } else if (this.animationType === 'Transition 2') {
            this.changeCurrentImageOnLoop(current);

            if (current.visibleTime >= this.imageShowTime - (this.transitionTime / 3)) {
                let clipStep = (this.w + this.particleWidth + (this.skewSizeAbs * this.rows)) / ((this.transitionTime / 3) / (1000 / this.frameRate));

                if (this.transitionDirection === 'Left-Right') {
                    this.currentClipPosition += clipStep;
                } else if (this.transitionDirection === 'Right-Left') {
                    this.currentClipPosition -= clipStep;
                }
            } else {
                if (this.transitionDirection === 'Left-Right') {
                    this.currentClipPosition = 0 - (this.particleWidth + this.skewSizeAbs * this.rows);
                } else if (this.transitionDirection === 'Right-Left') {
                    this.currentClipPosition = this.w + (this.particleWidth + this.skewSizeAbs * this.rows);
                }
            }

        }

        current.visibleTime += 1000 / (this.frameRate);
    }

    createParticles() {
        if (this.animationType === 'Transition 1' || this.animationType === 'Transition 3') {
            let additionalColumns = Math.ceil((this.skewSizeAbs * this.rows) / (this.particleWidth)) * 2;
            let totalColumns = this.cols + additionalColumns;
            let offsetStep = this.particleWidth * 1.5;

            for(let row = 0; row < this.rows; row++) {
                for(let column = 0; column < totalColumns; column++) {
                    let additionalColumnsOffset = this.particleWidth * (additionalColumns/2);
                    let skewOffset = (this.skewSize * (this.rows - row - 1));

                    let x = this.particleWidth * column - additionalColumnsOffset + skewOffset;
                    let y = this.particleHeight * row;
                    let endXPosition = x;
                    let endYPosition = y;
                    let rowOffset = offsetStep * (this.rows - row - 1);
                    let path = this.w + additionalColumnsOffset + rowOffset;
                    let colOffset;
                    let fill = 'transparent';
                    
                    if (this.animationType === 'Transition 3') {
                        fill = this.currentColor;
                        // move particles to start position outside of the screen;
                        if (this.transitionDirection === 'Left-Right') {
                            colOffset = offsetStep * (totalColumns - column - 1);
                            path += colOffset;

                            if (this.skewSize > 0) {
                                path += this.skewSizeAbs + this.skewSize * (this.rows - row - 1);
                            }

                            x -= path;
                        } else if (this.transitionDirection === 'Right-Left') {
                            colOffset = offsetStep * column;

                            path += colOffset;

                            if (this.skewSize < 0) {
                                path += this.skewSizeAbs;
                            }
                            
                            x += path;
                        }
                    }

                    this.particles.push({
                        startXPosition: x,
                        startYPosition: y,
                        endXPosition,
                        endYPosition,
                        x: x,
                        y: y,
                        path,
                        row,
                        totalColumns: totalColumns,
                        col: column,
                        liveTime: this.images[this.currentImage].visibleTime,
                        fill
                    });
                }
            }
        } else if (this.animationType === 'Transition 2') {
            let particlesPerLine = 1;
            let linesCount = (this.animationType === 'Left-Right' || this.animationType === 'Right-left') ?  this.cols : this.rows;
            let x;
            let y;

            for (let row = 0; row < linesCount; row++) {
              for (let particle = 0; particle < particlesPerLine; particle++) {
                y = this.particleHeight * row;

                switch (this.transitionDirection) {
                    case "Left-Right":
                        x = (this.particleWidth + this.skewSizeAbs + this.particleWidth * particle) * -1;
                        break;
                    case "Right-Left":
                        x = (this.w + this.skewSizeAbs) + (this.particleWidth * particle );
                        break;
                    case "Up-Down":
                        x = this.particleWidth * row;
                        y = this.particleHeight * particle * -1;
                        break;
                    case "Bottom-up":
                        x = this.particleWidth * row;
                        y = this.h + this.particleHeight * particle;
                        break;
                }

                this.particles.push({
                  startXPosition: x,
                  startYPosition: y,
                  x: x,
                  y: y,
                  row,
                  liveTime: this.images[this.currentImage].visibleTime,
                  fill: this.currentColor,
                  speed: (Math.random() * 75 + 75)
                });
              }
            }

        }
    }

    drawParticles() {
        if (this.debug) {
            this.ctx.font = '24px sans-serif';
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "top";
        }

        if (this.debug) {
            this.ctx.strokeStyle = 'yellow';
        }

        this.particles.forEach(({ x, y, fill }, i) => {
            if (fill !== 'transparent') {
                if (this.debug) {
                    this.ctx.fillStyle = 'rgba(255, 0,0, .5)';
                } else {
                    this.ctx.fillStyle = fill;
                }
                
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.skewSize, y);
                // +1 to fix spaces between particles
                this.ctx.lineTo(x + this.particleWidth + this.skewSize + 1, y);
                this.ctx.lineTo(x + this.particleWidth + 1, y + this.particleHeight + 1);
                this.ctx.lineTo(x, y + this.particleHeight + 1);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }
          
            if (this.debug) {
                this.ctx.stroke();
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'green';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + this.particleWidth, y);
                this.ctx.lineTo(x + this.particleWidth, y + this.particleHeight);
                this.ctx.lineTo(x, y + this.particleHeight);
                this.ctx.closePath();
                this.ctx.stroke();

                this.ctx.fillStyle = "#ffff00"; 
                this.ctx.font = '24px sans-serif'; 
                this.ctx.fillText(`${i}`, x + 10, y + 10);
                this.ctx.restore();
            }

        });
    }

    updateParticles() {
        this.particles.forEach((p, i) => {
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
                let acceleration;

                if (this.transitionDirection === 'Left-Right') {
                    acceleration = Math.abs(p.x / this.w * p.speed) + 0.1;
                } else if (this.transitionDirection === 'Right-Left') {
                    acceleration = Math.abs(Math.abs(p.x / this.w - 1) * p.speed) + 0.1;
                }


                let xStep = p.speed + acceleration;
                let yStep = p.speed + acceleration;
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
                if (p.liveTime >= this.imageShowTime - this.transitionTime) {
                    p.x += xStep;
                    p.y += yStep;

                    if (isOverEdge) {
                        p.x = p.startXPosition - 10;
                        p.y = p.startYPosition - 10;

                        // uncomment in case if we want to move particles to the current position of clip line
                        if (p.liveTime > this.imageShowTime - (this.transitionTime / 2)) {
                            p.x = this.currentClipPosition + this.skewSize * (p.row + 1);

                            if (this.transitionDirection === 'Right-Left') {
                                p.x -= this.particleWidth;
                            }
                        }

                        if (p.liveTime >= this.imageShowTime) {
                            p.liveTime = this.images[this.currentImage].visibleTime;
                            // fill with color
                            this.currentColor = (this.currentImage + 1) % 2 === 0 ? this.particlesColor2 : this.particlesColor;
                            this.calculateShadowColor();
                            p.fill = this.currentColor;
                        }
                    }
                }
            } else if(this.animationType === 'Transition 3') {
                let transitionStep = this.transitionTime / 3;
                let xStep = p.path / (transitionStep / (1000 / this.frameRate));

                if (p.liveTime >= this.imageShowTime - this.transitionTime + transitionStep) {
                    // start moving
                    if (p.liveTime < this.imageShowTime) {
                        if (this.transitionDirection === 'Left-Right') {                        
                            if (p.x < p.endXPosition - xStep) {
                                p.x += xStep;
                            } else {
                                p.x += p.endXPosition - p.x;
                            }
                        } else if (this.transitionDirection === 'Right-Left') {
                            if (p.x > p.endXPosition + xStep) {
                                p.x -= xStep;
                            } else {
                                p.x -= p.x - p.endXPosition;
                            }
                        }
                    } else {
                        let rowSpeed = this.skewSizeAbs * (p.row + 1);
                        if (this.transitionDirection === 'Left-Right') {                        
                            p.x += this.skewSizeAbs * (p.col + 1) + rowSpeed;
                        } else if (this.transitionDirection === 'Right-Left') {
                            p.x -= this.skewSizeAbs * (p.totalColumns - p.col) + rowSpeed;
                        }
    
                        if (p.liveTime >= this.imageShowTime + transitionStep) {
                            p.y = p.startYPosition;
                            p.x = p.startXPosition;
                            p.liveTime = this.images[this.currentImage].visibleTime;
                        }
                    }
                }
            }

            /* start counting of particle lifetime */
            p.liveTime += 1000 / this.frameRate;
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
        this.draw();

        if (!this.isPaused) {
            this.fixFrameRate();    
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
const debugInput = document.getElementById('debug-input');
const checkBox = document.getElementById('toggler');
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
let myEv = new Event('settings-changed');
let paused = false;

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
debugInput.addEventListener('change', (e) => {
    e.stopPropagation();
    if (banner) {
        banner.debug = debugInput.checked;
    }
});
window.addEventListener('keypress', (e) => {
    if (e.code === 'Space') {
        paused = !paused;
        if (paused) {
            pauseBtn.click();
        } else {
            playBtn.click();
        }
    }
})



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
    let particlesColor = document.getElementById('particles-color').value;
    let particlesColor2 = document.getElementById('particles-color2').value;
    const skewSize = +document.getElementById('skew').value
    
    if (banner) {
        banner.destroy();
        banner = {};
    }

    particlesColor = convertHexToRgbA(particlesColor, 1);
    particlesColor2 = convertHexToRgbA(particlesColor2, 1);


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
    }, false);

    debugInput.checked = false;
}

function convertHexToRgbA(hex, a) {
              
    // Convert the first 2 characters to hexadecimal
    let r = parseInt(hex.substring(1, 3), 16),
      
    // Convert the middle 2 characters to hexadecimal
    g = parseInt(hex.substring(3, 5), 16),
          
    // Convert the last 2 characters to hexadecimal
    b = parseInt(hex.substring(5, 7), 16);
          
    // append them all
    return "rgba(" + r + ", " + g + ", "
            + b + ", " + a + ")";
}
//helpers end