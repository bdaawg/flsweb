export default class NavigationBarDirective {
    static factory() {
        return {
            restrict: 'E',
            template: require('./navigation-bar-directive.html'),
            controller: NavigationBarController
        };
    }
}

class NavigationBarController {

    constructor($rootScope, $scope, $location, AuthService, GLOBALS) {
        $rootScope.$on('$routeChangeError',
            function (/*event, current, previous, rejection*/) {
                $location.path('/main');
            });

        $scope.getEnabledFeatures = AuthService.getEnabledFeatures;
        $scope.baseurl = GLOBALS.BASE_URL;
        $scope.user = {};

        function extractUsername() {
            var user = AuthService.getUser();
            $scope.user = {
                username: user && user.UserName
            };
        }

        $scope.$watch(AuthService.getUser(), () => {
            extractUsername();
        }, true);

        $scope.isPath = function (path) {
            return $location.path().indexOf(path) !== -1;
        };

        $scope.login = function () {
            $scope.loginBusy = true;
            $scope.loginError = undefined;
            AuthService.login($scope.user.username, $scope.user.password)
                .then(() => {
                    $location.path('/dashboard');
                })
                .catch((reason) => {
                    console.log(JSON.stringify(reason));
                    $scope.loginError = reason.data;
                    $scope.user = {};
                })
                .finally(() => {
                    $scope.loginBusy = false;
                });
        };

        $scope.logout = function () {
            $scope.loginBusy = false;
            AuthService.logout();
            $location.path('/');
        };

        $scope.isLoggedin = function () {
            return !!AuthService.getUser();
        };

        $scope.showLoginForm = function () {
            AuthService.promptLogin();
        };

        $scope.hideLoginForm = function () {
            AuthService.hideLogin();
        };
        $scope.isLoginFormVisible = function () {
            return AuthService.isLoginFormVisible();
        };
        $scope.lostPassword = () => {
            $scope.hideLoginForm();
            $location.path('/lostpassword');
        };

    }
}