// Code goes here

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
    }
    return e;
}

// window is 2.3876 meters tall
// window center is 1.8034


// vent begins 0.45720 meters left, 0.635 meters wide

// fireplace begins 1.2192 meters left, top 0
// fireplace is 1.905meters wide
// fireplace is 0.1651 meters deep

// other door is 0.91440 meters
// starts left 0.2032 meters of fireplace is an outlet
// starts top 0.254 meters outlet
// outlets are 0.0762 meters wide
// outlet starts 2.0320 meters from bottom
// outlet starts 0.83820 meters top from room opening

var outlet_template = {
    width: 0.0762,
    height: 0.0381,
    
}


    

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
            // beanbag
        }
    ];
    $scope.room.features = [
        {
            height: 0.2921, width: 0.762,
            label: "bookshelf",
            rotation: 0,
            x: $scope.room.width - 1.4478,
            y: $scope.room.height - 0.14685
        },
        {
            height: 0.2921, width: 0.762,
            rotation: 0,
            label: "bookshelf",
            x: 0.4826,
            y: $scope.room.height - 0.14685
        },
        {
            label: "glassdesk",
            rotation: 0,
            height: 0.635, width: 1.0922,
            y: $scope.room.height - 0.3175,
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
            label: "fp"
        },
        {
            height: 0.1778, width: 0.9398,
            rotation: 0,
            x: 2.1844,
            y: 0.2159,
            label: "fpg"
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
        $scope.elements = changeall($scope.sintemp(), $scope.elements, $scope.room);
        $scope.temperature *= 0.999;
    };
    $scope.current_untested  = $scope.elements;
    $scope.ratinghistory = [];
    $scope.maxhistory = [];
    $scope.best = {rating: 0, elements: $scope.elements};
    //$scope.temperature = 50;
    //$scope.nextstep();
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