(function(window){

    function paEventsCtrl($scope, Locations, EventTypes, $window){
        $scope.zip = $window._pa_search_query.zip;
        $scope.category = $window._pa_search_query.category;

        $scope.locations = Locations.query();

        $scope.location = null;

        $scope.event_types = EventTypes.query();

    }

    angular.module('paApp').controller('paEventsCtrl', paEventsCtrl);
})(window);