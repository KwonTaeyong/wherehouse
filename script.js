var level = [
    [1, 1, 0, 1, 1, 0, 1, 2, 4, 3],
    [0, 0, 1, 3, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 2, 0],
    [0, 0, 0, 2, 3, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 4, 0, 0],
    [0, 1, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 3, 1, 1, 3, 0, 2, 1, 1],
    [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 2, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

(function () {
    var direction = {
        left: [-1, 0],
        up: [0, -1],
        right: [1, 0],
        down: [0, 1]
    }

    function Player(x, y, el) {
        this.element = el;
        this.pos = {x: x, y: y},
            this.ready = true;
        this.rotation = 0;
        this.dir = 'down';
    }

    var pieces = ["", "wall", "box", "dropzone", "player"];

    var state = {
        level: null,
        dropzones: null,
        player: null,
        board: document.getElementById("board"),
        rotation: 0,
        quality: true
    }

    function renderLevel() {
        var frag = document.createDocumentFragment(),
            level = state.level,
            pieceType,
            playerMarkup = document.getElementById('player-markup').innerHTML,
            boxMarkup = document.getElementById('box-markup').innerHTML;

        state.dropzones = [];

        for (y = 0; y < level.length; y++) {
            for (x = 0; x < level[y].length; x++) {
                pieceType = level[y][x];
                if (pieceType) {
                    var piece = document.createElement("div");
                    piece.className = "piece " + pieces[pieceType];
                    piece.setAttribute('style', 'left:' + x + "0%; top:" + y + "0%");

                    if (pieceType !== 3) {
                        piece.innerHTML = pieceType == 4 ? playerMarkup : boxMarkup;
                    }

                    if (pieceType === 1) {
                        piece.className += getWallClass(x, y);
                    } else if (pieceType === 4) {
                        state.player = new Player(x, y, piece);
                    } else if (pieceType === 2) {
                        piece.setAttribute('id', 'box-' + x + '-' + y);
                    } else if (pieceType === 3) {
                        state.dropzones.push({x: x, y: y});
                    }

                    frag.appendChild(piece);
                }
            }
        }

        state.board.appendChild(frag);
    }

    function init(level) {
        if (!useHighQuality()) {
            document.body.className = 'low-quality low-quality--forced';
        }

        state.level = JSON.parse(JSON.stringify(level));
        renderLevel();

        state.player.element.addEventListener("transitionend", function () {
            if (isLevelComplete()) {
                document.getElementById('success-message').classList.remove('hidden');
            } else {
                state.player.ready = true;
            }
        });
        window.addEventListener("keydown", keyDown, false);
    }

    function getWallClass(x, y) {
        var classString = ' ',
            leftPos = {x: (x - 1), y: y},
            rightPos = {x: (x + 1), y: y},
            upPos = {x: x, y: (y - 1)},
            downPos = {x: x, y: (y + 1)};

        if (getPieceFromPos(leftPos) === 1)
            classString += 'ls ';
        if (getPieceFromPos(rightPos) === 1)
            classString += 'rs ';
        if (getPieceFromPos(upPos) === 1)
            classString += 'us ';
        if (getPieceFromPos(downPos) === 1)
            classString += 'ds ';

        return classString.slice(0, -1);
    }

    function isLevelComplete() {
        var isComplete = true;

        for (i = 0; i <= state.dropzones.length; i++) {
            if (state.dropzones[i] && state.level[state.dropzones[i].y][state.dropzones[i].x] !== 2) {
                isComplete = false;
                break;
            }
        }

        return isComplete;
    }

    function useHighQuality() {
        // ಠ_ಠ
        return (/Chrome/gi).test(navigator.userAgent);
    }

    function move(dir, dirName) {
        if (state.player.ready) {
            var oldPos = {x: state.player.pos.x, y: state.player.pos.y},
                pos = newPos(oldPos, dir),
                piece = getPieceFromPos(pos),
                canPush = (piece === 2 && canMoveFromPos(pos, dir));

            if (piece === 0 || piece === 3 || canPush) {
                state.player.pos = pos;
                setPieceOnPos(0, oldPos);
                setPieceOnPos(4, pos);


                state.player.element.setAttribute('style', getStyleForPos(pos) + getPlayerRotation(dirName));
                state.player.element.className = "piece player";

                if (canPush) {
                    var newBoxPos = newPos(pos, dir),
                        box = document.getElementById('box-' + pos.x + '-' + pos.y);
                    box.setAttribute('id', 'box-' + newBoxPos.x + '-' + newBoxPos.y);
                    box.setAttribute('style', getStyleForPos(newBoxPos));
                    setPieceOnPos(2, newBoxPos);
                }

                state.player.ready = false;
            }
        }
    }

    function getPlayerRotation(dirName) {
        var rotation = state.player.rotation,
            rotArray;

        switch (state.player.dir) {
            case "up":
                rotArray = [0, 1, 2, -1];
                break;
            case "right":
                rotArray = [-1, 0, 1, 2];
                break;
            case "down":
                rotArray = [2, -1, 0, 1];
                break;
            case "left":
                rotArray = [1, 2, -1, 0];
                break;
        }

        switch (dirName) {
            case "up":
                rotation += rotArray[0];
                break;
            case "right":
                rotation += rotArray[1];
                break;
            case "down":
                rotation += rotArray[2];
                break;
            case "left":
                rotation += rotArray[3];
                break;
        }

        state.player.rotation = rotation;
        state.player.dir = dirName;

        return "transform: rotate(" + ((rotation * 90) - state.rotation) + "deg);";
    }

    function getStyleForPos(pos) {
        return ('left:' + pos.x + '0%; top:' + pos.y + '0%;');
    }

    function canMoveFromPos(oldPos, dir) {
        var pos = newPos(oldPos, dir),
            piece = getPieceFromPos(pos);

        return (piece === 0 || piece === 3);
    }

    function setPieceOnPos(piece, pos) {
        state.level[pos.y][pos.x] = piece;
    }

    function getPieceFromPos(pos) {
        if (pos.y >= 0 && pos.x >= 0 && pos.y < 10 && pos.x < 10)
            return state.level[pos.y][pos.x];

        return null;
    }

    function newPos(pos, dir) {
        if (pos) {
            var pos = Object.create(pos);
            pos.x += dir[0];
            pos.y += dir[1];
        }
        return pos;
    }

    function keyDown(e) {
        if (e.keyCode >= 37 && e.keyCode <= 40) {
            e.preventDefault();

            if (e.keyCode === 37) {
                move(direction.left, "left");
            } else if (e.keyCode === 38) {
                move(direction.up, "up");
            } else if (e.keyCode === 39) {
                move(direction.right, "right");
            } else if (e.keyCode === 40) {
                move(direction.down, "down");
            }
        }
    }

    function rotate(clockwise) {
        var directions = [];
        state.rotation += clockwise ? 90 : -90;

        state.board.setAttribute('style', 'transform: rotateX(40deg) rotate(' + (state.rotation + 45) + 'deg)');

        for (key in direction) {
            directions.push(direction[key]);
        }

        if (!clockwise)
            directions.push(directions.shift());
        else
            directions.unshift(directions.pop());

        direction.left = directions[0];
        direction.up = directions[1];
        direction.right = directions[2];
        direction.down = directions[3];
    }

    function restart() {
        state.board.innerHTML = "";
        document.getElementById('success-message').classList.add('hidden');
        init(level);
    }

    function toggleQuality() {
        state.quality = !state.quality;
        document.body.className = state.quality ? '' : 'low-quality';
    }

    window.sokoban = {
        init: init,
        rotate: rotate,
        restart: restart,
        toggleQuality: toggleQuality
    }
})();

sokoban.init(level);

//makes the + button do addition
function up(max) {
    document.getElementById("num").value = parseInt(document.getElementById("num").value) + 1;
}

//makes the - button do subtraction
function down(min) {
    document.getElementById("num").value = parseInt(document.getElementById("num").value) - 1;
    //stops it going below 1
    if (document.getElementById("num").value <= parseInt(min)) {
        document.getElementById("num").value = min;
    }
}

//hide the overlay class
//$(".overlay").hide();


// https://stackoverflow.com/questions/26759529/jquery-ui-dropdrag-inventory-with-stackable-items


//inventory draggability
//what you see being dragged
$(function () {
    function createHelper() {
        return $("<div />", {
            css: {
                border: "2px solid #444",
                background: "yellow",
                height: 75,
                width: 75
            }
        });
    }

    var item_isStackable = "";
    $(".item").draggable({
        scroll: true,
        revert: function (isValidEl) {
            //conditions under which it's not draggable
            if (isValidEl) {
                return false;
            } else {
                return true;
            }
        },
        helper: createHelper,
        start: function () {
            $(this).effect("highlight", {}, 1000);
        },
        drag: function (event, ui) {
            item_isStackable = $(this).hasClass("stackable");
            //adds to var item_isStackable if it has the class of stackable
        },
    });
//inventory droppability
    $(".item-cell").droppable({
        accept: ".item",
        //item-cell will only accept .item
        drop: function (event, ui) {
            //large drop function
            var item = $(this).find(".item");
            if (item.length == 0) {
                ui.draggable.detach().appendTo($(this));
                //if inv slot is empty insert item
            } else if ($(this).context.innerHTML.includes(ui.draggable.context.innerHTML) == true && item_isStackable == true && item.hasClass("stackable") && ui.draggable.filter(function () {
                var d = this;
                return item.filter(function () {
                    return d == this;
                }).length > 0;
            }).length === 0) {
                //1st check if droppable and stackable are identical items
                //2nd check if both clone AND original are stackable
                //3rd stop (droppable) clone stacking with original
                console.log("Combining Items");
                ui.draggable.detach();
                //if it worked destroy the (draggable) clone
            } else {
                console.log("Reverting Position");
                ui.draggable.animate(ui.draggable.data().origPosition, "slow");
                //if not dropped in a cell revert everything back
            }
            alert("이동성공")
        }
    });
});

// 2d

(function () {
    var Box, Editor,
        __bind = function (fn, me) {
            return function () {
                return fn.apply(me, arguments);
            };
        };

    Editor = (function () {
        function Editor(cad) {
            this.onPointerUp = __bind(this.onPointerUp, this);
            this.onPointerMove = __bind(this.onPointerMove, this);
            this.onPointerDown = __bind(this.onPointerDown, this);
            this.prevent = __bind(this.prevent, this);
            this.dom = $(".cad");
            this.objects = [];
            this.selected = [];
            this.dragging = false;
            this.dom.on("mousedown touchstart", this.onPointerDown);
            this.dom.on("mousemove touchmove", this.onPointerMove);
            this.dom.on("mouseup touchend touchcancel", this.onPointerUp);
        }

        Editor.prototype.createBox = function (l, t, r, b, parent, styleClass) {
            var box;
            box = new Box(this, l, t, r, b, parent, styleClass);
            this.objects.push(box);
            return box;
        };

        Editor.prototype.clearSelections = function () {
            $.each(this.objects, (function (_this) {
                return function (i, obj) {
                    return obj.unselect();
                };
            })(this));
            return this.selected = [];
        };

        Editor.prototype.isSelected = function (obj) {
            return this.selected.indexOf(obj) !== -1;
        };

        Editor.prototype.prevent = function (e) {
            e.preventDefault();
            return e.stopPropagation();
        };

        Editor.prototype.onPointerDown = function (e) {
            var box, target;
            this.prevent(e);
            this.dragging = false;
            this.resizing = false;
            this.moving = false;
            target = $(e.target).closest(".box");
            if (target.length > 0) {
                box = target.data("obj");
                if (this.selected.length > 0) {
                    $.each(this.objects, (function (_this) {
                        return function (i, obj) {
                            if (obj !== box) {
                                return obj.unselect();
                            }
                        };
                    })(this));
                }
                if (box.selected !== true) {
                    box.select();
                    this.selected = [box];
                }
            } else {
                this.clearSelections();
            }
            if (this.selected.length > 0) {
                this.dragging = true;
                if ($(e.target).hasClass("resize-helper")) {
                    console.log("Resizing");
                    this.resizing = true;
                    this.resizingHelper = $(e.target);
                    $.each(this.selected, (function (_this) {
                        return function (i, obj) {
                            return obj.startResizing();
                        };
                    })(this));
                } else {
                    console.log("Moving");
                    this.dragging = true;
                    this.moving = true;
                    $.each(this.selected, (function (_this) {
                        return function (i, obj) {
                            return obj.startMoving();
                        };
                    })(this));
                }
                return this.startPos = {
                    x: e.pageX,
                    y: e.pageY
                };
            }
        };

        Editor.prototype.onPointerMove = function (e) {
            var dx, dy;
            this.prevent(e);
            if (this.dragging) {
                dx = e.pageX - this.startPos.x;
                dy = e.pageY - this.startPos.y;
                return $.each(this.selected, (function (_this) {
                    return function (i, obj) {
                        if (_this.moving) {
                            obj.applyMoving(dx, dy);
                        }
                        if (_this.resizing) {
                            return obj.applyResizing(_this.resizingHelper, dx, dy);
                        }
                    };
                })(this));
            }
        };

        Editor.prototype.onPointerUp = function (e) {
            this.prevent(e);
            if (this.dragging) {
                this.dragging = false;
                if (this.moving) {
                    this.moving = false;
                    $.each(this.selected, (function (_this) {
                        return function (i, obj) {
                            return obj.stopMoving();
                        };
                    })(this));
                }
                if (this.resizing) {
                    this.resizing = false;
                    return $.each(this.selected, (function (_this) {
                        return function (i, obj) {
                            return obj.stopResizing();
                        };
                    })(this));
                }
            }
        };

        return Editor;

    })();

    Box = (function () {
        function Box(_at_editor, l, t, r, b, _at_parent, _at_styleClass) {
            this.editor = _at_editor;
            this.parent = _at_parent;
            this.styleClass = _at_styleClass;
            this.pos = {
                left: l,
                top: t,
                right: r,
                bottom: b
            };
            this.dom = null;
            this.selected = false;
            this.parentDom = this.parent ? this.parent.dom : this.editor.dom;
            this.render();
        }

        Box.prototype.setCss = function () {
            return this.dom.css({
                left: this.pos.left + "%",
                top: this.pos.top + "%",
                width: this.getWidth() + "%",
                height: this.getHeight() + "%"
            });
        };

        Box.prototype.render = function () {
            if (this.dom == null) {
                this.dom = $("<div/>").addClass("box");
                if (this.styleClass != null) {
                    this.dom.addClass(this.styleClass);
                }
                this.dom.data("obj", this);
                this.dom.append($("<span/>"));
                this.createHelpers();
                this.dom.appendTo(this.parentDom);
            }
            return this.setCss();
        };

        Box.prototype.createHelpers = function () {
            this.dom.append($("<div/>").attr("direction", "n").addClass("resize-helper rh-n"));
            this.dom.append($("<div/>").attr("direction", "s").addClass("resize-helper rh-s"));
            this.dom.append($("<div/>").attr("direction", "e").addClass("resize-helper rh-e"));
            this.dom.append($("<div/>").attr("direction", "w").addClass("resize-helper rh-w"));
            this.dom.append($("<div/>").attr("direction", "ne").addClass("resize-helper rh-ne"));
            this.dom.append($("<div/>").attr("direction", "se").addClass("resize-helper rh-se"));
            this.dom.append($("<div/>").attr("direction", "nw").addClass("resize-helper rh-nw"));
            return this.dom.append($("<div/>").attr("direction", "sw").addClass("resize-helper rh-sw"));
        };

        Box.prototype.select = function () {
            if (this.selected !== true) {
                this.selected = true;
                return this.dom.addClass("selected");
            }
        };

        Box.prototype.unselect = function () {
            if (this.selected) {
                this.selected = false;
                return this.dom.removeClass("selected");
            }
        };

        Box.prototype.startMoving = function () {
            this.dom.addClass("moving");
            this.savePos();
            return this.dom.find("> span").text("X: " + this.pos.left + "%, Y: " + this.pos.top + "%");
        };

        Box.prototype.stopMoving = function () {
            return this.dom.removeClass("moving");
        };

        Box.prototype.startResizing = function () {
            this.dom.addClass("resizing");
            this.savePos();
            return this.dom.find("> span").text("W: " + (this.getWidth()) + "%, H: " + (this.getHeight()) + "%");
        };

        Box.prototype.stopResizing = function () {
            return this.dom.removeClass("resizing");
        };

        Box.prototype.savePos = function () {
            this.origPos = this.pos;
            this.origPos.width = this.getWidth;
            this.origPos.height = this.getHeight;
            return console.log("savePos");
        };

        Box.prototype.percentW = function (x) {
            return Math.round(x * 100.0 / this.parentDom.width());
        };

        Box.prototype.percentH = function (y) {
            return Math.round(y * 100.0 / this.parentDom.height());
        };

        Box.prototype.checkLimits = function (v) {
            return Math.max(Math.min(100, v), 0);
        };

        Box.prototype.getWidth = function () {
            return 100 - this.pos.right - this.pos.left;
        };

        Box.prototype.getHeight = function () {
            return 100 - this.pos.bottom - this.pos.top;
        };

        Box.prototype.applyMoving = function (dx, dy) {
            var dxp, dyp, newPos;
            dxp = this.percentW(dx);
            dyp = this.percentH(dy);
            newPos = {
                left: this.origPos.left + dxp,
                top: this.origPos.top + dyp,
                right: this.origPos.right - dxp,
                bottom: this.origPos.bottom - dyp
            };
            this.pos = this.checkBorders(newPos);
            this.render();
            return this.dom.find("> span").text("X: " + this.pos.left + "%, Y: " + this.pos.top + "%" + '1번 렉');
        };

        Box.prototype.applyResizing = function (resizingHelper, dx, dy) {
            var dir, dxp, dyp, newPos;
            dxp = this.percentW(dx);
            dyp = this.percentH(dy);
            newPos = $.extend({}, this.origPos);
            dir = resizingHelper.attr("direction");
            switch (dir) {
                case "n":
                    newPos.top += dyp;
                    break;
                case "e":
                    newPos.right -= dxp;
                    break;
                case "s":
                    newPos.bottom -= dyp;
                    break;
                case "w":
                    newPos.left += dxp;
                    break;
                case "ne":
                    newPos.top += dyp;
                    newPos.right -= dxp;
                    break;
                case "se":
                    newPos.bottom -= dyp;
                    newPos.right -= dxp;
                    break;
                case "nw":
                    newPos.top += dyp;
                    newPos.left += dxp;
                    break;
                case "sw":
                    newPos.bottom -= dyp;
                    newPos.left += dxp;
            }
            this.pos = this.checkBorders(newPos);
            this.render();
            return this.dom.find("> span").text("W: " + (this.getWidth()) + "%, H: " + (this.getHeight()) + "%");
        };

        Box.prototype.checkBorders = function (newPos) {
            if (newPos.left < 0) {
                newPos.left = 0;
                newPos.right = 100 - this.getWidth();
            }
            if (newPos.top < 0) {
                newPos.top = 0;
                newPos.bottom = 100 - this.getHeight();
            }
            if (newPos.right < 0) {
                newPos.right = 0;
                newPos.left = 100 - this.getWidth();
            }
            if (newPos.bottom < 0) {
                newPos.bottom = 0;
                newPos.top = 100 - this.getHeight();
            }
            return newPos;
        };

        return Box;

    })();

    $(function () {
        var box1, box2, box3, box4, editor;
        editor = new Editor($(".container"));
        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        box2 = editor.createBox(5, 20, 70, 40, box1, "green");

        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        box2 = editor.createBox(5, 20, 70, 40, box1, "green");

        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        box2 = editor.createBox(5, 20, 70, 40, box1, "green");

        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        box2 = editor.createBox(5, 20, 70, 40, box1, "green");

        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        box2 = editor.createBox(5, 20, 70, 40, box1, "green");

        box1 = editor.createBox(20, 10, 50, 70, null, "red");
        box2 = editor.createBox(10, 20, 70, 40, box1, "green");
        // box2 = editor.createBox(5, 20, 70, 40, box1, "green");
        // box3 = editor.createBox(70, 70, 10, 10, null, "blue");
        // return box4 = editor.createBox(15, 45, 55, 30, null, "orange");
    });

}).call(this);

// drap and drop
function up(max) {
    document.getElementById("num").value = parseInt(document.getElementById("num").value) + 1;
}

//makes the - button do subtraction
function down(min) {
    document.getElementById("num").value = parseInt(document.getElementById("num").value) - 1;
    //stops it going below 1
    if (document.getElementById("num").value <= parseInt(min)) {
        document.getElementById("num").value = min;
    }
}

//hide the overlay class
//$(".overlay").hide();


// https://stackoverflow.com/questions/26759529/jquery-ui-dropdrag-inventory-with-stackable-items


//inventory draggability
//what you see being dragged
$(function () {
    function createHelper() {
        return $("<div />", {
            css: {
                border: "2px solid #444",
                background: "yellow",
                height: 75,
                width: 75
            }
        });
    }

    var item_isStackable = "";
    $(".item").draggable({
        scroll: true,
        revert: function (isValidEl) {
            //conditions under which it's not draggable
            if (isValidEl) {
                return false;
            } else {
                return true;
            }
        },
        helper: createHelper,
        start: function () {
            $(this).effect("highlight", {}, 1000);
        },
        drag: function (event, ui) {
            item_isStackable = $(this).hasClass("stackable");
            //adds to var item_isStackable if it has the class of stackable
        },
    });
//inventory droppability
    $(".item-cell").droppable({
        accept: ".item",
        //item-cell will only accept .item
        drop: function (event, ui) {
            //large drop function
            var item = $(this).find(".item");
            if (item.length == 0) {
                console.log("Inserting");
                ui.draggable.detach().appendTo($(this));
                //if inv slot is empty insert item
            } else if ($(this).context.innerHTML.includes(ui.draggable.context.innerHTML) == true && item_isStackable == true && item.hasClass("stackable") && ui.draggable.filter(function () {
                var d = this;
                return item.filter(function () {
                    return d == this;
                }).length > 0;
            }).length === 0) {
                //1st check if droppable and stackable are identical items
                //2nd check if both clone AND original are stackable
                //3rd stop (droppable) clone stacking with original
                console.log("Combining Items");
                ui.draggable.detach();
                //if it worked destroy the (draggable) clone
            } else {
                console.log("Reverting Position");
                ui.draggable.animate(ui.draggable.data().origPosition, "slow");
                //if not dropped in a cell revert everything back
            }
        }
    });
});