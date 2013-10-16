(function(){

    angular.module('paApp', []);


    angular.module('locationsService', ['ngResource']).factory('Locations',
        function ($resource) {
            return $resource('/rest/locations', {}, {
                query: {method: 'GET', isArray: true}
            });
        });

})();