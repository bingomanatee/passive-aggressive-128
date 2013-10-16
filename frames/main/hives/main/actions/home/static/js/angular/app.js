(function(){


    angular.module('locationsService', ['ngResource']).factory('Locations',
        function ($resource) {
            return $resource('/rest/locations', {}, {
                query: {method: 'GET', isArray: true}
            });
        });

    angular.module('paApp', ['locationsService']);

})();