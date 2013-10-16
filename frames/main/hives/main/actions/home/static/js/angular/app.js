(function(){


    angular.module('locationsService', ['ngResource']).factory('Locations',
        function ($resource) {
            return $resource('/rest/locations', {}, {
                query: {method: 'GET', isArray: true}
            });
        });

    angular.module('eventTypesService', ['ngResource']).factory('EventTypes',
        function ($resource) {
            return $resource('/rest/event_types', {}, {
                query: {method: 'GET', isArray: true}
            });
        });

    angular.module('paApp', ['locationsService', 'eventTypesService']);

})();