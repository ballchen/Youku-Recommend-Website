var app = angular.module('IRapp', [
    "ngSanitize",
    "com.2fdevs.videogular",
    "com.2fdevs.videogular.plugins.controls",
    "com.2fdevs.videogular.plugins.overlayplay",
    "com.2fdevs.videogular.plugins.poster",
    "ngAnimate"
])

app.controller('indexCtrl', ['$scope', '$http', '$sce', '$timeout', function($scope, $http, $sce, $timeout) {

    var controller = this;
    $scope.host = 'localhost'
    $scope.searching = 1;
    $scope.videoshow = false;
    $scope.waiting = false;
    $scope.select = null;

    $scope.$watch('search', function() {
        if ($scope.search) {
            $scope.searching = 0;
            if ($scope.search == 'EN') {
                controller.API.stop();
                controller.config.sources = [{
                    src: $sce.trustAsResourceUrl('http://61.142.132.132/youku/656F90C7674E82CADDD125C4C/0300200100521B11A195F6023DB15569B7C6B6-6882-F9AF-0E49-A61038DAD0B3.mp4'),
                    type: "video/mp4"
                }];
                controller.API.play();
                $scope.videoshow = true;
            } else {
                $http({
                    method: "GET",
                    url: "https://openapi.youku.com/v2/searches/show/by_keyword.json?client_id=fd01cd845c0ec773&count=4&keyword=" + $scope.search
                }).success(function(data) {
                    $scope.search_result = data.shows
                })
            }

        } else {
            $scope.searching = 1;
        }

    });

    $scope.start = function(info) {
        console.log(info)
        $scope.select = info;

        $scope.searching = 1;
        $scope.waiting = true;



        var show = 'https://openapi.youku.com/v2/shows/videos.json?client_id=fd01cd845c0ec773&show_videotype=%E9%A2%84%E5%91%8A%E7%89%87&show_id=' + info.id
        $http({
            method: "GET",
            url: show,
        }).success(function(data) {
            console.log('show')

            if (data.total > 0) {
                console.log('>0')
                    // console.log(data.videos[0].id)

                // get video
                $http.get('http://' + $scope.host + ':8083/raw?id=' + data.videos[0].id).success(function(data1) {
                    console.log(data1);


                    $scope.showvideo = data1 + '&.mp4';

                    controller.API.stop();
                    controller.config.sources = [{
                        src: $sce.trustAsResourceUrl(data1 + '&.mp4'),
                        type: "video/mp4"
                    }];
                    controller.API.play();
                    $scope.videoshow = true;
                    // console.log($scope.showvideo)
                })
                console.log(info.id)
                console.log(info.name)
                    //send data to python django api
                $http({
                    method: "POST",
                    url: "http://" + $scope.host + ":8000/test/",
                    data: {
                        show_id: info.id,
                        show_name: info.name
                    }
                }).success(function(data) {

                    // 這邊是拿回四比資料名字後的處理
                    console.log(data);
                    // var predict = ['武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版'];
                    $scope.predict = data.result
                    console.log($scope.predict)
                    $scope.predictinfo = []

                    var findbykeyword = "https://openapi.youku.com/v2/searches/show/by_keyword.json?client_id=fd01cd845c0ec773&count=4&keyword="
                    for (var i = 0; i < 4; i++) {
                        $http.get(findbykeyword + $scope.predict[i]).success(function(data) {
                            console.log(data)
                            if (data.total > 0) {
                                $scope.predictinfo.push(data.shows[0]);
                            }
                        })
                    }

                })
            } else {
                console.log('else')
                $http({
                    method: "POST",
                    url: "http://" + $scope.host + ":8000/test/",
                    data: {
                        show_id: info.id,
                        show_name: info.name
                    }
                }).success(function(data) {

                    // 這邊是拿回四比資料名字後的處理
                    // var predict = ['武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版', '武媚娘传奇 湖南卫视TV版'];
                    $scope.predict = data.result
                    console.log($scope.predict)
                    $scope.predictinfo = []

                    var findbykeyword = "https://openapi.youku.com/v2/searches/show/by_keyword.json?client_id=fd01cd845c0ec773&count=4&keyword="
                    for (var i = 0; i < 4; i++) {
                        $http.get(findbykeyword + $scope.predict[i]).success(function(data) {
                            console.log(data)
                            if (data.total > 0) {
                                $scope.predictinfo.push(data.shows[0]);
                            }
                        })
                    }

                })
            }
        })
    }


    controller.API = null;
    controller.config = {
        sources: [{
            src: $sce.trustAsResourceUrl('http://110.80.131.19/youku/69732A488C933810E6E34E4063/03002001005452A2E817311462D1014D12F489-A817-4D60-5DBF-97FE09459D19.mp4'),
            type: "video/mp4"
        }],

        theme: "bower_components/videogular-themes-default/videogular.css"
    };
    controller.onPlayerReady = function(API) {
        // console.log(API)
        controller.API = API;
    };

    controller.onCompleteVideo = function(API) {
        $scope.videoshow = false;
        $scope.searching = 2;
    }

    $scope.endVideo = function() {
        controller.API.stop();
        $scope.videoshow = false;
        $scope.searching = 2;
    }
    $scope.$watch('predict', function() {
        if ($scope.predict) {

            $timeout(function() {
                alertify.success('搜尋結束囉:)')
                $scope.searching = 2;
            }, 2000)

        }
    })
    $scope.searchAgain = function() {
        $scope.waiting = false;
        $scope.search = '';
        $scope.searching = 1;
    }

    $scope.showresultVideo = function(info) {

        console.log(show)
        var show = 'https://openapi.youku.com/v2/shows/videos.json?client_id=fd01cd845c0ec773&count=10&show_id=' + info.id
        $http({
            method: "GET",
            url: show,
        }).success(function(data) {
            console.log(data)
            if (data.total > 0) {
                console.log(data.videos[0].id)

                // get video
                $http.get('http://' + $scope.host + ':8083/raw?id=' + data.videos[0].id).success(function(data1) {
                    if (data !== 'Error') {
                        console.log(data1);


                        $scope.showvideo = data1 + '&.mp4';

                        controller.API.stop();
                        controller.config.sources = [{
                            src: $sce.trustAsResourceUrl(data1 + '&.mp4'),
                            type: "video/mp4"
                        }];
                        controller.API.play();
                        $scope.videoshow = true;
                        console.log($scope.showvideo)
                    } else {
                        alertify.alert('此影片找不到預告片')
                    }

                })
            } else {
                alertify.alert('此影片找不到預告片')
            }
        })

    }


}])