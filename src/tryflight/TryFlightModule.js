import angular from 'angular';
import coreModule from '../core/CoreModule';
import TryFlightController from './TryFlightController';
import {TrialFlightResourceService} from './TrialFlightResourceService';
import "angular-recaptcha";

export default angular.module('fls.tryflight', [
    coreModule.name,
    'vcRecaptcha'
])
    .controller('TryFlightController', TryFlightController)
    .service('TrialFlightResourceService', TrialFlightResourceService)
    .config(($routeProvider) => {
        $routeProvider
            .when('/trialflight',
                {
                    bindToController: true,
                    controllerAs: 'ctrl',
                    controller: TryFlightController,
                    template: require('./tryflight.html'),
                    publicAccess: true
                });
    });
