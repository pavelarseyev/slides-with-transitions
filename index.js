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

    createParticles() {
        let x = 0;
        let y = 0;
        let additionalColumns = Math.ceil((Math.abs(this.skewSize) * this.rows) / (this.particleWidth)) * 2;
        let fill = this.particlesColor;
        let speedReferencePoint;

        for(let row = 0; row < this.rows; row++) {
            for(let column = 0; column < this.cols + additionalColumns; column++) {
                x = this.particleWidth * column - this.particleWidth*(additionalColumns/2) + (this.skewSize * row);
                y = this.particleHeight * row;

                if (this.animationType === 'Transition 1') {
                    fill = 'transparent';

                } else if (this.animationType === 'Transition 2') {

                    switch (this.transitionDirection) {
                        case 'Left-Right':
                            // move x position by canvas width + columns count multiple by particle width plus doubled skewSize + row skew summ
                            x = (this.particleWidth + this.skewSize) * -1 - (Math.random(this.particleWidth) + this.particleWidth);
                            speedReferencePoint = column;
                            break;
                        case 'Right-Left':
                            x = this.w + this.skewSize + (Math.random(this.particleWidth) + this.particleWidth);
                            speedReferencePoint = column;
                            break;
                        case 'Up-Down':
                            y = (this.particleHeight + 2) * -1;
                            speedReferencePoint = row;
                            break;
                        case 'Bottom-up':
                            y = this.h + 2;
                            speedReferencePoint = row;
                            break;
                        /* case 'Center-Out':
                            
                            break;
                        case 'Out-center':
    
                            break; */
                    }
                } else if (this.animationType === 'Transition 3') {

                }

                this.particles.push({
                    startXPosition: x,
                    startYPosition: y,
                    x: x,
                    y: y,
                    row: row,
                    col: column,
                    liveTime: this.images[this.currentImage].visibleTime,
                    fill: fill,
                    speedReferencePoint
                });
            }
        }
    }
    
    drawParticles() {
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
    }

    updateParticles() {
        this.particles.forEach((p, i) => {
            /* start counting of particle lifetime */
            p.liveTime += 1000 / this.frameRate;

            if (this.animationType === 'Transition 1') {
                if (p.liveTime > (this.imageShowTime - this.transitionTime)) {
                    if (p.fill === 'transparent') {
                        p.fill = Math.random() < 0.25 ? this.particlesColor : 'transparent';
                    }
                    
                    if (p.liveTime > this.imageShowTime) {
                        p.fill = Math.random() < 0.25 ? 'transparent' : this.particlesColor;

                        if (p.fill === 'transparent') {
                            p.liveTime = this.images[this.currentImage].visibleTime;
                        }
                    }
                }
            } else if (this.animationType === 'Transition 2') {
                let finalSpeed = Math.random() * 150 + (p.speedReferencePoint + 1) * 50;
                // let finalSpeed = 10;
                let xStep = finalSpeed;
                let yStep = finalSpeed;
                let isOverEdge;

                // set values according to direction of the animation
                switch (this.transitionDirection) {
                    case 'Left-Right':
                        yStep = 0;
                        isOverEdge = p.x > this.w + this.skewSize;
                        break;
                    case 'Right-Left':
                        xStep *= -1;
                        yStep = 0;
                        isOverEdge = p.x < (this.particleWidth + this.skewSize) * -1;
                        break;
                    case 'Up-Down':
                        xStep = 0;
                        isOverEdge = p.y > this.h;
                        break;
                    case 'Bottom-up':
                        xStep = 0;
                        yStep *= -1;

                        isOverEdge = p.y < -this.particleHeight;
                        break;
                }

                // apply values
                if (p.liveTime > (this.imageShowTime - (this.transitionTime * 2))) {
                    p.x += xStep;
                    p.y += yStep;

                    if (isOverEdge) {
                        p.x = p.startXPosition;
                        p.y = p.startYPosition;

                        if (p.liveTime >= this.imageShowTime) {
                            p.liveTime = this.images[this.currentImage].visibleTime;
                            // fill with color
                            p.fill = (this.currentImage + 1) % 2 === 0 ? this.particlesColor2 : this.particlesColor;
                        }
                    }
                }

            } else if(this.animationType === 'Transition 3') {

            }
        });
    }

    drawImages() {
        this.images.forEach((item, i) => {
            if (item.opacity > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = item.opacity;
                //Show the images in a row
                // this.ctx.drawImage(item.img, i* (this.w/this.images.length), 0, this.w/this.maxImages, this.h);
                
                this.ctx.drawImage(item.img, 0, 0, this.w, this.h);
                
                this.ctx.restore();
            }
        });
    }

    updateImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (current.visibleTime <= 0) {
            current.opacity = 1;
        }

        current.visibleTime += 1000 / this.frameRate; 

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
            } else {
                current.visibleTime = 0;
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
            }
        }
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
        
        
            this.update();
            this.draw();
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