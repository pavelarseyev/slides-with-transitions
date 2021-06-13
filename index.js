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
        animationType: 'Transition 1',
        transitionDirection: 'Left-Right',
        particlesPerColumn: 10,
        particlesPerRow: 10,
        particlesColor: 'rgb(0,255,0)'
    }
}

let loop;

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
        this.skewPercent = 0.1;
        this.skewSize = this.particleWidth * this.skewPercent;
        //set dimensions end

        this.isPaused = false;

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
        let additionalColumns = Math.ceil((this.skewSize * this.rows) / (this.particleWidth - this.skewSize)) * 2;

        for(let row = 0; row < this.rows; row++) {
            for(let column = 0; column < this.cols + additionalColumns; column++) {
                x = this.particleWidth * column - this.particleWidth*(additionalColumns/2);
                y = this.particleHeight * row;

                switch (this.animationType) {
                    case 'Transition 1':        
                        
                        break;
                    case 'Transition 2':

                        break;
                    case 'Transition 3':

                        break;
                }

                this.particles.push({
                    x: x,
                    y: y,
                    row: row,
                    col: column,
                    liveTime: this.images[this.currentImage].visibleTime,
                    fill: 'transparent'
                });
            }
        }
    }
    
    drawParticles() {
        this.particles.forEach(({x, y, fill, row}, i) => {
            if (fill !== 'transparent') {
                const offset = this.skewSize * row; 

                this.ctx.fillStyle = fill;
                this.ctx.beginPath();
                // if (i >= 0) {
                //     this.ctx.fillStyle = 'rgba(255, 0, 0, .5)';
                // }
                this.ctx.moveTo(x - this.skewSize + offset, y);
                // +0.5to fix spaces between particles
                this.ctx.lineTo(x + this.particleWidth - this.skewSize + 0.5 + offset, y);
                this.ctx.lineTo(x + this.particleWidth + 0.5 + offset, y + this.particleHeight + 0.5);
                this.ctx.lineTo(x + offset, y + this.particleHeight + 0.5);
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
    }

    updateParticles() {
        this.particles.forEach(p => {
            switch (this.animationType) {
                case 'Transition 1':
                    p.liveTime += 1000 / this.frameRate;

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

                    break;
                case 'Transition 2':

                    break;
                case 'Transition 3':

                    break;
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
        this.fixFrameRate();
        
        if (!this.isPaused) {
            this.update();
            this.draw();
        }
        
        loop = window.requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        if (loop) { 
            window.cancelAnimationFrame(loop);
            loop = null;
        }
    }
}

let banner;

// helpers start
const settings = document.getElementById('settings');
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
settings.addEventListener('change', () => {window.dispatchEvent(myEv)});

addSettings();

function addSettings() {
    const animationType = document.getElementById('animation-type').value;
    const transitionDirection = document.getElementById('direction').value;
    const transitionTime = +document.getElementById('speed').value;
    const imageShowTime = +document.getElementById('image-duration').value;
    const particlesPerRow = +document.getElementById('particles-per-row').value;
    const particlesPerColumn = +document.getElementById('particles-per-column').value;
    const particlesColor = document.getElementById('particles-color').value;
    
    if (banner) {
        banner.destroy();
        banner = {};
    }

    Widget.properties = {
        ...Widget.properties,
        animationType,
        transitionDirection,
        transitionTime,
        imageShowTime,
        particlesPerRow,
        particlesPerColumn,
        particlesColor
    }

    banner = new myBanner({
        ...Widget.properties
    });
}
//helpers end