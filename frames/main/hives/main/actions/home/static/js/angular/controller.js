(function(window){

    function paHomeCtrl($scope, Locations){
        $scope.foo = 'bar';

        $scope.locations = Locations.query();
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);