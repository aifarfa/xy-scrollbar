angular.module('xyScroll', []);
angular.module('xyScroll').directive('xyScroll', ['$log', '$document', '$timeout', function($log, $document, $timeout) {
    return {
        scope: {
            x: '=?',
            y: '=?',
            dragX: '=?',
            dragY: '=?'
        },
        template: '<div class="xy-outer"><div class="xy-inner" ng-transclude></div>' + '<div class="xy-scroll xy-scroll-x"><div class="xy-bar xy-bar-x" ng-style="scrollX" ng-mousedown="beginDragX($event)"></div></div>' + '<div class="xy-scroll xy-scroll-y"><div class="xy-bar xy-bar-y" ng-style="scrollY" ng-mousedown="beginDragY($event)"></div></div></div>',
        transclude: true,
        link: function(scope, element, attrs) {
            // ...
            var startX = 0,
                startY = 0,
                x = 0,
                y = 0;

            var accelerationTimer = null,
                accelerationDelay = null,
                speed = 0.5;

            var content = element.find('.xy-content'),
                header = element.find('.xy-header-left'),
                top = element.find('.xy-header-top'),
                child = content.children();

            scope.scrollX = {
                left: 0,
                width: 100,
                opacity: 1
            };

            scope.scrollY = {
                top: 0,
                height: 30,
                opacity: 1
            };

            $timeout(function() {
                setup();
                resize();
            }, 1);

            function setup() {
                //config.dragHorizontal = scope.dragX; // attrs['dragX'];
                //config.dragVertical = scope.dragY; // attrs['dragY'];
                child.on('mousewheel', mousewheel);

                if (scope.dragX || scope.dragY) {
                    content.on('mousedown', mousedown);
                }
                content.on('mouseover', mouseover);
                content.on('mouseout', mouseout);
                content.on('touchstart', touchstart); //touch test
            }

            function mousewheel(event) {
                event.preventDefault();
                // support non-webkit browsers
                if (event.originalEvent != undefined) {
                    event = event.originalEvent;
                }
                var delta = event.wheelDeltaY || event.wheelDelta;
                delta = Math.floor(delta * accelerate());
                // shift or cmd(Mac) is pressed?
                if (event.shiftKey || event.metaKey) {
                    moveX(-delta);
                } else {
                    moveY(-delta);
                }
                update();
            }

            scope.beginDragX = function(event) {
                event.preventDefault();
                startX = event.pageX;
                $document.on('mousemove', dragX);
                $document.one('mouseup', endDragX);
            }

            scope.beginDragY = function(e) {
                e.preventDefault();
                startY = e.pageY;
                $document.on('mousemove', dragY);
                $document.one('mouseup', endDragY);
            }

            function dragX(event) {
                event.preventDefault();

                var delta = event.pageX - startX;
                startX += delta;
                moveX(delta);
                update();
            }

            function endDragX(e) {
                $document.off('mousemove', dragX);
                $document.off('mouseup', endDragX);
            }

            function dragY(event) {
                event.preventDefault();

                var delta = event.pageY - startY;
                startY += delta;
                moveY(delta);
                update();
            }

            function endDragY(e) {
                $document.off('mousemove', dragY);
                $document.off('mouseup', endDragY);
            }

            function mousedown(event) {
                // Prevent default dragging of selected content
                event.preventDefault();
                startX = event.pageX - x;
                startY = event.pageY - y;
                $document.on('mousemove', mousemove);
                $document.one('mouseup', mouseup);
            }

            function mousemove(event) {
                event.preventDefault();
                if (scope.dragX) {
                    x = limitX(event.pageX - startX);
                    scrollX();
                }
                if (scope.dragY) {
                    y = limitY(event.pageY - startY);
                    scrollY();
                }
                update();
            }

            function mouseup() {
                $document.off('mousemove', mousemove);
                $document.off('mouseup', mouseup);
            }

            function mouseover(event) {
                scope.scrollX.opacity = 1;
                scope.scrollY.opacity = 1;
                update();
            }

            function mouseout(event) {
                scope.scrollX.opacity = 0.3;
                scope.scrollY.opacity = 0.3;
                update();
            }

            function touchstart(event) {
                var touch = getTouchEvent(event);
                $log.log('touchstart', touch);
                startX = touch.pageX - x;
                startY = touch.pageY - y;
                $document.on('touchmove', touchmove);
                $document.on('touchend', touchend);
            }

            function touchmove(event) {
                event.preventDefault();
                var touch = getTouchEvent(event);
                x = limitX(touch.pageX - startX);
                y = limitY(touch.pageY - startY);
                scrollY();
                scrollX();
                update();
            }

            function touchend(event) {
                $document.off('touchmove', touchmove);
                $document.off('touchend', touchend);
                $log.log('touchend.');
            }

            function getTouchEvent(event) {
                if (event.originalEvent != undefined) {
                    event = event.originalEvent;
                }
                if (!event.touches) {
                    return;
                }
                return event.touches[0]; //single touch
            }

            function moveX(distance) {
                x = limitX(x - distance);
                scrollX();
            }

            function moveY(distance) {
                y = limitY(y - distance);
                scrollY();
            }

            function scrollX() {
                var pos = {
                    left: x + 'px'
                };
                top.css(pos);
                content.css(pos);
            }

            function scrollY() {
                var yOffset = y + getTopOffset(); //left header
                header.css({
                    top: yOffset + 'px'
                });
                content.css({
                    top: y + 'px'
                });
            }

            function limitX(value) {
                //value is negative
                var limit = maxX();
                return Math.min(0, Math.max(-limit, value));
            }

            function limitY(value) {
                var limit = maxY();
                return Math.min(0, Math.max(-limit, value));
            }

            function maxX() {
                var limit = actualWidth() - content.width();
                return limit;
            }

            function maxY() {
                var viewHeight = element.height();
                var height = actualHeight();
                return height - viewHeight;
            }

            function actualHeight() {
                return top.height() + content.height();
            }

            function actualWidth() {
                return content.children().width();
            }

            function getTopOffset() {
                return top.height();
            }

            function resize() {
                scope.scrollX.width = getScrollWidth();
                scope.scrollY.height = getScrollHeight();
                update();
            }

            function getBarPositionX() {
                var viewWidth = content.width();
                var barSize = getScrollWidth();
                var max = viewWidth - barSize;
                var xMax = maxX();
                var ratio = -x / xMax;
                return Math.floor(ratio * max);
            }

            function getBarPositionY() {
                var height = element.height();
                var barSize = getScrollHeight();
                var offset = getTopOffset();
                var max = height - barSize - offset;
                var yMax = maxY();
                var ratio = -y / yMax;
                return Math.floor(ratio * max);
            }

            function getScrollWidth() {
                var w = content.width();
                var len = actualWidth();

                return w * w / len;
            }

            function getScrollHeight() {
                var h = element.height() - top.height();
                var len = actualHeight();
                return h * h / len;
            }

            function update() {
                scope.x = x;
                scope.y = y;
                scope.scrollX.left = getBarPositionX();
                scope.scrollY.top = getBarPositionY();
                scope.$apply();
            }

            /** acceleration effect on mouse wheel */
            function accelerate() {
                if (accelerationTimer) {
                    //keep moving state
                    $timeout.cancel(accelerationTimer);
                    if (accelerationDelay) {
                        //keep acceleration
                        $timeout.cancel(accelerationDelay);
                    }
                    accelerationDelay = $timeout(function() {
                        speed += 0.1; //increase speed every 0.2s
                    }, 200);
                }
                accelerationTimer = $timeout(function() {
                    speed = 0.5;
                }, 400);

                return Math.min(speed, 1);
            }

        }
    };
}]);
