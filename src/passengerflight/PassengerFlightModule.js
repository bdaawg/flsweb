import angular from 'angular';
import coreModule from '../core/CoreModule';
import passengerFlightController from './PassengerFlightController';
import {PassengerFlightResourceService} from './PassengerFlightResourceService';
import "angular-recaptcha";

export default angular.module('fls.passengerflight', [
    coreModule.name,
    'vcRecaptcha'
])
    .controller('PassengerFlightController', passengerFlightController)
    .service('PassengerFlightResourceService', PassengerFlightResourceService)
    .config(($routeProvider) => {
        $routeProvider
            .when('/passengerflight',
                {
                    bindToController: true,
                    controllerAs: 'ctrl',
                    controller: passengerFlightController,
                    template: require('./passengerflight.html'),
                    publicAccess: true
                });
    });
