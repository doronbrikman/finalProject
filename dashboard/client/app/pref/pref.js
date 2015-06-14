angular.module('app')
  .config(['$stateProvider', function ($stateProvider) {
    'use strict';

    $stateProvider.state('pref', {
      url: '/pref',
      templateUrl: 'app/pref/pref.html',
      controller: 'PrefController'
    });
  }]);
