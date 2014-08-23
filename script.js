var debug = 0;

function randdelta(amount, scale) {
    var randvalue = (Math.random() * 2) - 1;
    // cheap approximation of gaussian curve
    var curve = Math.pow(Math.E, -Math.pow(randvalue*2.75, 2));
    var squashed = (randvalue * curve) * amount;
    var delta = squashed * scale;
    return delta;
}

function change(amount, value, min, max) {
    var size = max - min;
    var jitter = randdelta(amount, max);
    var newvalue = value + jitter;
    while (newvalue > max) {
        newvalue -= size;
    }
    while (newvalue < min) {
        newvalue += size;
    }
    return newvalue;
}

function changeall(amount, elements, room) {
    var e = angular.copy(elements);
    for (var i = 0; i < e.length; i++) {
        var element = e[i];
        var minradius = Math.min(element.width/2, element.height/2);
        element.x = change(amount, element.x, minradius, room.width-minradius);
        element.y = change(amount, element.y, minradius, room.height-minradius);
        element.rotation = change(amount, element.rotation, 0, 360);
        element.points = null;
    }
    return e;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
}
if (debug >= 1) {
    console.log("distance test:", distance(0, 0, 1, 0), 1);
    console.log("distance test:", distance(0, 0, 1, 1));
    console.log("distance test:", distance(-30, -40, 100, 100));
}

function rotatepoint(point, center, angle) {
    // from http://www.gamefromscratch.com/post/2012/11/24/GameDev-math-recipes-Rotating-one-point-around-another-point.aspx
    var anglerad = -angle * (Math.PI/180);
    return {
        x: Math.cos(anglerad) * (point.x - center.x) - Math.sin(anglerad) * (point.y - center.y) + center.x,
        y: Math.sin(anglerad) * (point.x - center.x) + Math.cos(anglerad) * (point.y - center.y) + center.y
    }
}
if (debug >= 1) {
    console.log("positive rotate:", rotatepoint({x: 0, y: 30}, {x: 0, y: 0}, 15));
    console.log("360 rotate to 0:", rotatepoint({x: 0, y: 0}, {x: 10, y: 10}, 360));
    console.log("180 rotate to 0:", rotatepoint({x: 20, y: 20}, {x: 10, y: 10}, 180));
}

function points(square) {
    if (square.points !== undefined && square.points !== null) {
        return square.points;
    }
    var x0 = square.x - square.width/2;
    var x1 = square.x + square.width/2;
    var y0 = square.y - square.height/2;
    var y1 = square.y + square.height/2;
    square.points = [
        rotatepoint({x: x0, y: y0}, square, square.rotation),
        rotatepoint({x: x0, y: y1}, square, square.rotation),
        rotatepoint({x: x1, y: y1}, square, square.rotation),
        rotatepoint({x: x1, y: y0}, square, square.rotation),
    ];
    return square.points;
}
if (debug >= 1) {
    console.log("points blah:", points({x: 30, y: 30, width: 10, height: 20, rotation: 10}));
    console.log("points 45:", points({x: 0, y: 0, width: 5, height: 5, rotation: 45}));
    console.log("points 90:", points({x: 0, y: 0, width: 5, height: 5, rotation: 90}));
    console.log("points thin:", points({x: 0, y: 0, width: 50, height: 5, rotation: 0}));
    console.log("points tall:", points({x: 0, y: 0, width: 5, height: 50, rotation: 0}));
    console.log("points far:", points({x: 100, y: 100, width: 5, height: 5, rotation: 0}));
}

