(function(window){

    function paHomeCtrl($scope, Locations, EventTypes){
        $scope.foo = 'bar';

        $scope.locations = Locations.query();

        $scope.location = null;

        $scope.event_types = EventTypes.query();

        $scope.event_type = null;

        $scope.show_loc_button = function(loc){
            return (!$scope.location) || $scope.location.zip == loc.zip;
        }

        $scope.set_loc = function(loc){
            $scope.location = loc;
        }
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);