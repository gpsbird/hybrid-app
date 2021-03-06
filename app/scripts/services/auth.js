'use strict';

angular.module('Simpleweek.services', [])

  .service('AuthService', function ($http, $rootScope, $q, $localStorage, $moment, ENV, Restangular) {

    var auth = {
      // the user currently logged in
      currentUser: {},

      /**
       * Initialize current user information from local storage
       */
      init: function () {
        var self = this;
        // setting currentUser
        self.currentUser = $localStorage.appUser || {};
      },

      /**
       * Whether or not current user is logged in
       *
       * @returns {boolean}
       */
      isLoggedIn: function () {
        return this.currentUser.access_token ? this.currentUser.access_token.length > 0 : false;
      },

      /**
       * Load user's config
       */
      loadUserConfig: function (token) {
        var self = this;
        var url = ENV.api.baseUrl + '/api/users/me?access_token=' + token;
        $http.get(url)
          .success(function (configResponse) {
            self.currentUser.config = configResponse;
            self.updateUser(self.currentUser, {set: true});

            $moment.tz(configResponse.timezone.timezone_sysname);
          })
          .error(function () {
            console.log('Config loading error');
          });
      },

      /**
       * Login user
       *
       * @param userData
       * @returns promise
       */
      login: function (userData) {
        var self = this;
        var deferred = $q.defer();

        var success = function (response) {
          userData.access_token = response.access_token;
          userData.password = '';

          Restangular.configuration.defaultRequestParams.common.access_token = userData.access_token;

          self.updateUser(userData, {set: true});
          self.loadUserConfig(userData.access_token);

          deferred.resolve(self.currentUser);
        };

        var error = function (error, status) {
          deferred.reject({error: error, code: status});
        };

        var url = ENV.api.baseUrl + '/oauth/v2/token?client_id=' + ENV.api['client.id'] + '&client_secret=' + ENV.api['client.secret'] + '&grant_type=password&username=' + userData.username + '&password=' + userData.password;
        $http.get(url, {user: userData}).success(success).error(error);

        return deferred.promise;
      },

      /**
       * Update information of current user
       *
       * @param user
       * @param options
       */
      updateUser: function (user, options) {
        var self = this;
        var opts = {remove: false, set: false};

        angular.extend(opts, options);
        if (null === user) {
          self.currentUser = {};
        } else {
          angular.extend(self.currentUser, user);
        }

        if (opts.remove === true) {
          delete $localStorage.appUser;
        }

        if (opts.set === true) {
          $localStorage.appUser = self.currentUser;
        }
      },

      /**
       * Register an user
       * @param
       */
      register: function (userData) {
        var deferred = $q.defer();

        var success = function (response) {
          deferred.resolve(response);
        };

        var error = function (error) {
          deferred.reject(error);
        };

        var postData = {
          'todo_user_registration': {
            'email': userData.email,
            'username': userData.username,
            'plainPassword': userData.password
          }
        };

        $http.post(ENV.api.baseUrl + '/api/users.json', postData).success(success).error(error);

        return deferred.promise;
      }
    };

    return auth;

  });
