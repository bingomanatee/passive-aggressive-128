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
        };

        $scope.all_loc = function(){
            $scope.location = null;
        };

        $scope.event_buttons = [];

        function refresh_ebs(){
            if ($scope.location
                && $scope.event_types && $scope.event_types.length){
                $scope.event_buttons = _.map($scope.event_types, function(et){
                    return {
                        location: $scope.location,
                        event_type: et
                    }
                })
            }
        }

        $scope.$watch('location', function(loc){
            refresh_ebs()
        })
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);