(function (window) {

    function paEventsCtrl($scope, Locations, EventTypes, Events, $window) {
        $scope.zip = $window._pa_search_query.zip;
        $scope.category = $window._pa_search_query.category;

        $scope.locations = Locations.query();

        $scope.$watch('locations', function (locations) {
            $scope.location = _.find(locations, function (l) {
                return l.zip == $scope.zip;
            })
        }, true);

        $scope.location = null;

        $scope.event_types = EventTypes.query();

        $scope.search_term = {};

        $scope.events = Events.query($window._pa_search_query);

        $scope.$watch('event_types', function (event_types) {
            $scope.event_type = _.find(event_types, function (et) {
                return et.id == $scope.category;
            })
        }, true);

        $scope.place_label = function(){
            return $scope.location ? $scope.location.name : $scope.zip;
        }

        $scope.category_label = function(){
            return $scope.event_type ? $scope.event_type.label : $scope.category;
        }

        $scope.expand_event = function(event){
            event.expand = !event.expand;
            Events.get(event.id, function(event_data){
                _.extend(event, event_data);
            })
        }

        $scope.event_text = function(event){
            return _.compact([event.description, event.summary, ' -- no description available --'])[0];
        };

        $scope.close_event = function(event){
            event.expand = false;
        }

    }

    angular.module('paApp').controller('paEventsCtrl', paEventsCtrl);
})(window);