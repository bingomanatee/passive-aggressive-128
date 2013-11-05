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

            var q = {id: event.id, zip: _pa_search_query.zip};

            if ($window._pa_search_query.mock){
                q.mock = $window._pa_search_query.mock;
            }
            Events.get(q, function(event_data){
                _.extend(event, event_data);
                event.group_times = _.values($scope.group_times(event.times));
            })
        }

        $scope.MAX_GROUP_TIMES = 8;

        $scope.show_playtime_button = function(time, event){
            console.log('event: ', event.title, 'gt:', event.group_times ? event.group_times.length : 0);
            return (!event.group_times) || (event.group_times.length > $scope.MAX_GROUP_TIMES);
        }

        $scope.event_text = function(event){
            return _.compact([event.description, event.summary, ' -- no description available --'])[0];
        };

        $scope.close_event = function(event){
            event.expand = false;
        };

        $scope.show_all_playtimes = function(event){
            _.each(event.times, function(time){
                time.show_time = true;
            });
        };

        $scope.show_event_time = function(time, event){
            return (event.group_times.length <= $scope.MAX_GROUP_TIMES) || time.show_time;
        }

        $scope.toggle_show_playtime = function(time){
            time.show_time = !!!time.show_time;
        }

        $scope.group_times = function(times){

            var groups = _.groupBy(times, 'venue_id');

            var now = new Date();

            _.each(groups, function(time, venue_id){
                var data = time[0];
                data.starts = _.reduce(time, function(out, t){
                    // only returning todays times.
                    var start = new Date(t.start_time);
                    if (start.getDate() <= (now.getDate() + 2) && start.getMonth() == now.getMonth()){
                        out.push(start);
                    }
                    return out;
                }, []);

                groups[venue_id] = data;

            });

            return groups;
        }

    }

    angular.module('paApp').controller('paEventsCtrl', paEventsCtrl);
})(window);