export default class AccountingRuleFiltersEditController {
    constructor($scope, $q, $routeParams, $location, NgTableParams, GLOBALS, AuthService, AccountingRuleFilterService, AircraftsOverviews, StartTypes, FlightTypes, Locations, ArticlesService, PagedPersons,
                PagedAccountingRuleFilters, AccountingRuleFilter, MessageManager, DropdownItemsRenderService, AccountingRuleFilterTypesService, FlightCrewTypesService,
                MemberStates, AccountingUnitTypesService) {

        $scope.debug = GLOBALS.DEBUG;
        $scope.busy = true;
        $scope.isClubAdmin = AuthService.isClubAdmin();
        $scope.md = {};
        $scope.selection = {};
        $scope.text = {};
        $scope.renderAccountingRuleFilterType = DropdownItemsRenderService.accountingRuleFilterTypeRenderer();
        $scope.renderArticle = DropdownItemsRenderService.articleRenderer();
        $scope.renderPerson = DropdownItemsRenderService.personRenderer();

        function loadMasterData() {
            return $q.all([
                AccountingRuleFilterTypesService.getAccountingRuleFilterTypes().then((result) => {
                    $scope.md.accountingRuleFilterTypes = result;
                }),
                AircraftsOverviews.query().$promise.then((result) => {
                    $scope.md.aircrafts = result;
                }),
                StartTypes.query().$promise.then((result) => {
                    $scope.md.startTypes = result;
                }),
                FlightTypes.query().$promise.then((result) => {
                    $scope.md.flightTypes = result;
                }),
                Locations.getLocations().$promise.then((result) => {
                    $scope.md.locations = result;
                }),
                ArticlesService.getArticles().then((result) => {
                    $scope.md.articles = result;
                }),
                PagedPersons.getAllPersons().then((result) => {
                    $scope.md.persons = result;
                }),
                PagedPersons.getAllPersonCategories().then((result) => {
                    $scope.md.personCategories = result;
                }),
                FlightCrewTypesService.getFlightCrewTypes().then((result) => {
                    $scope.md.flightCrewTypes = result;
                }),
                MemberStates.query().$promise.then((result) => {
                    $scope.md.memberStates = result;
                }),
                AccountingUnitTypesService.getAccountingUnitTypes().then((result) => {
                    $scope.md.accountingUnitTypes = result;
                    $scope.unitTypeChanged();
                })
            ]);
        }

        function mapAccountingRule(result) {
            $scope.accountingRuleFilter = result;
            if ($scope.accountingRuleFilter.ArticleTarget) {
                $scope.selection.ArticleNumber = $scope.accountingRuleFilter.ArticleTarget.ArticleNumber;
                $scope.text.DeliveryLineText = $scope.accountingRuleFilter.ArticleTarget.DeliveryLineText;
            }
            if ($scope.accountingRuleFilter.RecipientTarget) {
                $scope.selection.PersonClubMemberNumber = $scope.accountingRuleFilter.RecipientTarget.PersonClubMemberNumber;
                $scope.text.RecipientName = $scope.accountingRuleFilter.RecipientTarget.RecipientName;
            }
            $scope.md.flightDurationUnlimited = !($scope.accountingRuleFilter.MinFlightTimeInSecondsMatchingValue > 0 || $scope.accountingRuleFilter.MaxFlightTimeInSecondsMatchingValue < 2147483647);
            $scope.md.showThreadsholdText = !!$scope.accountingRuleFilter.ThresholdText;

            return $scope.accountingRuleFilter;
        }

        if ($routeParams.id !== undefined) {
            $scope.busy = true;
            loadMasterData()
                .then(() => {
                    if ($routeParams.id === 'new') {
                        $scope.accountingRuleFilter = {
                            IsActive: true,
                            CanUpdateRecord: true,
                            UseRuleForAllStartLocationsExceptListed: true,
                            UseRuleForAllLdgLocationsExceptListed: true,
                            UseRuleForAllFlightCrewTypesExceptListed: true,
                            UseRuleForAllAircraftsExceptListed: true,
                            UseRuleForAllClubMemberNumbersExceptListed: true,
                            UseRuleForAllFlightTypesExceptListed: true,
                            UseRuleForAllStartTypesExceptListed: true,
                            UseRuleForAllAircraftsOnHomebaseExceptListed: true,
                            UseRuleForAllMemberStatesExceptListed: true,
                            UseRuleForAllPersonCategoriesExceptListed: true
                        };
                    } else if ($location.path().indexOf('/copy') > 0) {
                        PagedAccountingRuleFilters.getAccountingRuleFilter($routeParams.id)
                            .then(mapAccountingRule)
                            .then((accountingRuleFilter) => {
                                accountingRuleFilter.AccountingRuleFilterId = undefined;
                                accountingRuleFilter.RuleFilterName += ' (copy)';
                            });
                    } else {
                        PagedAccountingRuleFilters.getAccountingRuleFilter($routeParams.id)
                            .then(mapAccountingRule);
                    }
                })
                .finally(() => {
                    $scope.busy = false;
                });
        } else {
            $scope.busy = false;
            $scope.tableParams = new NgTableParams({
                filter: {},
                sorting: {
                    RuleFilterName: 'asc'
                },
                count: 100
            }, {
                counts: [],
                getData: function (params) {
                    $scope.busy = true;
                    let pageSize = params.count();
                    let pageStart = (params.page() - 1) * pageSize;

                    return PagedAccountingRuleFilters.getAccountingRuleFilters($scope.tableParams.filter(), $scope.tableParams.sorting(), pageStart, pageSize)
                        .then((result) => {
                            $scope.busy = false;
                            params.total(result.TotalRows);

                            return result.Items;
                        })
                        .finally(() => {
                            $scope.busy = false;
                        });
                }
            });
        }

        $scope.cancel = function () {
            $location.path('/masterdata/accountingRuleFilters');
        };
        $scope.save = function (accountingRuleFilter) {
            $scope.busy = true;
            if (!$scope.md.showThreadsholdText) {
                accountingRuleFilter.ThresholdText = undefined;
            }
            if ($scope.md.flightDurationUnlimited) {
                accountingRuleFilter.MinFlightTimeInSecondsMatchingValue = undefined;
                accountingRuleFilter.MaxFlightTimeInSecondsMatchingValue = undefined;
            }
            if ($scope.targetTypeRecipientVisible()) {
                accountingRuleFilter.ArticleTarget = {};
                accountingRuleFilter.RecipientTarget = $scope.selection.PersonClubMemberNumber && {
                    PersonClubMemberNumber: $scope.selection.PersonClubMemberNumber,
                    RecipientName: $scope.text.RecipientName
                } || {};
            } else if ($scope.targetTypeArticleVisible()) {
                accountingRuleFilter.ArticleTarget = $scope.selection.ArticleNumber && {
                    ArticleNumber: $scope.selection.ArticleNumber,
                    DeliveryLineText: $scope.text.DeliveryLineText
                } || {};
                accountingRuleFilter.RecipientTarget = {};
            }
            else {
                accountingRuleFilter.ArticleTarget = {};
                accountingRuleFilter.RecipientTarget = {};
            }

            let p = new AccountingRuleFilter(accountingRuleFilter);
            if (accountingRuleFilter.AccountingRuleFilterId) {
                p.$saveAccountingRuleFilter({id: accountingRuleFilter.AccountingRuleFilterId})
                    .then($scope.cancel)
                    .catch(_.partial(MessageManager.raiseError, 'update', 'accountingRuleFilter'))
                    .finally(function () {
                        $scope.busy = false;
                    });
            } else {
                p.$save()
                    .then($scope.cancel)
                    .catch(_.partial(MessageManager.raiseError, 'insert', 'accountingRuleFilter'))
                    .finally(function () {
                        $scope.busy = false;
                    });
            }
        };

        $scope.deleteAccountingRuleFilter = function (accountingRuleFilter) {
            AccountingRuleFilterService.delete(accountingRuleFilter)
                .then(() => {
                    $scope.tableParams.reload();
                })
                .catch(_.partial(MessageManager.raiseError, 'remove', 'accountingRuleFilter'));
        };


        $scope.newAccountingRuleFilter = function () {
            $location.path('/masterdata/accountingRuleFilters/new');
        };

        $scope.editAccountingRuleFilter = function (accountingRuleFilter) {
            $location.path('/masterdata/accountingRuleFilters/' + accountingRuleFilter.AccountingRuleFilterId);
        };

        $scope.copyAccountingRuleFilter = function (accountingRuleFilter) {
            $location.path('/masterdata/accountingRuleFilters/copy/' + accountingRuleFilter.AccountingRuleFilterId);
        };

        $scope.articleChanged = () => {
            if ($scope.selection && $scope.selection.ArticleNumber) {
                let selectedArticle = $scope.md.articles.find((article) => article.ArticleNumber === $scope.selection.ArticleNumber);
                $scope.text.DeliveryLineText = selectedArticle && selectedArticle.ArticleName;
            } else {
                $scope.text.DeliveryLineText = "";
            }
            setTimeout(() => {
                $scope.$apply();
            }, 0);
        };

        $scope.recipientChanged = () => {
            if ($scope.selection && $scope.selection.PersonClubMemberNumber) {
                let selectedPerson = $scope.md.persons.find((person) => person.MemberNumber === $scope.selection.PersonClubMemberNumber);
                $scope.text.RecipientName = selectedPerson && (selectedPerson.Firstname + ' ' + selectedPerson.Lastname);
            } else {
                $scope.text.RecipientName = "";
            }
            setTimeout(() => {
                $scope.$apply();
            }, 0);
        };

        $scope.unitTypeChanged = () => {
            setTimeout(() => {
                $scope.$apply();
            }, 0);
        };

        $scope.targetTypeArticleVisible = () => {
            return $scope.accountingRuleFilter
                && ($scope.accountingRuleFilter.AccountingRuleFilterTypeId != 5
                && $scope.accountingRuleFilter.AccountingRuleFilterTypeId != 10);
        };

        $scope.targetTypeRecipientVisible = () => {
            return $scope.accountingRuleFilter
                && $scope.accountingRuleFilter.AccountingRuleFilterTypeId == 10;
        };

        $scope.isRuleTypeAircraftFilter = () => {
            return $scope.accountingRuleFilter
                && $scope.accountingRuleFilter.AccountingRuleFilterTypeId == 30;
        };

        $scope.isRuleTypeNoLandingTax = () => {
            return $scope.accountingRuleFilter
                && $scope.accountingRuleFilter.AccountingRuleFilterTypeId == 20;
        };
    }
}

