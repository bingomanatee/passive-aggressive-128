(function(window){

    function paHomeCtrl($scope, Locations, EventTypes){
        $scope.foo = 'bar';

        $scope.locations = Locations.query();

        $scope.location = null;

        $scope.event_types = EventTypes.query();

        $scope.event_type = null;
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);