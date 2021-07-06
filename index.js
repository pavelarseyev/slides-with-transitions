const Widget = {
    properties: {
        img1: `img1.png`,
        img2: `img2.png`,
        img3: `img3.png`,
        img4: `img4.png`,
        imageFit: 'Cover',
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
        skewSize: 1,
        useAdditionalColors: true,
        additionalColor1: 'rgba(143, 126, 244, 1)',
        additionalColor2: 'rgba(12, 196, 142, 1)',
        additionalColor3: 'rgba(201, 56, 169, 1)',
        color1Percent: 30,
        color2Percent: 20,
        color3Percent: 40,
    }
}

const LTR = 'Left-Right';
const RTL = 'Right-Left';
const UD = 'Up-Down';
const BU = 'Bottom-Up';
const TR1 = 'Transition 1';
const TR2 = 'Transition 2';
const TR3 = 'Transition 3';
const COVER = 'Cover';
const CONTAIN = 'Contain';

class myBanner {
    constructor(options, debug) {
        this.frameRate = 60;
        this.startTime = new Date().getTime();
        this.framesPerSecond = 0;
        this.animationType = options.animationType;
        this.transitionDirection = options.transitionDirection;
        

        //transition options start
        this.transitionTime = 0;
        this.transitionTimeThird = 0;

        this.imageShowTime = 0;
        
        this.currentTime = 0;
        this.totalTime = 0;
        //transition options end

        // particles settings start
        this.rows = options.particlesPerColumn > 0 ? options.particlesPerColumn : 10;
        this.cols = options.particlesPerRow > 0 ? options.particlesPerRow : 10;
        this.particlesColor = options.particlesColor;
        this.particlesColor2 = options.particlesColor2;
        this.currentColor = this.particlesColor;
        this.useAdditionalColors = options.useAdditionalColors;
        this.additionalColor1 = options.additionalColor1;
        this.color1Percent = Math.min(100, Math.max(0, options.color1Percent));
        this.additionalColor2 = options.additionalColor2;
        this.color2Percent = Math.min(100, Math.max(0, options.color2Percent));
        this.additionalColor3 = options.additionalColor3;
        this.color3Percent = Math.min(100, Math.max(0, options.color3Percent));
        this.shadowColor = '';
        this.particles = [];
        // particles settings end

        //image options start
        this.images = [];
        this.currentImage = 0;
        this.imageFit = options.imageFit;
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
        this.skewSize = 0;
        this.skewSizeAbs = 0;
        this.clipLine = {
            startXPos: 0,
            startYPos: 0,
            endXPos: 0,
            endYPos: 0,
            currentXPos: 0,
            currentYPos: 0,
            clipTopXPoint: 0,
            clipBottomXPoint: 0,
            clipLeftYPoint: 0,
            clipRightYPoint: 0,
            pathX: 0,
            pathY: 0,
        };


        //set dimensions end
        this.debug = debug;
        this.isPaused = false;
        this.loop = null;

        //wait until all images are loaded
        
        Promise.all(this.createImages(options)).then(results => {
            if (results.length && results[0]) {
                results.forEach(img => this.images.push(img));
                this.normalizeImageSize();
            }
            this.setTotalTime(options);
            this.calcSkewSize();
            this.calculateShadowColor();
            this.setupResize();
            this.createParticles();
            this.createClipLine();
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
        this.calcSkewSize();
        this.normalizeImageSize();
        this.particles = [];
        this.createParticles();
        this.createClipLine();
    }

    resetPositionsAndColors() {
        // reset color
        this.currentColor = this.particlesColor;
        this.calculateShadowColor();

        //reset clipLine
        this.createClipLine();

        //reset particles position
        this.createParticles();
    }

    isLTR() {
        return this.transitionDirection === LTR;
    }

    isRTL() {
        return this.transitionDirection === RTL;
    }

    isUD() {
        return this.transitionDirection === UD;
    }

    isBU() {
        return this.transitionDirection === BU;
    }

    isHorizontal() {
        return this.isLTR() || this.isRTL();
    }

    isVertical() {
        return this.isUD() || this.isBU();
    }

    isTR1() {
        return this.animationType === TR1;
    }

    isTR2() {
        return this.animationType === TR2;
    }

    isTR3() {
        return this.animationType === TR3;
    }

    msPerFrame() {
        return 1000 / this.frameRate;
    }

    // transition time part per frame
    frameStep() {
        return this.transitionTime / this.msPerFrame();
    }

    // short transition part per frame
    frameShortStep() {
        return this.transitionTimeThird / this.msPerFrame();
    }

    calcSkewSize() {
        if (this.isHorizontal()) {
            this.skewSize = this.particleWidth * this.skewPercent;
        } else if (this.isVertical()) {
            this.skewSize = this.particleHeight * this.skewPercent;
        }
        
        this.skewSizeAbs = Math.abs(this.skewSize);
    }

    updateCurrentTime() {
        this.changeCurrentImageOnLoop();

        if (this.currentTime > this.totalTime) {
            this.currentTime = 0;
        }

        this.currentTime += this.msPerFrame();
    }

    calculateShadowColor() {
        let colorArray = this.currentColor.split(',');
        let alpha = parseFloat(colorArray[colorArray.length - 1].replace(/[^0-9.]/gi, '')) / 2;
        this.shadowColor = this.currentColor.replace(/(\d\))$/gi, `${alpha})`);
    }

    setTotalTime(options) {
        this.transitionTime = +options.transitionTime > 0 ? +options.transitionTime * 100 : 1000;
        this.transitionTimeThird = this.transitionTime / 3;
        // image show time (from settings or from widget duration)
        
        if (this.images.length) {
            this.imageShowTime = (+options.imageShowTime > 0 ? +options.imageShowTime * 1000 : 3000);
        }

        this.totalTime = this.imageShowTime + this.transitionTime;
    }

    changeCurrentImageOnLoop() {
        if (this.images.length) {
            if (this.currentTime >= this.totalTime) {
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
            }
        }
    }

    normalizeImageSize() {
        if (this.images.length) {
            this.images.forEach(image => {
                let width = image.width * this.ratio;
                let height = image.height * this.ratio;

                if (this.imageFit === COVER) {
                    let xRatio = this.w / width;
                    let yRatio = this.h / height;

                    let ratio = Math.max(xRatio, yRatio);

                    image.width *= ratio;
                    image.height *= ratio;
                   
                } else if (this.imageFit === CONTAIN) {
                    let xRatio = this.w / image.width;
                    let yRatio = this.h / image.height;
    
                    let ratio = Math.min(xRatio, yRatio);
    
                    image.width *= ratio;
                    image.height *= ratio;
                }
            })
        }
    }

    //TODO: add Widget.optimisedImageUrls
    createImages(options) {
        const promiseArray = [];
        const imgUrls = [];

        if (options.img1) {
            imgUrls.push(options.img1);
        }
        if (options.img2) {
            imgUrls.push(options.img2);
        }
        if (options.img3) {
            imgUrls.push(options.img3);
        }
        if (options.img4) {
            imgUrls.push(options.img4);
        }

        if (imgUrls.length) {
            imgUrls.forEach((url, i) => {
                promiseArray.push(new Promise((res, rej) => {
                    const img = document.createElement('img');

                    img.crossOrigin = 'Anonymous';

                    img.onload = () => {
                        document.body.appendChild(img);

                        res({
                            img,
                            width: img.width,
                            height: img.height,
                            opacity:  0
                        });

                        img.remove();
                    };

                    img.src = url;
                }));
            });
            return promiseArray;
        } else {
            return [Promise.resolve()];
        }        
    }

    drawSingleImage(image) {
        let width = image.width * this.ratio;
        let height = image.height * this.ratio;
        let centerX = this.w/2 - width/2;
        let centerY = this.h/2 - height/2;
        this.ctx.drawImage(image.img, centerX, centerY, width, height);
    }

    drawImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.isTR1()) {
            [next, current].forEach(image => {
                this.ctx.save();
                this.ctx.globalAlpha = image.opacity;
                this.drawSingleImage(image);
                this.ctx.restore();
            });
        } else if (this.isTR2()) {
            this.ctx.fillStyle = 'transparent';

            // draw firstImage start
            this.ctx.save();

            if (this.debug) {
                this.ctx.font = '20px sans-serif';
                this.ctx.strokeStyle = 'orange';
            }

            if (this.isHorizontal()) {
                this.drawLeftClip();
            } else if (this.isVertical()) {
                this.drawBottomClip();
            }
            
            if ( this.isLTR() || this.isBU() ) {
                this.drawSingleImage(next);

                if (this.debug) {
                    this.ctx.strokeText('Next', 20, this.h/2);
                }
            } else if (this.isRTL() || this.isUD()) {
                this.drawSingleImage(current);
                if (this.debug) {
                    this.ctx.strokeText('Current', 20, this.h/2);
                }
            }
            this.ctx.restore();
            // draw firstImage end

            // draw second image start
            this.ctx.save();
            if (this.debug) {
                this.ctx.font = '20px sans-serif';
                this.ctx.strokeStyle = 'orange';
            }

            if (this.isHorizontal()) {
                this.drawRightClip();
            } else if (this.isVertical()) {
                this.drawTopClip();
            }

            if (this.isLTR() || this.isBU()) {
                this.drawSingleImage(current);
                
                if (this.debug) {
                    this.ctx.strokeText('Current', this.w - 200, this.h/2);
                }
            } else if (this.isRTL() || this.isUD()) {
                this.drawSingleImage(next);
                
                if (this.debug) {
                    this.ctx.strokeText('Current', this.w - 200, this.h/2);
                }
            }
            this.ctx.restore();
        } else if (this.isTR3()) {
            [current, next].forEach(image => {
                if (image.opacity) { 
                    this.drawSingleImage(image);
                }
            });
        }