function intersects(obja, objb) {
    if (obja.circular === true && objb.circular === true) {
        // dual-circle intersection
        if (debug >= 2) console.log("circle intersect");
        return distance(obja.x, obja.y, objb.x, objb.y) < obja.width + objb.width;
    } else if (obja.circular === true || objb.circular === true) {
        // note: this is not actually a proper collision solution.
        // fail case: wide rectangle, small circle, circle intersects
        // short line on rectangle. to solve would need line intersect
        // between all edges of rectangle and line between centers.
        //
        // cbf for something that's ultimately just a filter.
        if (debug >= 2) console.log("circle-box intersect");
        if (obja.circular === true) {
            var objc = obja;
            obja = objb;
            objb = objc;
        }
        var square = obja;
        var circle = objb;
        var sqpoints = points(square);
        var radius = circle.width / 2;
        for (var x = 0; x < sqpoints.length; x++) {
            var point = sqpoints[x];
            var d = distance(point.x, point.y, circle.x, circle.y);
            if (d < radius) {
                if (debug >= 3) console.log("point", x, "intersect", d);
                return true;
            }
        }
        var centerd = distance(square.x, square.y, circle.x, circle.y);
        if (debug >= 3) console.log("centerd", centerd, radius);
        var sqminradius = Math.min(square.width, square.height)/2;
        return centerd < (radius + sqminradius);
    } else {
        if (debug >= 2) console.log("box intersect");
        var pointsa = points(obja);
        var pointsb = points(objb);
        return intersectPolys(pointsa, pointsb);
    }
}
if (debug >= 1) {
    console.log("intersect s+s:", intersects(
        {x: 0, y: 0, width: 10, height: 10, rotation: 0, circular: true},
        {x: 10, y: 10, width: 10, height: 10, rotation: 0, circular: true}
    ));
    console.log("intersect s-s:", intersects(
        {x: 0, y: 0, width: 10, height: 10, rotation: 0, circular: true},
        {x: 100, y: 10, width: 10, height: 10, rotation: 0, circular: true}
    ));
    console.log("intersect s+q:", intersects(
        {x: 30, y: 3, width: 10, height: 10, rotation: 0, circular: true},
        {x: 35.5, y: 3, width: 1, height: 1, rotation: 45}
    ));
    console.log("intersect s-q:", intersects(
        {x: 36, y: 3, width: 1, height: 1, rotation: 45},
        {x: 30, y: 3, width: 10, height: 10, rotation: 0, circular: true}
    ));
    console.log("intersect q+q:", intersects(
        {x: 30, y: 3, width: 10, height: 10, rotation: 30},
        {x: 36, y: 3, width: 1, height: 1, rotation: 45}
    ));
    console.log("intersect q-q:", intersects(
        {x: 30, y: 3, width: 10, height: 10, rotation: 0},
        {x: 36, y: 3, width: 1, height: 1, rotation: 0}
    ));
}

function contained(obja, bounds) {
    var z = {
        x0: bounds.x - bounds.width/2,
        x1: bounds.x + bounds.width/2,
        y0: bounds.y - bounds.height/2,
        y1: bounds.y + bounds.height/2
    };
    var objbounds;
    if (obja.circular === true) {
        var radius = obja.width / 2;
        objbounds = {
            x0: obja.x - radius,
            x1: obja.x + radius,
            y0: obja.y - radius,
            y1: obja.y + radius,
        };
    } else {
        var p = points(obja);
        var xs = [p[0].x, p[1].x, p[2].x, p[3].x];
        var ys = [p[0].y, p[1].y, p[2].y, p[3].y];
        objbounds = {
            x0: Math.min.apply(null, xs),
            x1: Math.max.apply(null, xs),
            y0: Math.min.apply(null, ys),
            y1: Math.max.apply(null, ys)
        }
    }
    return (
        objbounds.x0 > z.x0
        && objbounds.x1 < z.x1
        && objbounds.y0 > z.y0
        && objbounds.y1 < z.y1
    );
}
if (debug >= 1) {
    var testbounds = {x: 15, y: 15, width: 300, height: 34, circular: false, rotation: 0};
    console.log("not contained:", contained({x: 0, y: 0, width: 10, height: 10, rotation: 0, circular: true}, testbounds));
    console.log("contained:", contained({x: 10, y: 10, width: 10, height: 10, rotation: 0, circular: true},  testbounds));
    console.log("not contained:", contained({x: 0, y: 0, width: 10, height: 10, rotation: 0, circular: true}, testbounds));
    console.log("contained:", contained({x: 100, y: 10, width: 10, height: 10, rotation: 0, circular: true}, testbounds));
    console.log("not contained:", contained({x: 30, y: 3, width: 10, height: 10, rotation: 0, circular: true}, testbounds));
    console.log("contained:", contained({x: 35.5, y: 3, width: 1, height: 1, rotation: 45}, testbounds));
    console.log("contained:", contained({x: 36, y: 3, width: 1, height: 1, rotation: 45}, testbounds));
    console.log("not contained:", contained({x: 30, y: 3, width: 10, height: 10, rotation: 0, circular: true}, testbounds));
    console.log("not contained:", contained({x: 30, y: 3, width: 10, height: 10, rotation: 30}, testbounds));
    console.log("contained:", contained({x: 36, y: 3, width: 1, height: 1, rotation: 45}, testbounds));
    console.log("not contained:", contained({x: 30, y: 3, width: 10, height: 10, rotation: 0}, testbounds));
    console.log("contained:", contained({x: 36, y: 3, width: 1, height: 1, rotation: 0}, testbounds));
}

