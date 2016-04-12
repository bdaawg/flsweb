import * as $ from 'jquery';

export default class AuthService {
    constructor($http, $location, $window, GLOBALS, $sessionStorage) {
        var storage = $sessionStorage.$default({loginResult: {}});

        function confirmationLink() {
            return $window.location.origin + $window.location.pathname + "/#/confirm?userid={userid}&code={code}";
        }

        var srv = {
            isClubAdmin: function () {
                return srv.hasRole("ClubAdministrator");
            },
            isSystemAdmin: function () {
                return srv.hasRole("SystemAdministrator");
            },
            getEnabledFeatures: function () {
                return {
                    planning: true,
                    reservations: true,
                    flights: true,
                    masterdata: srv.isClubAdmin(),
                    system: srv.isSystemAdmin()
                }
            },
            promptLogin: function (requestedRoute) {
                srv.loginformvisible = true;
                srv.requestedRoute = requestedRoute;
            },
            hideLogin: function () {
                srv.loginformvisible = false;
            },
            isLoginFormVisible: function () {
                return srv.loginformvisible;
            },
            login: function (username, password) {
                return $http({
                    method: 'POST',
                    url: GLOBALS.BASE_URL + '/Token',
                    data: $.param({'username': username, 'Password': password, 'grant_type': 'password'}),
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                })
                    .then((loginResponse) => {
                        storage.loginResult = loginResponse.data;
                    })
                    .then(setAuthorisationHeader)
                    .then(() => {
                        return $http({
                            method: 'GET',
                            url: GLOBALS.BASE_URL + '/api/v1/users/my'
                        });
                    })
                    .then((userResponse) => {
                        storage.user = userResponse.data;
                    })
                    .then(() => {
                        return $http({
                            method: 'GET',
                            url: GLOBALS.BASE_URL + '/api/v1/userroles',
                            array: true
                        });
                    })
                    .then((userRolesResponse) => {
                        storage.userRoles = userRolesResponse.data;
                    })
                    .then(() => {
                        if (srv.requestedRoute) {
                            $location.path(srv.requestedRoute);
                        }
                    });
            },
            logout: function () {
                delete $sessionStorage.loginResult;
                delete $sessionStorage.user;
                delete $sessionStorage.userRoles;
                $location.path('/main');
            },
            getToken: function () {
                var loginResult = storage.loginResult;
                /* jshint camelcase: false */
                return loginResult && loginResult['access_token'];
            },
            getUser: function () {
                return storage.user;
            },
            hasRole: function (roleApplicationKeyStringToCheck) {
                if (!storage.user) {
                    return false;
                }
                for (var assignedRoleIdIdx in storage.user['UserRoleIds']) {
                    var assignedRoleId = storage.user['UserRoleIds'][assignedRoleIdIdx];
                    for (var roleIdx in storage.userRoles) {
                        var role = storage.userRoles[roleIdx];
                        if (role['RoleId'] === assignedRoleId) {
                            if (role['RoleApplicationKeyString'] === roleApplicationKeyStringToCheck) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            },
            userAuth: function ($location) {
                if (!srv.getToken()) {
                    srv.promptLogin($location.path());
                    $location.path('/main');
                } else {
                    return srv.getUser();
                }
            },
            lostPassword: (usernameOrNotificationEmail) => {
                return $http({
                    method: 'POST',
                    url: GLOBALS.BASE_URL + '/api/v1/users/lostpassword',
                    data: {
                        UsernameOrNotificationEmailAddress: usernameOrNotificationEmail,
                        SearchForUsernameOnly: false,
                        PasswordResetLink: confirmationLink() + '&emailconfirmed=true'
                    }
                });
            },
            confirmationLink: confirmationLink,
            confirmEmail: (userId, code) => {
                return $http({
                    method: 'GET',
                    url: `${GLOBALS.BASE_URL}/api/v1/users/ConfirmEmail?userid=${userId}&code=${code}`
                });
            },
            resetPassword: (userId, passwordResetCode, newPassword) => {
                return $http({
                    method: 'POST',
                    url: GLOBALS.BASE_URL + '/api/v1/users/resetpassword',
                    data: {
                        UserId: userId,
                        PasswordResetCode: passwordResetCode,
                        NewPassword: newPassword
                    }
                });
            }
        };

        function setAuthorisationHeader() {
            $http.defaults.headers.common.Authorization = 'Bearer ' + srv.getToken();
        }

        setAuthorisationHeader();

        return srv;
    }
}

export function userAuth(AuthService, $location) {
    return AuthService.userAuth($location);
}
