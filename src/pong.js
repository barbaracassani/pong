var app = app || {};

(function(a) {

    var ctxY = 300,
        ctxX = 500;

    function Shape(x, y, w, h, fill) {
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 1;
        this.h = h || 1;
        this.fill = fill || '#AAAAAA';
    }

    Shape.prototype.setPosition = function (x, y) {
        this.x = x;
        this.y = y;
    };

    Shape.prototype.setSize = function (w, h) {
        this.w = w;
        this.h = h;
    };

    Shape.prototype.setColor = function (color) {
        this.fill = color;
    };

    Shape.prototype.draw = function(ctx) {
        ctx.fillStyle = this.fill;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    };

    Shape.prototype.onFrame = function () {};

    function Letter(str) {
        this.str = str || '00';
    }

    Letter.prototype = new Shape();
    Letter.prototype.draw = function(ctx, str) {
        ctx.font="40px icomoon";
        ctx.fillText(this.str, this.x, this.y);
    };
    Letter.prototype.setLetter = function(str) {
        this.str = str;
    };

    a.Letter = Letter;

    function CanvasState(canvas) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.shapes = [];
        this.ctx = canvas.getContext('2d');
    }

    CanvasState.prototype.addShape = function(shape) {
        this.shapes.push(shape);
        shape.draw(this.ctx);
        this.valid = false;
    };

    CanvasState.prototype.clear = function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    };

    CanvasState.prototype.redraw = function () {
        var ctx = this.ctx,
            shapes = this.shapes,
            l = this.shapes.length - 1;

        this.clear();

        while (l >= 0) {
            shapes[l].draw(ctx);
            l--;
        }

    };

    a.CanvasState = CanvasState;

    function Field() {
        this.setSize(5, ctxY);
        this.setPosition((ctxX / 2) - (this.w / 2), 0);
        this.setColor('aqua');
    }
    Field.prototype = new Shape();
    a.Field = Field;


    function Raquet(){
        this.setSize(5,50);
        this.setColor('pink');
    }
    Raquet.prototype = new Shape();
    Raquet.prototype.direction = null;

    function ComputerRaquet() {}
    ComputerRaquet.prototype = new Raquet();

    ComputerRaquet.prototype.onFrame = function () {
        if (this.direction && (this.y + this.h) < ctxY) {
            this.y++;
        } else if (!this.direction && this.y > 0) {
            this.y--;
        }
    };

    a.ComputerRaquet = ComputerRaquet;

    function PlayerRaquet() {
        this.setPosition(ctxX - this.w, 0);
        document.addEventListener('keyup', _.bind(this.onKeyUp, this));
        document.addEventListener('keydown', _.bind(this.onKeyDown, this));
        this.speedFactor = 1;
    }
    PlayerRaquet.prototype = new Raquet();
    PlayerRaquet.prototype.onKeyDown = function(ev) {
        switch(ev.keyCode) {
            case 37:
                (this.direction || this.direction === null) && (this.speedFactor = 1);
                this.direction = false;
                break;
            case 39:
                !this.direction && (this.speedFactor = 1);
                this.direction = true;
                break;
        }
    };
    PlayerRaquet.prototype.onKeyUp = function(ev) {
        switch(ev.keyCode) {
            case 37:
            case 39:
                this.direction = null;
                break;
        }
    };
    PlayerRaquet.prototype.onFrame = function () {
        this.speedFactor += 0.1;
        if (this.direction && (this.y + this.h) <= ctxY) {
            this.y += this.speedFactor;
        } else if (this.direction === false && this.y >= 0) {
            this.y -= this.speedFactor;
        }
    };

    a.PlayerRaquet = PlayerRaquet;


    function Ball() {
        this.setSize(5, 5);
        this.setPosition(100, 100);
        this.setColor('#ca23cb');
        this.direction = {
            x : true,
            y : false
        };
    }

    Ball.prototype = new Shape();

    Ball.prototype.yFactor = 1;

    Ball.prototype.invertX = function() {
        this.direction.x = !this.direction.x;
    };

    Ball.prototype.invertY = function() {
        this.direction.y = !this.direction.y;
    };

    Ball.prototype.onFrame = function () {
        if (this.direction.x) {
            this.x++
        } else {
            this.x--;
        }
        if (this.direction.y) {
            this.y += this.yFactor;
        } else {
            this.y -= this.yFactor;
        }
    };

    a.Ball = Ball;

}(app));

