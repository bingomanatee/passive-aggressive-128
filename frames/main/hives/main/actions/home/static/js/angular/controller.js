(function(window){

    function paHomeCtrl($scope){
        $scope.foo = bar;

        $scope.locations=[{
            name: 'San Francisco, CA',
            zip: 94103
        }]
    }

    angular.module('paApp').controller('paHomeCtrl', paHomeCtrl);
})(window);