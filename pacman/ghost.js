class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        imageX,
        imageY,
        imageWidth,
        imageHeight,
        range
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = DIRECTION_RIGHT;
        this.imageX = imageX;
        this.imageY = imageY;
        this.imageHeight = imageHeight;
        this.imageWidth = imageWidth;
        this.range = range;
        this.randomTargetIndex = parseInt(Math.random() * 4);
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
        setInterval(() => {
            this.changeRandomDirection();
        }, 10000);
    }

    isInRange() {
        let xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        let yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        if (
            Math.sqrt(xDistance * xDistance + yDistance * yDistance) <=
            this.range
        ) {
            return true;
        }
        return false;
    }

    changeRandomDirection() {
        let addition = 1;
        this.randomTargetIndex += addition;
        this.randomTargetIndex = this.randomTargetIndex % 4;
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
    }

    moveProcess() {
        if (this.isInRange()) {
            this.target = pacman;
        } else {
            // The target is already set in the constructor and in changeRandomDirection
            // this.target = randomTargetsForGhosts[this.randomTargetIndex];
        }
        this.changeDirectionIfPossible();
        this.moveForwards();

        // Tunnel logic for ghosts
        if (this.getMapY() == 10) {
            if (this.getMapX() == 0 && this.direction == DIRECTION_LEFT) {
                this.x = (map[0].length - 1) * oneBlockSize;
            } else if (this.getMapX() == map[0].length - 1 && this.direction == DIRECTION_RIGHT) {
                this.x = 0;
            }
        }

        if (this.checkCollisions()) {
            this.moveBackwards();
            // Ghost is stuck, need to force a direction change
            this.forceNewDirection();
            return;
        }
    }

    moveBackwards() {
        switch (this.direction) {
            case 4: // Right
                this.x -= this.speed;
                break;
            case 3: // Up
                this.y += this.speed;
                break;
            case 2: // Left
                this.x += this.speed;
                break;
            case 1: // Bottom
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case 4: // Right
                this.x += this.speed;
                break;
            case 3: // Up
                this.y -= this.speed;
                break;
            case 2: // Left
                this.x -= this.speed;
                break;
            case 1: // Bottom
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        let isCollided = false;
        if (
            map[parseInt(this.y / oneBlockSize)][
            parseInt(this.x / oneBlockSize)
            ] == 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][
            parseInt(this.x / oneBlockSize)
            ] == 1 ||
            map[parseInt(this.y / oneBlockSize)][
            parseInt(this.x / oneBlockSize + 0.9999)
            ] == 1 ||
            map[parseInt(this.y / oneBlockSize + 0.9999)][
            parseInt(this.x / oneBlockSize + 0.9999)
            ] == 1
        ) {
            isCollided = true;
        }
        return isCollided;
    }

    forceNewDirection() {
        let possibleDirections = [];
        let currentMapX = this.getMapX();
        let currentMapY = this.getMapY();

        // Check all 4 directions for a non-wall tile
        // Left
        if (currentMapX - 1 >= 0 && map[currentMapY][currentMapX - 1] != 1) {
            possibleDirections.push(DIRECTION_LEFT);
        }
        // Right
        if (currentMapX + 1 < map[0].length && map[currentMapY][currentMapX + 1] != 1) {
            possibleDirections.push(DIRECTION_RIGHT);
        }
        // Up
        if (currentMapY - 1 >= 0 && map[currentMapY - 1][currentMapX] != 1) {
            possibleDirections.push(DIRECTION_UP);
        }
        // Down
        if (currentMapY + 1 < map.length && map[currentMapY + 1][currentMapX] != 1) {
            possibleDirections.push(DIRECTION_BOTTOM);
        }

        // Filter out the direction opposite to the current one to avoid immediate U-turns unless necessary
        let oppositeDirection;
        if (this.direction == DIRECTION_LEFT) oppositeDirection = DIRECTION_RIGHT;
        else if (this.direction == DIRECTION_RIGHT) oppositeDirection = DIRECTION_LEFT;
        else if (this.direction == DIRECTION_UP) oppositeDirection = DIRECTION_BOTTOM;
        else if (this.direction == DIRECTION_BOTTOM) oppositeDirection = DIRECTION_UP;

        let filteredDirections = possibleDirections.filter(dir => dir !== oppositeDirection);

        if (filteredDirections.length > 0) {
            // Choose a random direction from the filtered list
            this.direction = filteredDirections[parseInt(Math.random() * filteredDirections.length)];
        } else if (possibleDirections.length > 0) {
            // If only the opposite direction is available, take it
            this.direction = possibleDirections[0];
        }
    }

    changeDirectionIfPossible() {
        let tempDirection = this.direction;
        this.direction = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize),
            parseInt(this.target.y / oneBlockSize)
        );

        // If calculateNewDirection fails to find a path, keep the old direction
        if (typeof this.direction == "undefined") {
            this.direction = tempDirection;
            return;
        }

        // This block seems to be an attempt to align the ghost to the grid, but it's flawed.
        // I will remove it and rely on the BFS for direction.
        /*
        if (
            this.getMapY() != this.getMapYRightSide() &&
            (this.direction == DIRECTION_LEFT ||
                this.direction == DIRECTION_RIGHT)
        ) {
            this.direction = DIRECTION_UP;
        }
        if (
            this.getMapX() != this.getMapXRightSide() &&
            this.direction == DIRECTION_UP
        ) {
            this.direction = DIRECTION_LEFT;
        }
        */

        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
        // console.log(this.direction); // Removed console.log
    }

    calculateNewDirection(map, destX, destY) {
        let mp = [];
        for (let i = 0; i < map.length; i++) {
            mp[i] = map[i].slice();
        }

        let queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                rightX: this.getMapXRightSide(),
                rightY: this.getMapYRightSide(),
                moves: [],
            },
        ];
        while (queue.length > 0) {
            let poped = queue.shift();
            if (poped.x == destX && poped.y == destY) {
                return poped.moves[0];
            } else {
                mp[poped.y][poped.x] = 1;
                let neighborList = this.addNeighbors(poped, mp);
                for (let i = 0; i < neighborList.length; i++) {
                    queue.push(neighborList[i]);
                }
            }
        }

        return this.direction; // direction
    }

    addNeighbors(poped, mp) {
        let queue = [];
        let numOfRows = mp.length;
        let numOfColumns = mp[0].length;

        // Check Left
        if (
            poped.x - 1 >= 0 &&
            mp[poped.y][poped.x - 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_LEFT);
            queue.push({ x: poped.x - 1, y: poped.y, moves: tempMoves });
        }
        // Check Right
        if (
            poped.x + 1 < numOfColumns &&
            mp[poped.y][poped.x + 1] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_RIGHT);
            queue.push({ x: poped.x + 1, y: poped.y, moves: tempMoves });
        }
        // Check Up
        if (
            poped.y - 1 >= 0 &&
            mp[poped.y - 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_UP);
            queue.push({ x: poped.x, y: poped.y - 1, moves: tempMoves });
        }
        // Check Down
        if (
            poped.y + 1 < numOfRows &&
            mp[poped.y + 1][poped.x] != 1
        ) {
            let tempMoves = poped.moves.slice();
            tempMoves.push(DIRECTION_BOTTOM);
            queue.push({ x: poped.x, y: poped.y + 1, moves: tempMoves });
        }
        return queue;
    }

    getMapX() {
        let mapX = parseInt(this.x / oneBlockSize);
        return mapX;
    }

    getMapY() {
        let mapY = parseInt(this.y / oneBlockSize);
        return mapY;
    }

    getMapXRightSide() {
        let mapX = parseInt((this.x * 0.99 + oneBlockSize) / oneBlockSize);
        return mapX;
    }

    getMapYRightSide() {
        let mapY = parseInt((this.y * 0.99 + oneBlockSize) / oneBlockSize);
        return mapY;
    }

    changeAnimation() {
        this.currentFrame =
            this.currentFrame == this.frameCount ? 1 : this.currentFrame + 1;
    }

    draw() {
        canvasContext.save();
        canvasContext.drawImage(
            ghostFrames,
            this.imageX,
            this.imageY,
            this.imageWidth,
            this.imageHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
        canvasContext.restore();
        canvasContext.beginPath();
        canvasContext.strokeStyle = "red";
        canvasContext.arc(
            this.x + oneBlockSize / 2,
            this.y + oneBlockSize / 2,
            this.range * oneBlockSize,
            0,
            2 * Math.PI
        );
        canvasContext.stroke();
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
