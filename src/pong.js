var app = app || {};

(function(a) {

    var ctxY = 300,
        ctxX = 400;

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

    function Raquet(){
        this.setSize(5,50);
        this.setColor('pink');
    }
    Raquet.prototype = new Shape();
    Raquet.prototype.direction = null;

    function ComputerRaquet() {}
    ComputerRaquet.prototype = new Raquet();

    ComputerRaquet.prototype.onFrame = function () {
        if (this.direction) {
            this.y++;
        } else {
            this.y--;
        }
        (this.y <= 0 && !this.direction) && (this.direction = true);
        (this.y >= ctxY && this.direction) && (this.direction = false);

    };

    a.ComputerRaquet = ComputerRaquet;

    function PlayerRaquet() {
        var _self = this;
        this.setPosition(300, 0);
        document.addEventListener('keyup', _.bind(this.onKeyUp, this));
        document.addEventListener('keydown', _.bind(this.onKeyDown, this));
    }
    PlayerRaquet.prototype = new Raquet();
    PlayerRaquet.prototype.onKeyDown = function(ev) {
        switch(ev.keyCode) {
            case 37:
                this.direction = false;
                break;
            case 39:
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
        if (this.direction && this.y <= ctxY) {
            this.y++;
        } else if (this.direction === false && this.y >= 0) {
            this.y--;
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
            this.y++;
        } else {
            this.y--;
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

        var computerRaquet, playerRaquet, ball;

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

        this.ball = ball;
        this.computerRaquet = computerRaquet;
        this.playerRaquet = playerRaquet;

        this.animLoop();
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
                return;
            }
        } else if (ballDepth + ballW >= (this.playerRaquet.x) && (ballDepth + ballW) <= (this.playerRaquet.x + this.playerRaquet.w)) {
            // might be bouncing on the player raquet
            if ((ballHeight + ballH) >= this.playerRaquet.y && ballHeight <= (this.playerRaquet.y + this.playerRaquet.h)) {
                // bouncing on the computer raquet
                this.ball.invertX();
                return;
            }
        } else {
            // check impact on walls
            if (ballHeight === 0 || ballHeight + ballH === this.ctx.height) {
                this.ball.invertY();
                return;
            }
        }
    };

    Game.prototype.markPoint = function(forPlayer) {
        if (forPlayer) {
            this.score.player++;
        } else {
            this.score.computer++;
        }
        this.restartBall();
    };

    Game.prototype.restartBall = function () {
        this.ball.setPosition(100, 100);
        this.ball.direction = {
            x : Math.random()<.5,
            y : Math.random()<.5
        }
    };

    Game.prototype.elementsToAnimate = [];

    Game.prototype.registerObject = function (obj, params) {
        this.elementsToAnimate.push({
            obj : obj,
            params : params || undefined
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
            this.animateElements();
            clockInterval = window.requestAnimationFrame(onClock);
        }, this);
        onClock();
    };

    a.game = new Game();
    a.game.init();

}(app));
