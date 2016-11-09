angular.module('proxtop').controller('ProfileController', ['$scope', 'ipcManager', '$state', 'ProgressService', 'shell', function($scope, ipcManager, $state, progressService, shell) {
    const ipc = ipcManager($scope);
    ipc.once('profile', (ev, profile) => {
        $scope.profile = profile;
        $scope.profile.progress = progressService.getProgressToNextRank($scope.profile.ranking.total);
    });

    ipc.once('news', (ev, news) => {
        $scope.news = news;
    });

    $scope.openNews = function(newsItem) {
        shell.openExternal('https://proxer.me/forum/' + newsItem.catid + '/' + newsItem.mid);
    };

    $scope.createNewsImage = function(newsItem) {
        return 'https://cdn.proxer.me/news/' + newsItem.nid + "_" + newsItem.image_id + '.png';
    };

    ipc.send('profile');
    ipc.send('news');
}]);