        if (this.debug) {
            this.ctx.save();
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 3;
            this.ctx.font = `${this.h / 6}px sans-serif`;
            let text = this.ctx.measureText("Image 1");
            this.ctx.strokeText(`Image ${this.currentImage}`, this.w/2 - text.width/2, this.h/2 - this.h / 12);
            this.ctx.restore();
        }
    }

    updateImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.isTR1()) {
            if (this.currentTime >= (this.totalTime - this.transitionTime + this.transitionTimeThird)) {
                const changeOpacityStep = 1 / ((this.transitionTime - this.transitionTimeThird) / this.msPerFrame());

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
            } else {
                current.opacity = 1;
            }
        } else if (this.isTR3()) {
            if (this.currentTime >= this.totalTime - this.transitionTimeThird) {
                current.opacity = 0;
                next.opacity = 1;
            } else {
                current.opacity = 1;
                next.opacity = 0;
            }
        }
    }

    createParticles() {
        this.particles = [];

        if (this.isTR1() || this.isTR3()) {
            let draw = false;
            let additionalColumns = 0;
            let additionalRows = 0;

            if (this.isHorizontal()) {
                additionalColumns = Math.ceil((this.skewSizeAbs * this.rows) / this.particleWidth) * 2;
            } else if (this.isVertical()) {
                additionalRows = Math.ceil((this.skewSizeAbs * this.cols) / this.particleHeight) * 2;
            }
            let totalRows = this.rows + additionalRows;
            let totalColumns = this.cols + additionalColumns;
            let offsetXStep = this.particleWidth * 1.5;
            let offsetYStep = this.particleHeight * 1.5;

            for(let row = 0; row < totalRows; row++) {
                for(let column = 0; column < totalColumns; column++) {
                    let additionalColumnsOffset = this.particleWidth * (additionalColumns/2);
                    let additionalRowsOffset = this.particleHeight * (additionalRows/2);
                    let skewXOffset = this.skewSize * (totalRows - row - 1);
                    let skewYOffset = this.skewSize * (totalColumns - column - 1);
                    let liveTimeShowOffset = Math.random() * (this.transitionTimeThird*2);
                    let liveTimeHideOffset = Math.random() * this.transitionTimeThird;  

                    let x = this.particleWidth * column;
                    let y = this.particleHeight * row;

                    if (this.isHorizontal()) {
                        x = x - additionalColumnsOffset + skewXOffset;
                    } else if (this.isVertical()) {
                        y = y - additionalRowsOffset + skewYOffset;
                    }

                    let endXPosition = x;
                    let endYPosition = y;
                    let particleRowOffset = offsetXStep * (totalRows - row - 1);
                    let particleColumnOffset = offsetYStep * (totalColumns - column - 1)
                    let pathX = this.w + additionalColumnsOffset + particleRowOffset;
                    let pathY = this.h + additionalRowsOffset + particleColumnOffset;
                    let colOffset;
                    let rowOffset;
                    

                    // add field for transition 3 particles
                    if (this.isTR3()) {
                        draw = true;
                        // move particles to start position outside of the screen;
                        if (this.isLTR()) {
                            colOffset = offsetXStep * (totalColumns - column - 1);

                            pathX += colOffset;

                            if (this.skewSize > 0) {
                                pathX += this.skewSizeAbs + this.skewSize * (totalRows - row - 1);
                            }

                            x -= pathX;
                        } else if (this.isRTL()) {
                            colOffset = offsetXStep * column;

                            pathX += colOffset;

                            if (this.skewSize < 0) {
                                pathX += this.skewSizeAbs;
                            }
                            
                            x += pathX;
                        } else if (this.isUD()) {
                            rowOffset = offsetYStep * (totalRows - row -1);

                            pathY += rowOffset;

                            if (this.skewSize > 0) {
                                pathY += this.skewSizeAbs + this.skewSize * (totalColumns - column - 1);
                            }

                            y -= pathY;

                        } else if (this.isBU()) {
                            rowOffset = offsetYStep * row;

                            pathY += rowOffset;

                            if (this.skewSize < 0) {
                                pathY += this.skewSizeAbs;
                            }

                            y += pathY;
                        }
                    }

                    this.particles.push({
                        startXPosition: x,
                        startYPosition: y,
                        endXPosition,
                        endYPosition,
                        x: x,
                        y: y,
                        pathX,
                        pathY,
                        xStep: pathX / this.frameShortStep(),
                        yStep: pathY / this.frameShortStep(),
                        xBackStep: 0,
                        yBackStep: 0,
                        liveTime: this.currentTime,
                        liveTimeShowOffset,
                        liveTimeHideOffset,
                        fill: this.currentColor,
                        draw,
                    });
                }
            }
            //add back speed for each particle
            this.particles.forEach((p, i) => {
                p.xBackStep = this.particles[this.particles.length - 1 - i].xStep * 1.1;
                p.yBackStep = this.particles[this.particles.length - 1 - i].yStep * 1.1;
            });
        } else if (this.isTR2()) {
            let particlesPerLine = 1;
            let linesCount = this.isHorizontal() ? this.rows : this.cols;
            let x;
            let y;
            let speed;

            for (let row = 0; row < linesCount; row++) {
                for (let particle = 0; particle < particlesPerLine; particle++) {
                    y = this.particleHeight * row;
                    x = this.clipLine.currentXPos - this.particleWidth - this.skewSizeAbs;

                    if (this.isHorizontal()) {
                        speed = (Math.random() * (this.w * 0.05) + this.w * 0.05);
                        
                    } else if (this.isVertical()) {
                        speed = (Math.random() * (this.h * 0.05) + this.h * 0.05);
                        x = this.particleWidth * row;
                        y = this.clipLine.currentYPos - this.particleHeight - this.skewSizeAbs;
                    } 

                    this.particles.push({
                        startXPosition: x,
                        startYPosition: y,
                        x,
                        y,
                        fill: this.currentColor,
                        speed,
                        draw: true,
                        liveTime: this.currentTime
                    });
                }
            }
        }

        // shuffle the colors
        if (this.useAdditionalColors) {
            this.shuffleParticles();
        }
    }

    shuffleParticles() {
        let particlesPercent = this.particles.length / 100;
        let part1 = Math.round(particlesPercent * this.color1Percent);
        let part2 = Math.round(particlesPercent * this.color2Percent);
        let part3 = Math.round(particlesPercent * this.color3Percent);
        let newDataArray = [];

        this.particles.forEach((p, i) => {
            if (part1 && (i + 1 <= part1)) {
                p.fill = this.additionalColor1;
            } else if (part2 && (i + 1 <= part1 + part2)) {
                p.fill = this.additionalColor2;
            } else if (part3 && (i + 1 <= part1 + part2 + part3)) {
                p.fill = this.additionalColor3;
            } else {
                p.fill = this.currentColor;
            }
            
            if (this.isTR1() || this.isTR3()) {
                newDataArray.push({
                    startXPosition: p.startXPosition,
                    startYPosition: p.startYPosition,
                    endXPosition: p.endXPosition,
                    endYPosition: p.endYPosition,
                    x: p.x, 
                    y: p.y, 
                    pathX: p.pathX,
                    pathY: p.pathY, 
                    xStep: p.xStep, 
                    yStep: p.yStep,
                    xBackStep: p.xBackStep,
                    yBackStep: p.yBackStep
                });
            } else if (this.isTR2()) {
                newDataArray.push({
                    startXPosition: p.x,
                    startYPosition: p.y,
                    x: p.x,
                    y: p.y,
                    speed: p.speed
                });
            }

        });

        newDataArray = newDataArray.sort(() => Math.random() - 0.5);

        newDataArray.forEach((data, i) => {
            this.particles[i] = {
                ...this.particles[i],
                ...data
            }
        });
    }

    drawHorizontalParticle(x, y) {
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

    darwVerticalParticle(x,y) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + this.skewSize);
        // +1 to fix spaces between particles
        this.ctx.lineTo(x + this.particleWidth + 1, y);
        this.ctx.lineTo(x + this.particleWidth + 1, y + this.particleHeight + 1);
        this.ctx.lineTo(x, y + this.particleHeight + this.skewSize + 1);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
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

        this.particles.forEach(({ x, y, fill, draw }, i) => {
            if (draw) {
                if (this.debug) {
                    this.ctx.fillStyle = 'rgba(255, 0,0, .5)';
                } else {
                    this.ctx.fillStyle = fill;
                }

                if (this.isHorizontal()) {
                    this.drawHorizontalParticle(x, y);
                } else if (this.isVertical()){
                    this.darwVerticalParticle(x,y);
                }
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
            if (this.isTR1()) {
                if (p.liveTime >= this.totalTime - this.transitionTime + p.liveTimeShowOffset) {
                    p.draw = true;
                    
                    if (p.liveTime >= this.totalTime - this.transitionTimeThird + p.liveTimeHideOffset) {
                        p.draw = false;
                        
                        if (p.liveTime >= this.totalTime) {
                            p.liveTime = 0;
                            p.draw = false;
                        }
                    }
                }
            } else if (this.isTR2()) {
                let accelerationX = 0;
                let accelerationY = 0;

                if (this.isLTR()) {
                    accelerationX = Math.abs(p.x / this.w * 10) + 0.1;
                } else if (this.isRTL()) {
                    accelerationX = Math.abs(Math.abs(p.x / this.w - 1) * 10) + 0.1;
                } else if (this.isUD()) {
                    accelerationY = Math.abs(p.y / this.h * 10) + 0.1;
                } else if (this.isBU()) {
                    accelerationY = Math.abs(Math.abs(p.y / this.h - 1) * 10) + 0.1;
                }

                let xStep = p.speed + accelerationX;
                let yStep = p.speed + accelerationY;
                let isOverEdge;

                // set values according to direction of the animation
                switch (this.transitionDirection) {
                    case LTR:
                        yStep = 0;
                        isOverEdge = p.x > this.w + this.skewSizeAbs;
                        break;
                    case RTL:
                        xStep *= -1;
                        yStep = 0;
                        isOverEdge = p.x < (this.particleWidth + this.skewSizeAbs) * -1;
                        break;
                    case UD:
                        xStep = 0;
                        isOverEdge = p.y > this.h + this.skewSizeAbs;
                        break;
                    case BU:
                        xStep = 0;
                        yStep *= -1;

                        isOverEdge = p.y < (this.particleHeight + this.skewSizeAbs) * -1;
                        break;
                }

                // apply values
                if (this.currentTime >= this.totalTime - this.transitionTime) {
                    p.x += xStep;
                    p.y += yStep;

                    if (isOverEdge) {
                        if (this.isHorizontal()) {
                            p.x = this.clipLine.currentXPos;
                        } else if (this.isVertical()) {
                            p.y = this.clipLine.currentYPos;
                        }

                        if (this.isLTR()) {
                            p.x += this.skewSizeAbs; 
                        } else if (this.isRTL()) {
                            p.x -= this.particleWidth;
                        } else if (this.isUD()) {
                            p.y += this.skewSizeAbs;
                        } else if (this.isBU()) {
                            p.y -= this.particleHeight;
                        }

                        if (this.currentTime >= this.totalTime) {
                            this.currentColor = this.currentImage % 2 === 0 ? this.particlesColor2 : this.particlesColor;

                            //fill the particle to oposite color in case if the particle has on of the default colors, or leave the initial fill
                            p.fill = p.fill === this.particlesColor ? this.particlesColor2 : p.fill === this.particlesColor2 ? this.particlesColor : p.fill;

                            this.calculateShadowColor();
                        }
                    }
                }
            } else if(this.isTR3()) {
                let xStep = p.xStep;
                let yStep = p.yStep;
                let startTime = this.totalTime - this.transitionTime;
                let enterUntil = startTime + this.transitionTimeThird;
                let outFrom = this.totalTime - this.transitionTimeThird;
                let endTime = this.totalTime;
                
                if (p.liveTime >= startTime) {
                    if (p.liveTime <= enterUntil) {
                        if (this.isLTR()) {   
                            p.x += xStep;
                        } else if (this.isRTL()) {
                            p.x -= xStep;
                        } else if (this.isUD()) {
                            p.y += yStep;
                        } else if (this.isBU()) {
                            p.y -= yStep;
                        }
                    } else if (p.liveTime >= outFrom) {
                        let xBackStep = p.xBackStep;
                        let yBackStep = p.yBackStep;
    
                        if (this.isLTR()) {
                            p.x += xBackStep;
                        } else if (this.isRTL()) {
                            p.x -= xBackStep;
                        } else if (this.isUD()) {
                            p.y += yBackStep;
                        } else if (this.isBU()) {
                            p.y -= yBackStep;
                        }
    
                        if (p.liveTime >= endTime) {
                            p.x = p.startXPosition;
                            p.y = p.startYPosition;
                            p.liveTime = this.currentTime;
                        }
                    } else {
                        p.x = p.endXPosition;
                        p.y = p.endYPosition;
                    }
                }  
            }

            /* start counting of particle lifetime */
            p.liveTime += this.msPerFrame();
        });
    }

    drawTopClip() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.w, 0);
        this.ctx.lineTo(this.w, this.clipLine.clipRightYPoint);
        this.ctx.lineTo(0, this.clipLine.clipLeftYPoint);
        this.ctx.clip();
    }

    drawRightClip() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.clipLine.clipTopXPoint, 0);
        this.ctx.lineTo(this.w, 0);
        this.ctx.lineTo(this.w, this.h);
        this.ctx.lineTo(this.clipLine.clipBottomXPoint, this.h);
        this.ctx.clip();
    }

    drawBottomClip() {
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.clipLine.clipLeftYPoint);
        this.ctx.lineTo(this.w, this.clipLine.clipRightYPoint);
        this.ctx.lineTo(this.w, this.h);
        this.ctx.lineTo(0, this.h);
        this.ctx.clip();
    }

    drawLeftClip() {
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(this.clipLine.clipTopXPoint, 0);
        this.ctx.lineTo(this.clipLine.clipBottomXPoint, this.h);
        this.ctx.lineTo(0, this.h);
        this.ctx.clip();
    }

    drawShadow(side) {
        let shadowHolderOffet = 10;
        let shadowWidth = this.particleWidth;
        let shadowHeight = this.particleHeight;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.beginPath();
        
        if (side === 'Left') {
            this.ctx.shadowOffsetX = -shadowWidth;

            this.ctx.moveTo(this.clipLine.clipTopXPoint + shadowHolderOffet, 0 - shadowHolderOffet);
            this.ctx.lineTo(this.clipLine.clipTopXPoint + shadowWidth + shadowHolderOffet, 0);
            this.ctx.lineTo(this.clipLine.clipBottomXPoint + shadowWidth + shadowHolderOffet, this.h);
            this.ctx.lineTo(this.clipLine.clipBottomXPoint + shadowHolderOffet, this.h + shadowHolderOffet);    
        } else if (side === 'Right') {
            this.ctx.shadowOffsetX = shadowWidth;

            this.ctx.moveTo(this.clipLine.clipTopXPoint - shadowHolderOffet, 0 - shadowHolderOffet);
            this.ctx.lineTo(this.clipLine.clipTopXPoint - shadowWidth - shadowHolderOffet, 0 - shadowHolderOffet);
            this.ctx.lineTo(this.clipLine.clipBottomXPoint - shadowWidth - shadowHolderOffet, this.h + shadowHolderOffet);
            this.ctx.lineTo(this.clipLine.clipBottomXPoint - shadowHolderOffet, this.h + shadowHolderOffet);
        } else if (side === 'Top') {
            this.ctx.shadowOffsetY = -shadowHeight;

            this.ctx.moveTo(0 - shadowHolderOffet, this.clipLine.clipLeftYPoint + shadowHolderOffet);
            this.ctx.lineTo(this.w + shadowHolderOffet, this.clipLine.clipRightYPoint + shadowHolderOffet);
            this.ctx.lineTo(this.w + shadowHolderOffet, this.clipLine.clipRightYPoint + shadowHeight + shadowHolderOffet);
            this.ctx.lineTo(0 - shadowHolderOffet, this.clipLine.clipLeftYPoint + shadowHeight + shadowHolderOffet);
        } else if (side === 'Bottom') {
            this.ctx.shadowOffsetY = shadowHeight;

            this.ctx.moveTo(0 - shadowHolderOffet, this.clipLine.clipLeftYPoint - shadowHeight - shadowHolderOffet);
            this.ctx.lineTo(this.w + shadowHolderOffet, this.clipLine.clipRightYPoint - shadowHeight - shadowHolderOffet);
            this.ctx.lineTo(this.w + shadowHolderOffet, this.clipLine.clipRightYPoint - shadowHolderOffet);
            this.ctx.lineTo(0 - shadowHolderOffet, this.clipLine.clipLeftYPoint - shadowHolderOffet);
        }

        this.ctx.closePath();
        this.ctx.fill();
    }

    createClipLine() {
        let fromLeft = 0 - (this.skewSizeAbs * this.rows + this.particleWidth + this.skewSizeAbs);
        let fromRight = this.w + (this.particleWidth + this.skewSizeAbs * this.rows);
        let fromTop = 0 - (this.skewSizeAbs + this.cols + this.particleHeight + this.skewSizeAbs);
        let fromBottom = this.h + (this.particleHeight + this.skewSizeAbs + this.cols);

        if (this.isLTR()) {
            this.clipLine.startXPos = fromLeft;
            this.clipLine.endXPos = fromRight;
        } else if (this.isRTL()) {
            this.clipLine.startXPos = fromRight;
            this.clipLine.endXPos = fromLeft;
        } else if (this.isBU()) {
            this.clipLine.startYPos = fromBottom;
            this.clipLine.endYPos = fromTop;

        } else if (this.isUD()) {
            this.clipLine.startYPos = fromTop;
            this.clipLine.endYPos = fromBottom;
        }

        this.clipLine.pathX = Math.abs(this.clipLine.startXPos - this.clipLine.endXPos);
        this.clipLine.pathY = Math.abs(this.clipLine.startYPos - this.clipLine.endYPos);
        this.clipLine.currentXPos = this.clipLine.startXPos;
        this.clipLine.currentYPos = this.clipLine.startYPos;
    }

    drawClipLine() {
        this.ctx.save();
        if (this.isLTR()) {
            this.drawLeftClip();
            this.drawShadow('Left');
        } else if (this.isRTL()) {
            this.drawRightClip();
            this.drawShadow("Right");
        } else if (this.isUD()) {
            this.drawTopClip();
            this.drawShadow('Top');
        } else if (this.isBU()) {
            this.drawBottomClip();
            this.drawShadow('Bottom');
        }
        this.ctx.restore();
    }

    updateClipLine() {
        if (this.skewSize < 0) {
            // horizontal move
            this.clipLine.clipTopXPoint = this.clipLine.currentXPos;
            this.clipLine.clipBottomXPoint = this.clipLine.currentXPos + this.skewSizeAbs * this.rows;

            //vertical move
            this.clipLine.clipLeftYPoint = this.clipLine.currentYPos;
            this.clipLine.clipRightYPoint = this.clipLine.currentYPos + this.skewSizeAbs * this.cols;
        } else if (this.skewSize > 0) {
            this.clipLine.clipTopXPoint = this.clipLine.currentXPos + this.skewSizeAbs * this.rows;
            this.clipLine.clipBottomXPoint = this.clipLine.currentXPos;

            this.clipLine.clipLeftYPoint = this.clipLine.currentYPos + this.skewSizeAbs * this.cols;
            this.clipLine.clipRightYPoint = this.clipLine.currentYPos;
        } else {
            this.clipLine.clipTopXPoint = this.clipLine.clipBottomXPoint = this.clipLine.currentXPos;
            this.clipLine.clipLeftYPoint = this.clipLine.clipRightYPoint = this.clipLine.currentYPos;
        }

        if (this.currentTime >= this.totalTime - this.transitionTimeThird) {
            let clipXStep = this.clipLine.pathX / this.frameShortStep();
            let clipYStep = this.clipLine.pathY / this.frameShortStep();

            if (this.isLTR()) {
                if (this.clipLine.currentXPos <= this.clipLine.endXPos - clipXStep) {
                    this.clipLine.currentXPos += clipXStep;
                } else {
                    this.clipLine.currentXPos += this.clipLine.endXPos - this.clipLine.currentXPos;
                }
            } else if (this.isRTL()) {
                if (this.clipLine.currentXPos >= this.clipLine.endXPos - clipXStep) {
                    this.clipLine.currentXPos -= clipXStep;
                } else {
                    this.clipLine.currentXPos -= this.clipLine.currentXPos - this.clipLine.endXPos;
                }
            } else if (this.isUD()) {
                if (this.clipLine.currentYPos <= this.clipLine.endYPos - clipYStep) {
                    this.clipLine.currentYPos += clipYStep;
                } else {
                    this.clipLine.currentYPos += this.clipLine.endYPos - this.clipLine.currentYPos;
                }
            } else if (this.isBU()) {
                if (this.clipLine.currentYPos >= this.clipLine.endYPos - clipYStep) {
                    this.clipLine.currentYPos -= clipYStep;
                } else {
                    this.clipLine.currentYPos -= this.clipLine.currentYPos - this.clipLine.endYPos;
                }
            }

            if (this.currentTime >= this.totalTime) {
                this.clipLine.currentXPos = this.clipLine.startXPos;
                this.clipLine.currentYPos = this.clipLine.startYPos; 
            }
        }

    }

    draw() {
        this.clear();

        if (this.debug) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 0, 255, .5)';
            this.ctx.fillRect(0,0, this.w, this.h);
            this.ctx.restore();
        }

        if (this.images.length) {
            this.drawImages();
        }

        this.drawParticles(); 

        if (this.isTR2()) {
            this.drawClipLine();
        }
    }

    update() {
        if (this.images.length) {
            this.updateImages();
        }

        this.updateParticles();

        this.updateCurrentTime();

        if (this.isTR2()) {
            this.updateClipLine();
        }
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

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        paused = !paused;
        if (paused) {
            pauseBtn.click();
        } else {
            playBtn.click();
        }
    } else if (e.code === 'ArrowUp') {
        banner.update();
        banner.draw();
    }
})