function physicallypossible(room, elements) {
    var result = true;
    for (var e = 0; e < elements.length; e++) {
        var element = elements[e];
        if (!contained(element, room)) {
            if (debug >= 1) console.log("element not contained in room", element, room);
            result = false;
        }
        for (var oe = e + 1; oe < elements.length; oe++) {
            var otherelement = elements[oe];
            if (intersects(element, otherelement)) {
                if (debug >= 1) console.log("elements intersect", element, otherelement);
                result = false;
            }
        }
        for (var f = 0; f < room.features.length; f++) {
            var feature = room.features[f];
            if (feature.collide && intersects(element, feature)) {
                if (debug >= 1) console.log("element intersects room feature", element, feature);
                result = false;
            }
        }
    }
    return result;
}

/**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem
 *
 * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @return true if there is any intersection between the 2 polygons, false otherwise
 */
function intersectPolys(a, b) {
    // from http://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        var polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            var i2 = (i1 + 1) % polygon.length;
            var p1 = polygon[i1];
            var p2 = polygon[i2];

            // find the line perpendicular to this edge
            var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (minA === undefined || projected < minA) {
                    minA = projected;
                }
                if (maxA === undefined || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (minB === undefined || projected < minB) {
                    minB = projected;
                }
                if (maxB === undefined || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
};

function controller($scope, $timeout) {
    $scope.units_in_pixels = 70; // 1 meter is 50 pixels
    $scope.hide = false;
    $scope.tinyunits = 7;
    $scope.ratings = [];
    for (var rating = 0; rating < 1.0; rating += 0.03) {
        $scope.ratings.push(rating);
    }
    $scope.room = {
        width: 3.9116,
        height: 5.0292,
        rotation: 0,
    };
    $scope.elements = [
        {
            label: "wooddesk",
            width: 1.4986, height: 0.74295,
            x: 0.8, y: 0.6, rotation: 0,
            edges: {left: 0.05, right: 0.05, bottom: 0.05, top: 0.05}
        },
        {
            label: "couch",
            width: 1.8542, height: 0.8636,
            x: 1.8, y: 1.5, rotation: 0,
            edges: {left: 0.1778, bottom: 0.3048, right: 0.1778}
        },
        {
            width: 1.1176, height: 0.9144,
            x: 3, y: 3,
            rotation: 0,
            label: "chair",
            edges: {
                left: 0.2794,
                right: 0.2794,
                bottom: 0.4318 
            }
        }, {
            width: 2.1336, height: 2.1336,
            x: 1.5, y: 3.3,
            rotation: 0,
            circular: true,
            d: "beanbag"
        }
    ];
    $scope.room.features = [
        {
            height: 0.2921, width: 0.762,
            label: "bookshelf",
            rotation: 0,
            collide: true,
            x: $scope.room.width - 1.4478,
            y: $scope.room.height - 0.14685
        },
        {
            height: 0.2921, width: 0.762,
            rotation: 0,
            label: "bookshelf",
            x: 0.4826,
            collide: true,
            y: $scope.room.height - 0.14685
        },
        {
            label: "glassdesk",
            rotation: 0,
            height: 0.635, width: 1.0922,
            y: $scope.room.height - 0.3175,
            collide: true,
            x: 1.4732
        },
        {
            width: 2.3876,
            height: 0.0762,
            x: -0.0381,
            y: 1.8034,
            rotation: 90,
            label: "window"
        },
        {
            width: 0.9398,
            height: 0.07,
            x: 0,
            y: 4.2418,
            rotation: 90,
            label: "door"
            // front door
        },
        {
            width: 0.9398,
            height: 0.07,
            y: $scope.room.height,
            x: $scope.room.width - 0.4699,
            rotation: 0,
            label: "door"
            // other door
        },
        {
            width: 0.0762,
            height: 0.0381,
            y: 0.2921,
            x: 0,
            rotation: 90,
            label: "outlet"
        },
        {
            width: 0.0762,
            height: 0.0381,
            y: 2.921,
            x: 0,
            rotation: 90,
            label: "outlet"
        },
        {
            width: 0.0762,
            height: 0.0381,
            y: 3.5814,
            x: $scope.room.width,
            rotation: -90,
            label: "outlet"
        },
        {
            width: 2.6416,
            height: 0.0762 * 3,
            y: 1.3208,
            x: $scope.room.width + 0.0381,
            rotation: -90,
            label: "opening"
            // room opening
        },
        {
            width: 0.635,
            height: 0.0381,
            x: 0.4572,
            y: 0,
            rotation: 0,
            label: "vent"
        },
        {
            width: 1.905,
            height: 0.1651,
            x: 2.1844,
            y: 0.0825,
            rotation: 0,
            collide: true,
            label: "fp",
            d: "fireplace",
        },
        {
            height: 0.1778, width: 0.9398,
            rotation: 0,
            x: 2.1844,
            y: 0.2159,
            collide: true,
            label: "fpg",
            d: "fireplace grill",
        },
    ]
    $scope.randswap = function() {
        var next = {
            rate: function() {$scope.rate($scope.best.rating+0.001)},
            elements: $scope.elements
        };
        var best = {
            rate: function() {$scope.rate($scope.best.rating-0.001)},
            elements: $scope.best.elements
        };
        if (Math.random() > 0.5) {
            $scope.one = next;
            $scope.two = best;
        } else {
            $scope.one = best;
            $scope.two = next;
        }
    };
    $scope.room.x = $scope.room.width / 2;
    $scope.room.y = $scope.room.height / 2;
    $scope.reverse = function(derp) {
        var result = [];
        for (var x = 0; x < derp.length; x++)  {
            result.push(derp[derp.length - (1+x)]);
        }
        return result;
    };
    $scope.sintemp = function() { return (Math.sin($scope.temperature * 32)/5 + 1) * $scope.temperature };
    $scope.nextstep = function() {
        var newelements = changeall($scope.sintemp(), $scope.elements, $scope.room);
        var possible = physicallypossible($scope.room, newelements);
        var bail = 0;
        while (!possible && bail < 5000) {
            if (debug >= 0) console.log("physically possible:", possible);
            newelements = changeall($scope.sintemp(), $scope.elements, $scope.room);
            possible = physicallypossible($scope.room, newelements);
            bail += 1;
        }
        if (bail >= 5000) {
            if (debug >= 0) console.log("aborted due to bailing! D:");
        }
        if (possible) {
            if (debug >= 0) console.log("found one!", bail);
        }
        $scope.elements = newelements;
        $scope.temperature *= 0.999;
    };
    $scope.current_untested  = $scope.elements;
    $scope.ratinghistory = [];
    $scope.maxhistory = [];
    $scope.best = {rating: 0, elements: $scope.elements};
    //$scope.temperature = 50;
    //$scope.nextstep();
    if (debug >= 1) console.log("init physically possible:", physicallypossible($scope.room, $scope.elements));
    $scope.randswap();
    $scope.temperature = 0.75;
    $scope.view = function(historyitem) {
        $scope.elements = historyitem.elements;
    }
    $scope.dump = function() {
        return JSON.stringify({
            elements: $scope.elements,
            ratinghistory: $scope.ratinghistory,
            maxhistory: $scope.maxhistory,
            room: $scope.room
        });
    }
    $scope.rate = function(rating) {
        var rated = {
            rating: rating,
            elements: angular.copy($scope.elements)
        };
        $scope.ratinghistory.push(rated);
        if (rating > $scope.best.rating) {
            $scope.maxhistory.push(rated);
            $scope.best = rated;
        } else {
            $scope.elements = $scope.best.elements;
        }
        $scope.nextstep();
        $scope.hide = true;
        $timeout(function(){
            $scope.hide = false;
        }, 250);
        $scope.randswap();
    };
}

angular.module("derp", [])
    .directive("room", function() {
        return {
            restrict: "E",
            templateUrl: "room.html",
            replace: true,
            scope: {
                room: "=",
                elements: "=",
                units: "="
            },
            link: function($scope, $element, $attrs) {
                function to_px(size) {
                    return size * $scope.units;
                }
                $scope.to_px = to_px;
                $scope.css = function(object) {
                    var thing = {
                        '-webkit-transform':
                            'translate(-' + (to_px(object.width)/2) + 'px,-' + (to_px(object.height)/2) + 'px)' +
                            ' rotate(' + object.rotation + 'deg)',
                        'width': '' + to_px(object.width) + 'px',
                        'height': '' + to_px(object.height) + 'px',    
                        'top': '' + to_px(object.y) + 'px',
                        'left': '' + to_px(object.x) + 'px',
                        'font-size': '' + to_px(.2) + 'px'
                    };
                    if (angular.isDefined(object.features)) {
                        thing["margin"] = '' +to_px(.7) +'px';
                    }
                    if (object.edges !== undefined) {
                        angular.forEach(object.edges, function(value, name) {
                            thing["border-" + name + "-width"] = "" + to_px(value) + "px";
                        });
                    }
                    if (object.circular) {
                        thing["border-radius"] = "50%";
                    }
                    return thing;
                }
            }
        }
    })
    .filter('reverse', function() {
        return function(items) {
            if (!angular.isArray(items)) return;
            return items.slice().reverse();
        };
    });
