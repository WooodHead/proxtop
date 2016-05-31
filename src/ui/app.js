angular.module('proxtop', ['ngMaterial', 'ngSanitize', 'ui.router', 'angular-progress-arc', 'pascalprecht.translate', 'debounce'])
    .config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$mdIconProvider', '$logProvider', function($stateProvider, $urlRouterProvider, $translateProvider, $mdIconProvider, $logProvider) {
        $urlRouterProvider.otherwise('/');
        $translateProvider.useStaticFilesLoader({
            prefix: 'locale/locale-',
            suffix: '.json'
        });

        $translateProvider.preferredLanguage('de');
        $translateProvider.useSanitizeValueStrategy('escape');

        $mdIconProvider.defaultIconSet('../bower_components/font-awesome/fonts/fontawesome-webfont.svg');

        $logProvider.debugEnabled(true);
    }]);
