
angular.module('xyApp', ['xyScroll']);
angular.module('xyApp').controller('xyCtrl', function($scope) {
  var _this = this;
  this.isWorks = true
  this.x = 0;
  this.y = 0;
  this.status = 'it works!';
  this.fields = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
  this.stuff = mockData();

  function mockData() {
    var data = [];
    for (var i = 0; i < 20; ++i) {
      var item = {
        name: 'Item ' + i
      };
      for (var j = 0; j < _this.fields.length; ++j) {
        item[j] = 'column ' + _this.fields[j] + i;
      }
      data.push(item);
    }
    return data;
  }
});