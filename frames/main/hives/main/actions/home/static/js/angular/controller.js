(function(window){

    function paHomeCtrl($scope, Locations){
        $scope.foo = 'bar';

        $scope.locations = Locations.query();

        $scope.location = null;

        $scope.event_types = Event_Types.query();

        $scope.event_type = null;
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);