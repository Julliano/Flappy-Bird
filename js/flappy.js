function newElement(tagName, className) {
    const elem = document.createElement(tagName);
    elem.className = className;
    return elem;
}

function Barrier(reverse = false) {
    this.element = newElement('div', 'barrier');
    
    const border = newElement('div', 'border');
    const body = newElement('div', 'body');
    this.element.appendChild(reverse ? body : border);
    this.element.appendChild(reverse ? border : body);

    this.setHeight = height => body.style.height = `${height}px`;
}

function BarrierPair(height, opening, x) {
    this.element = newElement('div', 'pair-of-barriers');

    this.upper = new Barrier(true);
    this.bottom = new Barrier(false);

    this.element.appendChild(this.upper.element);
    this.element.appendChild(this.bottom.element);

    this.sortOpening = () => {
        const upperHeight = Math.random() * (height - opening);
        const bottomHeight = height - opening - upperHeight;
        this.upper.setHeight(upperHeight);
        this.bottom.setHeight(bottomHeight);
    }

    this.getX = () => parseInt(this.element.style.left.split('px')[0]);
    this.setX = x => this.element.style.left = `${x}px`;
    this.getWidth = () => this.element.clientWidth;

    this.sortOpening();
    this.setX(x);
}

function Barriers(height, width, opening, space, notifyPoint) {
    this.pair = [
        new BarrierPair(height, opening, width),
        new BarrierPair(height, opening, width + space),
        new BarrierPair(height, opening, width + space * 2),
        new BarrierPair(height, opening, width + space * 3)
    ];

    const displacement = 3;
    this.animation = () => {
        this.pair.forEach(pair => {
            pair.setX(pair.getX() - displacement);

            // when barrier exit screen
            if (pair.getX() < -pair.getWidth()) {
                pair.setX(pair.getX() + space * this.pair.length);
                pair.sortOpening();
            }

            // 65 is half of barrier width - so the point will increment in the middle of the barrier
            // if you change de css barrier (width) update this value
            const middle = (width / 2) - 65;
            const middleCrossed = pair.getX() + displacement >= middle
                && pair.getX() < middle;
            if (middleCrossed) notifyPoint();
        })
    }
}

function Bird(gamingHeight) {
    let flying = false;

    this.element = newElement('img', 'bird');
    this.element.src = 'imgs/bird.png'

    this.getY = () => parseInt(this.element.style.bottom.split('px')[0]);
    this.setY = y => this.element.style.bottom = `${y}px`;

    window.onkeydown = e => flying = true;
    window.onkeyup = e => flying = false;

    this.animation = () => {
        const newY = this.getY() + (flying ? 8 : -5);
        const maxHeight = gamingHeight - this.element.clientHeight;

        if (newY <= 0) {
            this.setY(0);
        } else if (newY >= maxHeight) {
            this.setY(maxHeight);
        } else {
            this.setY(newY);
        }
    }

    this.setY(gamingHeight / 2);
}

function Progress() {
    this.element = newElement('span', 'progress');
    this.updatePoints = points => {
        this.element.innerHTML = points;
    }
    this.updatePoints(0);
}

function overlaid(elementA, elementB) {
    const a = elementA.getBoundingClientRect();
    const b = elementB.getBoundingClientRect();

    const aRightSide = a.left + a.width;
    const aTopSide = a.top + a.height;
    const bRightSide = b.left + b.width;
    const bTopSide = b.top + b.height;

    const horizontal = aRightSide >= b.left 
        && bRightSide >= a.left;
    const vertical = aTopSide >= b.top
        && bTopSide >= a.top;
    return horizontal && vertical;
}

function collided(bird, barriers, gamingHeight) {
    let collid = false;
    barriers.pair.forEach(pair => {
        if (!collid) {
            const upper = pair.upper.element;
            const bottom = pair.bottom.element;
            collid = overlaid(bird.element, upper) || overlaid(bird.element, bottom);
        }
    });

    const birdTopSide = bird.getY() + bird.element.height;
    const birdBottomSide = bird.getY();

    if (birdTopSide >= gamingHeight) {
        collid = true;
    } else if (birdBottomSide <= 0) {
        collid = true;
    }

    return collid;
}

function FlappyBird() {
    let points = 0;

    const gamingArea = document.querySelector('[wm-flappy]');
    const height = gamingArea.clientHeight;
    const width = gamingArea.clientWidth;

    const progress = new Progress();
    const barriers = new Barriers(height, width, 200, 400, 
        () => progress.updatePoints(++points)
    );
    const bird = new Bird(height);

    gamingArea.appendChild(progress.element);
    gamingArea.appendChild(bird.element);
    barriers.pair.forEach(pair => gamingArea.appendChild(pair.element));

    this.resetBird = () => bird.setY(height / 2);

    this.start = () => {
        const temp = setInterval(() => {
            barriers.animation();
            bird.animation();

            if (collided(bird, barriers, height)) {
                clearInterval(temp);
                modal.style.display='block';
            }
        }, 20);
    }
}

let flappy = new FlappyBird();
flappy.start();

const modal = document.getElementById('myModal');
const tryAgain = document.querySelector('#try-again');
const gamingArea = document.querySelector('[wm-flappy]');

tryAgain.onclick = function() {
    location.reload();
}