let timeout;
addSettings();


function addSettings() {

    const animationType = document.getElementById('animation-type').value;
    const transitionDirection = document.getElementById('direction').value;
    const transitionTime = +document.getElementById('speed').value;
    const imageShowTime = +document.getElementById('image-duration').value;
    const particlesPerRow = +document.getElementById('particles-per-row').value;
    const particlesPerColumn = +document.getElementById('particles-per-column').value;
    const particlesColor = convertHexToRgbA(document.getElementById('particles-color').value, 1);
    const particlesColor2 = convertHexToRgbA(document.getElementById('particles-color2').value, 1) ;
    const skewSize = +document.getElementById('skew').value
    const useAdditionalColors = document.getElementById('useColors').checked;
    const additionalColor1 = convertHexToRgbA(document.getElementById('additional-color1').value, 1);
    const color1Percent = +document.getElementById('color1Percent').value;
    const additionalColor2 = convertHexToRgbA(document.getElementById('additional-color2').value, 1);
    const color2Percent = +document.getElementById('color2Percent').value;
    const additionalColor3 = convertHexToRgbA(document.getElementById('additional-color3').value, 1);
    const color3Percent = +document.getElementById('color3Percent').value;
    const imageFit = document.getElementById('image-fit').value;
    

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
        skewSize,
        useAdditionalColors,
        additionalColor1,
        additionalColor2,
        additionalColor3,
        color1Percent,
        color2Percent,
        color3Percent,
        imageFit
    }

    banner = new myBanner(Widget.properties, debugInput.checked);
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