(function(a) {

    function Game () {
        this.ctx = document.getElementById('canvas');
        this.score = {
            player : 0,
            computer : 0
        }
    };

    Game.prototype.init = function () {

        var computerRaquet, playerRaquet, ball, scoreComputer, scorePlayer;

        this.state = new a.CanvasState(this.ctx);


        computerRaquet = new a.ComputerRaquet();
        this.registerObject(computerRaquet);

        this.state.addShape(computerRaquet);

        playerRaquet = new a.PlayerRaquet();
        this.registerObject(playerRaquet);

        this.state.addShape(playerRaquet);

        ball = new a.Ball();
        this.registerObject(ball);

        this.state.addShape(ball);


        this.field = new a.Field();
        this.registerObject(this.field);
        this.state.addShape(this.field);

        scoreComputer = new a.Letter();
        scoreComputer.setPosition(this.ctx.width / 4 - 30, 60);
        this.registerObject(scoreComputer);
        this.state.addShape(scoreComputer);

        scorePlayer = new a.Letter();
        scorePlayer.setPosition(this.ctx.width / 4 * 3 - 30, 60);
        this.registerObject(scorePlayer);
        this.state.addShape(scorePlayer);

        this.ball = ball;
        this.computerRaquet = computerRaquet;
        this.playerRaquet = playerRaquet;
        this.scoreComputer = scoreComputer;
        this.scorePlayer = scorePlayer;

        this.animLoop();
    };

    Game.prototype.guideComputerPlayer = function () {
        var ballHeight = this.ball.y,
            midH = this.computerRaquet.y + this.computerRaquet.h / 2;

        this.computerRaquet.direction = midH < ballHeight;
    };


    Game.prototype.checkImpact = function () {

        var ballDepth = this.ball.x,
            ballHeight = this.ball.y,
            ballW = this.ball.w,
            ballH = this.ball.h;

        if (ballDepth <= 0) {
            // out of the back wall
            this.markPoint(true);
        } else if ((ballDepth + ballW) >= this.ctx.width) {
            // out of the player wall
            this.markPoint(false);
        } else if (ballDepth <= (this.computerRaquet.w + this.computerRaquet.x) && ballDepth >= (this.computerRaquet.x)) {
            // might be bouncing on the computer raquet
            if ((ballHeight + ballH) >= this.computerRaquet.y && ballHeight <= (this.computerRaquet.y + this.computerRaquet.h)) {
                // bouncing on the computer raquet
                this.ball.invertX();
                // if hitting on the corner, deviate it slighly
                this.checkCorner(this.computerRaquet);
                return;
            }
        } else if (ballDepth + ballW >= (this.playerRaquet.x) && (ballDepth + ballW) <= (this.playerRaquet.x + this.playerRaquet.w)) {
            // might be bouncing on the player raquet
            if ((ballHeight + ballH) >= this.playerRaquet.y && ballHeight <= (this.playerRaquet.y + this.playerRaquet.h)) {
                // bouncing on the computer raquet
                this.ball.invertX();
                this.checkCorner(this.playerRaquet);
                return;
            }
        } else {
            // check impact on walls
            if (((ballHeight <= 0 && !this.ball.direction.y)) || (((ballHeight + ballH) >= this.ctx.height) && this.ball.direction.y)) {
                this.ball.invertY();
                return;
            }
        }
    };

    Game.prototype.checkCorner = function(raquet) {
        var ballDepth = this.ball.x,
            ballHeight = this.ball.y,
            ballW = this.ball.w,
            ballH = this.ball.h;
        if (Math.abs((ballHeight + ballH / 2) - (raquet.y + raquet.h / 2)) > raquet.h / 3) {
            this.ball.yFactor = 1.3;
        } else {
            this.ball.yFactor = 1;
        }
    };

    Game.prototype.markPoint = function(forPlayer) {
        if (forPlayer) {
            this.score.player++;
            this.scorePlayer.setLetter(this.formatScore(this.score.player));
        } else {
            this.score.computer++;
            this.scoreComputer.setLetter(this.formatScore(this.score.computer));
        }
        this.restartBall();
    };

    Game.prototype.formatScore = function(score) {
        if (score > 9) {
            return score;
        }
        return 0 + score.toString();
    };

    Game.prototype.restartBall = function () {
        this.ball.setPosition(this.ctx.width / 2 - this.ball.w / 2, this.ctx.height / 2 - this.ball.h / 2);
        this.ball.direction = {
            x : Math.random()<.5,
            y : Math.random()<.5
        }
    };

    Game.prototype.elementsToAnimate = [];

    Game.prototype.registerObject = function (obj, params) {
        this.elementsToAnimate.push({
            obj : obj,
            params : params
        })
    };

    Game.prototype.animateElements = function () {
        var l = this.elementsToAnimate.length - 1,
            el;
        while (l >= 0) {
            el = this.elementsToAnimate[l];
            el.obj.onFrame.call(el.obj, el.params);
            l--;
        }
        this.state.redraw();
    };

    Game.prototype.animLoop = function() {

        var clockInterval, onClock;

        onClock = _.bind(function() {
            this.checkImpact();
            this.guideComputerPlayer();
            this.animateElements();
            clockInterval = window.requestAnimationFrame(onClock);
        }, this);
        onClock();
    };

    a.game = new Game();
    a.game.init();

}(app));
