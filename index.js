const Widget = {
    properties: {
        img1: `img1.png`,
        img2: `img2.png`,
        img3: `img3.png`,
        img4: `img4.png`,
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

class myBanner {
    constructor(options, debug) {
        this.frameRate = 60;
        this.startTime = new Date().getTime();
        this.framesPerSecond = 0;
        this.animationType = options.animationType;
        this.transitionDirection = options.transitionDirection;
        this.currentTime = 0;

        //transition options start
        this.transitionTime = +options.transitionTime > 0 ? +options.transitionTime * 100 : 1000;
        this.transitionStep = this.transitionTime / 3;
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
        this.imageShowTime = (+options.imageShowTime > 0 ? +options.imageShowTime * 1000 : 3000) + this.transitionTime;
        this.images = [];
        this.currentImage = 0;
        // this.maxImages = 4;
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
        Promise.all(this.createImages(options)).then(() => {
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

        this.particles = [];
        this.createParticles();
        this.createClipLine();
    }  

    calcSkewSize() {
        if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') {
            this.skewSize = this.particleWidth * this.skewPercent;
        } else if (this.transitionDirection === 'Up-Down' || this.transitionDirection === 'Bottom-Up') {
            this.skewSize = this.particleHeight * this.skewPercent;
        }
        
        this.skewSizeAbs = Math.abs(this.skewSize);
    }

    updateCurrentTime() {
        let timeStep = 1000 / this.frameRate;

        this.changeCurrentImageOnLoop();

        if (this.currentTime > this.imageShowTime) {
            this.currentTime = 0;
        }

        this.currentTime += timeStep;
    }

    calculateShadowColor() {
        let colorArray = this.currentColor.split(',');
        let alpha = parseFloat(colorArray[colorArray.length - 1].replace(/[^0-9.]/gi, '')) / 2;
        this.shadowColor = this.currentColor.replace(/(\d\))$/gi, `${alpha})`);
    }

    changeCurrentImageOnLoop() {
        if (this.images.length) {
            if (this.currentTime >= this.imageShowTime) {
                this.currentImage++;
                this.currentImage = this.currentImage % this.images.length;
            }
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
    
                        this.images.push({
                            img,
                            width: img.width,
                            height: img.height,
                            opacity:  0
                        });
    
                        img.remove();
                        res();
                    };
                    img.src = url;
                }));
            });

            return promiseArray;
        } else {
            return [Promise.resolve()];
        }        
    }

    drawImages() {
        let current = this.images[this.currentImage];
        let next = this.images[(this.currentImage + 1) % this.images.length];

        if (this.animationType === 'Transition 1') {
            [next, current].forEach(image => {
                this.ctx.save();
                this.ctx.globalAlpha = image.opacity;
                this.ctx.drawImage(image.img, 0, 0, this.w, this.h);
                this.ctx.restore();
            });
        } else if (this.animationType === 'Transition 2') {
            this.ctx.fillStyle = 'transparent';

            // draw firstImage start
            this.ctx.save();

            if (this.debug) {
                this.ctx.font = '20px sans-serif';
                this.ctx.strokeStyle = 'orange';
            }

            if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') {
                this.drawLeftClip();
            } else if (this.transitionDirection === 'Up-Down' || this.transitionDirection === 'Bottom-Up') {
                this.drawBottomClip();
            }
            
            if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Bottom-Up' ) {
                this.ctx.drawImage(next.img, 0, 0, this.w, this.h);

                if (this.debug) {
                    this.ctx.strokeText('Next', 20, this.h/2);
                }
            } else if (this.transitionDirection === 'Right-Left' || this.transitionDirection === 'Up-Down') {
                this.ctx.drawImage(current.img, 0, 0, this.w, this.h);
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

            if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') {
                this.drawRightClip();
            } else if (this.transitionDirection === 'Up-Down' || this.transitionDirection === 'Bottom-Up') {
                this.drawTopClip();
            }

            if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Bottom-Up') {
                this.ctx.drawImage(current.img, 0, 0, this.w, this.h);
                
                if (this.debug) {
                    this.ctx.strokeText('Current', this.w - 200, this.h/2);
                }
            } else if (this.transitionDirection === 'Right-Left' || this.transitionDirection === 'Up-Down') {
                this.ctx.drawImage(next.img, 0, 0, this.w, this.h);
                
                if (this.debug) {
                    this.ctx.strokeText('Current', this.w - 200, this.h/2);
                }
            }
            this.ctx.restore();
        } else if (this.animationType === 'Transition 3') {
            this.ctx.drawImage(current.img, 0, 0, this.w, this.h);
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

        if (this.animationType === 'Transition 1') {
            if (this.currentTime >= (this.imageShowTime - this.transitionTime)) {
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
            } else {
                current.opacity = 1;
            }
        }
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
                        xStep: path / (this.transitionStep / (1000 / this.frameRate)),
                        row,
                        totalColumns: totalColumns,
                        col: column,
                        liveTime: this.currentTime,
                        fill
                    });
                }
            }
        } else if (this.animationType === 'Transition 2') {
            let particlesPerLine = 1;
            let linesCount = (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') ? this.rows : this.cols;
            let x;
            let y;
            let fill;
            let speed;

            for (let row = 0; row < linesCount; row++) {

                // use additional colors for particles
                if (this.useAdditionalColors) {
                    let rowsPercent = linesCount / 100;
                    let part1 = Math.round(rowsPercent * this.color1Percent);
                    let part2 = Math.round(rowsPercent * this.color2Percent);
                    let part3 = Math.round(rowsPercent * this.color3Percent);

                    if (part1 && row + 1 <= part1) {
                        fill = this.additionalColor1;
                    } else if (part2 && row + 1 <= part1 + part2) {
                        fill = this.additionalColor2;
                    } else if (part3 && row + 1 <= part1 + part2 + part3) {
                        fill = this.additionalColor3;
                    } else {
                        fill = this.currentColor;
                    }
                } else {
                    fill = this.currentColor;
                }

                for (let particle = 0; particle < particlesPerLine; particle++) {
                    y = this.particleHeight * row;
                    x = this.clipLine.currentXPos - this.particleWidth;

                    if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') {
                        speed = (Math.random() * (this.w * 0.05) + this.w * 0.05);
                        
                    } else if (this.transitionDirection === 'Up-Down' || this.transitionDirection === 'Bottom-Up') {
                        speed = (Math.random() * (this.h * 0.05) + this.h * 0.05);
                        x = this.particleWidth * row;
                        // y = this.clipLine.currentYPos - this.particleHeight;
                        y = this.h/2;
                    } 

                    this.particles.push({
                        startXPosition: x,
                        startYPosisiton: y,
                        x: x,
                        y: y,
                        row,
                        fill: fill,
                        speed
                    });
                }
            }

            if (this.useAdditionalColors) {
                let linesPositionsArray;

                linesPositionsArray = this.particles.map(p => {
                    return {x: p.x, y: p.y}
                })

                linesPositionsArray = linesPositionsArray.sort(() => Math.random() - 0.5);

                linesPositionsArray.forEach(({x, y}, i) => {
                    this.particles[i].x = x;
                    this.particles[i].y = y;
                    this.particles[i].startXPosition = x;
                    this.particles[i].startYPosition = y;
                });
            }
        }
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

        this.particles.forEach(({ x, y, fill }, i) => {
            if (fill !== 'transparent') {
                if (this.debug) {
                    this.ctx.fillStyle = 'rgba(255, 0,0, .5)';
                } else {
                    this.ctx.fillStyle = fill;
                }

                this.drawHorizontalParticle(x, y);
                //TODO: finish vertical particle
                // if (this.transitionDirection === 'Left-Right' || this.transitionDirection === 'Right-Left') {
                //     this.drawHorizontalParticle(x, y);
                // } else if (this.transitionDirection === 'Up-Down' || this.transitionDirection === 'Bottom-Up'){
                //     this.darwVerticalParticle(x,y);
                // }
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
                            p.liveTime = this.currentTime;
                        }
                    }
                }
            } else if (this.animationType === 'Transition 2') {
                let acceleration;

                if (this.transitionDirection === 'Left-Right') {
                    acceleration = Math.abs(p.x / this.w * 10) + 0.1;
                } else if (this.transitionDirection === 'Right-Left') {
                    acceleration = Math.abs(Math.abs(p.x / this.w - 1) * 10) + 0.1;
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
                if (this.currentTime >= this.imageShowTime - this.transitionTime) {
                    p.x += xStep;
                    p.y += yStep;

                    if (isOverEdge) {
                        p.x = this.clipLine.currentXPos;

                        if (this.transitionDirection === 'Left-Right') {
                            p.x += this.skewSizeAbs; 
                        } else if (this.transitionDirection === 'Right-Left') {
                            p.x -= this.particleWidth;
                        }

                        if (this.currentTime >= this.imageShowTime) {
                            this.currentColor = this.currentImage % 2 === 0 ? this.particlesColor2 : this.particlesColor;

                            //fill the particle to oposite color in case if the particle has on of the default colors, or leave the initial fill
                            p.fill = p.fill === this.particlesColor ? this.particlesColor2 : p.fill === this.particlesColor2 ? this.particlesColor : p.fill;
                            this.calculateShadowColor();
                        }
                    }
                }
            } else if(this.animationType === 'Transition 3') {
                let xStep = p.xStep;
                let startTime = this.imageShowTime - this.transitionTime + this.transitionStep;
                let enterUntil = startTime + this.transitionStep;
                let outUntil = this.imageShowTime;
                let endTime = this.imageShowTime + this.transitionStep;
                
                if (p.liveTime >= startTime) {
                    if (p.liveTime <= enterUntil) {
                        if (this.transitionDirection === 'Left-Right') {   
                            p.x += xStep;
                        } else if (this.transitionDirection === 'Right-Left') {
                            p.x -= xStep;
                        }
                    } else if (p.liveTime >= outUntil) {
                        xStep = this.particles[(this.particles.length - 1)  - i].xStep * 1.1;
    
                        if (this.transitionDirection === 'Left-Right') {
                            p.x += xStep;
                        } else if (this.transitionDirection === 'Right-Left') {
                            p.x -= xStep;
                        }
    
                        if (p.liveTime >= endTime) {
                            p.y = p.startYPosition;
                            p.x = p.startXPosition;
                            p.liveTime = this.currentTime;
                        }
                    } else {
                        p.x = p.endXPosition;
                        p.y = p.endYPosition;
                    }
                }  
            }

            /* start counting of particle lifetime */
            p.liveTime += 1000 / this.frameRate;
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

        if (this.transitionDirection === 'Left-Right') {
            this.clipLine.startXPos = fromLeft;
            this.clipLine.endXPos = fromRight;

        } else if (this.transitionDirection === 'Right-Left') {
            this.clipLine.startXPos = fromRight;
            this.clipLine.endXPos = fromLeft;
        } else if (this.transitionDirection === 'Bottom-Up') {
            this.clipLine.startYPos = fromBottom;
            this.clipLine.endYPos = fromTop;

        } else if (this.transitionDirection === 'Up-Down') {
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
        if (this.transitionDirection === 'Left-Right') {
            this.drawLeftClip();
            this.drawShadow('Left');
        } else if (this.transitionDirection === 'Right-Left') {
            this.drawRightClip();
            this.drawShadow("Right");
        } else if (this.transitionDirection === 'Up-Down') {
            this.drawTopClip();
            this.drawShadow('Top');
        } else if (this.transitionDirection === 'Bottom-Up') {
            this.drawBottomClip();
            this.drawShadow('Bottom');
        }
        this.ctx.restore();

        // if (this.debug) {
        //     this.ctx.save();
        //     this.ctx.strokeStyle = 'purple';
        //     this.ctx.lineWidth = 3;
        //     this.ctx.beginPath(); 
        //     this.ctx.moveTo(this.clipLine.clipTopXPoint + 2, 0);
        //     this.ctx.lineTo(this.clipLine.clipBottomXPoint + 2, this.h);
        //     this.ctx.stroke(); 
        //     this.ctx.restore();
        // }
    }

    updateClipLine() {
        if (this.skewSize < 0) {
            // horizontal move
            this.clipLine.clipTopXPoint = this.clipLine.currentXPos;
            this.clipLine.clipBottomXPoint = this.clipLine.currentXPos + this.skewSizeAbs * this.rows;

            //vertical move
            this.clipLine.clipLeftYPoint = this.clipLine.currentYPos;
            this.clipLine.clipRightYPoint = this.clipLine.currentYPos + this.skewSizeAbs + this.cols;
        } else if (this.skewSize > 0) {
            this.clipLine.clipTopXPoint = this.clipLine.currentXPos + this.skewSizeAbs * this.rows;
            this.clipLine.clipBottomXPoint = this.clipLine.currentXPos;

            this.clipLine.clipLeftYPoint = this.clipLine.currentYPos + this.skewSizeAbs + this.cols;
            this.clipLine.clipRightYPoint = this.clipLine.currentYPos;
        } else {
            this.clipLine.clipTopXPoint = this.clipLine.clipBottomXPoint = this.clipLine.currentXPos;
            this.clipLine.clipLeftYPoint = this.clipLine.clipRightYPoint = this.clipLine.currentYPos;
        }

        if (this.currentTime >= this.imageShowTime - (this.transitionTime / 3)) {
            let clipXStep = this.clipLine.pathX / (this.transitionStep / (1000 / this.frameRate));
            let clipYStep = this.clipLine.pathY / (this.transitionStep / (1000 / this.frameRate));

            if (this.transitionDirection === 'Left-Right') {
                if (this.clipLine.currentXPos <= this.clipLine.endXPos - clipXStep) {
                    this.clipLine.currentXPos += clipXStep;
                } else {
                    this.clipLine.currentXPos += this.clipLine.endXPos - this.clipLine.currentXPos;
                }
            } else if (this.transitionDirection === 'Right-Left') {
                if (this.clipLine.currentXPos >= this.clipLine.endXPos - clipXStep) {
                    this.clipLine.currentXPos -= clipXStep;
                } else {
                    this.clipLine.currentXPos -= this.clipLine.currentXPos - this.clipLine.endXPos;
                }
            } else if (this.transitionDirection === 'Up-Down') {
                if (this.clipLine.currentYPos <= this.clipLine.endYPos - clipYStep) {
                    this.clipLine.currentYPos += clipYStep;
                } else {
                    this.clipLine.currentYPos += this.clipLine.endYPos - this.clipLine.currentYPos;
                }
            } else if (this.transitionDirection === 'Bottom-Up') {
                if (this.clipLine.currentYPos >= this.clipLine.endYPos - clipYStep) {
                    this.clipLine.currentYPos -= clipYStep;
                } else {
                    this.clipLine.currentYPos -= this.clipLine.currentYPos - this.clipLine.endYPos;
                }
            }

            if (this.currentTime >= this.imageShowTime) {
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

        if (this.animationType === 'Transition 2') {
            this.drawClipLine();
        }
    }

    update() {
        if (this.images.length) {
            this.updateImages();
        }

        this.updateParticles();

        this.updateCurrentTime();

        if (this.animationType === 'Transition 2') {
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
        color3Percent
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