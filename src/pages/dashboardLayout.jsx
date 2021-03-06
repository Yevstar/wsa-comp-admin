import React from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Select } from 'antd';

import AppConstants from 'themes/appConstants';
import AppImages from 'themes/appImages';
import history from 'util/history';
import {
  setOrganisationData,
  getOrganisationData,
  clearUmpireStorage,
  setPrevUrl,
  setImpersonation,
} from 'util/sessionStorage';
import { showRoleLevelPermission, getUserRoleId } from 'util/permissions';
import { clearHomeDashboardData } from 'store/actions/homeAction/homeAction';
import {
  getAffiliatesListingAction,
  getOrganisationAction,
  getUserOrganisationAction,
  impersonationAction,
  onOrganisationChangeAction,
  getUreAction,
} from 'store/actions/userAction/userAction';
import { clearDataOnCompChangeAction } from 'store/actions/LiveScoreAction/liveScoreMatchAction';
import Loader from 'customComponents/loader';
import './layout.css';

const { Option } = Select;

class DashboardLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      windowMobile: false,
      dataOnload: false,
      impersonationLoad: true,
      openImpersonationModal: false,
      impersonationAffiliateOrgId: null,
      impersonationOrgData: null,
      logout: false,
      userRoleId: getUserRoleId(),
    };
  }

  async componentDidUpdate(nextProps) {
    const { userState } = this.props;
    const { dataOnload } = this.state;

    if (userState !== nextProps.userState) {
      if (userState.onLoad === false && dataOnload === true) {
        const organisationData = userState.getUserOrganisation;

        if (organisationData.length > 0) {
          const impersonationRole = userState.userRoleEntity.find(role => role.roleId === 10);
          const isImpersonation = !!impersonationRole;
          const entityId = impersonationRole?.entityId;
          const presetOrganisation = organisationData.find(org => org.organisationId === entityId);
          const orgData = presetOrganisation || getOrganisationData();
          const organisationItem = orgData || organisationData[0];

          await setOrganisationData(organisationItem);
          this.props.onOrganisationChangeAction(organisationItem, 'organisationChange');
          setImpersonation(!!isImpersonation);
          this.setState({
            dataOnload: false,
            impersonationAffiliateOrgId: isImpersonation ? entityId : null,
          });
        }
      }

      if (userState.impersonation !== nextProps.userState.impersonation) {
        const { impersonationAffiliateOrgId } = this.state;
        if (userState.impersonation) {
          const impersonationAffiliate = impersonationAffiliateOrgId
            ? userState.affiliateList.find(
                affiliate => affiliate.affiliateOrgId === impersonationAffiliateOrgId,
              )
            : null;

          this.setState({
            impersonationOrgData: impersonationAffiliate,
            impersonationAffiliateOrgId,
          });

          if (!userState.impersonationLoad) {
            history.push('/');
          }
          window.location.reload();
        }
      }

      if (userState.impersonation && this.state.impersonationLoad && !userState.impersonationLoad) {
        if (this.state.logout) {
          localStorage.clear();
          history.push('/login');
        } else if (!this.state.dataOnload) {
          this.props.getUserOrganisationAction();
          this.setState({
            dataOnload: true,
            impersonationLoad: false,
          });
        }
      }

      if (userState.userRoleEntity !== nextProps.userState.userRoleEntity) {
        const isImpersonation = userState.userRoleEntity.findIndex(role => role.roleId === 10) > -1;

        const orgData = await getOrganisationData();
        setImpersonation(!!isImpersonation);
        this.setState({
          impersonationOrgData: isImpersonation ? orgData : null,
        });
      }
    }
  }

  componentDidMount() {
    this.setOrganisationKey();
    this.props.getUreAction();
  }

  setOrganisationKey = () => {
    const { userState, getUserOrganisationAction } = this.props;

    if (userState.getUserOrganisation.length === 0) {
      getUserOrganisationAction();
    }
    this.setState({ dataOnload: true });
  };

  endImpersonation = async () => {
    const { impersonationOrgData } = this.state;

    if (impersonationOrgData) {
      this.props.impersonationAction({
        orgId: impersonationOrgData.organisationUniqueKey,
        access: false,
      });

      await this.setState({
        impersonationOrgData: null,
        impersonationAffiliateOrgId: null,
        impersonationLoad: true,
      });

      await setOrganisationData(null);
    }
  };

  logout = async () => {
    const { impersonationOrgData } = this.state;

    if (impersonationOrgData) {
      this.props.impersonationAction({
        orgId: impersonationOrgData.organisationUniqueKey,
        access: false,
      });

      this.setState({ logout: true });
    } else {
      localStorage.clear();
      history.push('/login');
    }
  };

  changeId = menuName => {
    switch (menuName) {
      case AppConstants.home:
        return AppConstants.home_icon;
      default:
        return AppConstants.home_icon;
    }
  };

  menuImageChange = menuName => {
    switch (menuName) {
      case AppConstants.home:
        return AppImages.homeIcon;

      case AppConstants.account:
        return AppImages.accountIcon;

      case AppConstants.user:
        return AppImages.userIcon;

      case AppConstants.registration:
        return AppImages.regIcon;

      case AppConstants.competitions:
        return AppImages.compIcon;

      case AppConstants.liveScores:
        return AppImages.liveScoreIcon;

      case AppConstants.Communication:
        return AppImages.chatIcon;

      case AppConstants.shop:
        return AppImages.shopIcon;

      case AppConstants.umpires:
        return AppImages.umpireIcon;

      case AppConstants.incidents:
        return AppImages.incidentIcon;

      case AppConstants.finance:
        return AppImages.financeIcon;

      default:
        return AppImages.homeIcon;
    }
  };

  searchView = () => {
    this.setState({ windowMobile: !this.state.windowMobile });
  };

  onOrganisationChange = async organisationData => {
    this.props.onOrganisationChangeAction(organisationData, 'organisationChange');
    setOrganisationData(organisationData);
    this.props.clearHomeDashboardData('user');
    clearUmpireStorage();
    setPrevUrl(history.location);
    history.push('./homeDashboard', { orgChange: 'changeOrg' });
    window.location.reload();
  };

  handleImpersonation = () => {
    const organisationData = getOrganisationData();
    this.props.getAffiliatesListingAction({
      organisationId: organisationData.organisationUniqueKey,
      affiliatedToOrgId: -1,
      organisationTypeRefId: -1,
      statusRefId: -1,
      paging: { limit: -1, offset: 0 },
      stateOrganisations: false,
    });
    this.setState({ openImpersonationModal: true });
  };

  handleImpersonationModal = button => {
    if (button === 'ok') {
      const orgData = this.props.userState.impersonationList.find(
        affiliate => affiliate.affiliateOrgId === this.state.impersonationAffiliateOrgId,
      );
      if (orgData) {
        this.props.impersonationAction({
          orgId: orgData.affiliateOrgId,
          access: true,
        });
      }
      this.setState({ openImpersonationModal: false });
    } else {
      this.setState({ openImpersonationModal: false });
    }
  };

  handleImpersonationOrg = e => {
    this.setState({ impersonationAffiliateOrgId: e });
  };

  userProfileDropdown = () => {
    const { menuName, userState } = this.props;
    const userData = userState.getUserOrganisation;
    const selectedOrgData = getOrganisationData();
    const userImage =
      selectedOrgData && selectedOrgData.photoUrl
        ? selectedOrgData.photoUrl
        : AppImages.defaultUser;

    return (
      <div className="dropdown">
        <button className="dropdown-toggle" type="button" data-toggle="dropdown">
          <img id={AppConstants.user_profile_icon} src={userImage} alt="" />
        </button>

        <ul className="dropdown-menu">
          <li>
            <div className="media">
              <div className="media-left">
                <figure className="user-img-wrap">
                  <img src={userImage} alt="" />
                </figure>
              </div>

              <div className="media-body">
                {selectedOrgData && (
                  <span className="user-name">
                    {`${selectedOrgData.firstName} ${selectedOrgData.lastName}`}
                  </span>
                )}

                <span className="user-name-btm pt-3">
                  {selectedOrgData && (
                    <span style={{ textTransform: 'capitalize' }}>
                      {`${selectedOrgData.name} (${selectedOrgData.userRole})`}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </li>

          {userData.length > 0 && (
            <div className="acc-help-support-list-view">
              {userData.map((item, index) => (
                <li key={`user${index}`}>
                  <a onClick={() => this.onOrganisationChange(item)}>
                    <span
                      style={{ textTransform: 'capitalize' }}
                    >{`${item.name} (${item.userRole})`}</span>
                  </a>
                </li>
              ))}
            </div>
          )}

          <div className="acc-help-support-list-view">
            {!this.state.impersonationOrgData && (
              <li>
                <a id={AppConstants.impersonation} onClick={this.handleImpersonation}>
                  {AppConstants.impersonation}
                </a>
              </li>
            )}
            <li className={menuName === AppConstants.account ? 'active' : ''}>
              <NavLink id={AppConstants.acct_settings_label} to="/account/profile">
                Account Settings
              </NavLink>
            </li>
            <li>
              <NavLink id={AppConstants.help_support_label} to="/support">
                Help & Support
              </NavLink>
            </li>
          </div>

          <li className="acc-help-support-list-view">
            <NavLink to={{ pathname: process.env.REACT_APP_USER_REGISTRATION_URL }} target="_blank">
              {AppConstants.myProfile}
            </NavLink>
          </li>

          <li className="log-out">
            <a id={AppConstants.log_out} onClick={this.logout}>
              Log Out
            </a>
          </li>
        </ul>
      </div>
    );
  };

  render() {
    const { menuName, userState } = this.props;
    const { userRoleId, impersonationOrgData, impersonationLoad } = this.state;

    return (
      <>
        {this.state.impersonationOrgData && (
          <div className="col-sm-12 d-flex impersonation-bar">
            {`You are impersonating access to ${impersonationOrgData.name}.`}
            <a onClick={this.endImpersonation}>End access</a>
          </div>
        )}

        <header
          className={`site-header ${
            impersonationLoad && impersonationOrgData ? 'impersonation-site-header' : ''
          }`}
        >
          <div className="header-wrap">
            <div className="row m-0-res">
              <div className="col-sm-12 d-flex">
                <div className="logo-box">
                  <NavLink to="/" className="site-brand">
                    <img src={AppImages.netballLogo1} alt="" />
                  </NavLink>

                  <div
                    className="col-sm dashboard-layout-menu-heading-view"
                    onClick={this.props.onMenuHeadingClick}
                  >
                    <span id={this.props.menuId} className="dashboard-layout-menu-heading">
                      {this.props.menuHeading}
                    </span>
                  </div>
                </div>

                <div className="user-right">
                  <ul className="d-flex">
                    <li>
                      <div className="site-menu">
                        <div className="dropdown">
                          {this.props.isManuNotVisible !== true && (
                            <button
                              className="dropdown-toggle"
                              type="button"
                              data-toggle="dropdown"
                            >
                              <img
                                id={this.changeId(menuName)}
                                src={this.menuImageChange(menuName)}
                                alt=""
                              />
                            </button>
                          )}

                          <ul className="dropdown-menu">
                            <li className={menuName === AppConstants.home ? 'active' : ''}>
                              <div className="home-menu menu-wrap">
                                <NavLink to="/homeDashboard">
                                  <span className="icon" />
                                  {AppConstants.home}
                                </NavLink>
                              </div>
                            </li>
                            <li
                              className={menuName === AppConstants.user ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'user')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div className="user-menu menu-wrap">
                                <NavLink to="/userTextualDashboard">
                                  <span className="icon" />
                                  {AppConstants.user}
                                </NavLink>
                              </div>
                            </li>
                            <li
                              className={menuName === AppConstants.registration ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'registration')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div
                                id={AppConstants.registration_icon}
                                onClick={() => this.props.clearDataOnCompChangeAction()}
                                className="registration-menu menu-wrap"
                              >
                                <NavLink to="/registrationDashboard">
                                  <span id={AppConstants.registrations_label} className="icon" />
                                  {AppConstants.registration}
                                </NavLink>
                              </div>
                            </li>

                            <li
                              className={menuName === AppConstants.competitions ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'competitions')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div
                                id={AppConstants.competition_icon}
                                className="competitions-menu menu-wrap"
                              >
                                <NavLink to="/competitionDashboard">
                                  <span id={AppConstants.competitions_label} className="icon" />
                                  {AppConstants.competitions}
                                </NavLink>
                              </div>
                            </li>

                            <li
                              className={menuName === AppConstants.liveScores ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'liveScores')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div
                                className="lives-cores menu-wrap"
                                onClick={() => this.props.clearDataOnCompChangeAction()}
                              >
                                <NavLink to="/matchDayCompetitions">
                                  <span className="icon" />
                                  {AppConstants.matchDay}
                                </NavLink>
                              </div>
                            </li>
                            <li
                              className={menuName === AppConstants.Communication ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'events')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div className="events-menu menu-wrap">
                                {/* <NavLink to="/communication"> */}
                                <NavLink to="/communicationList">
                                  <span className="icon" />
                                  {AppConstants.Communication}
                                </NavLink>
                              </div>
                            </li>

                            <li
                              className={menuName === AppConstants.shop ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'shop')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div className="shop-menu menu-wrap">
                                <NavLink to="/orderSummary">
                                  <span className="icon" />
                                  {AppConstants.shop}
                                </NavLink>
                              </div>
                            </li>

                            <li
                              className={menuName === AppConstants.umpires ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'umpires')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div className="umpires-menu menu-wrap">
                                <NavLink to="/umpireDashboard">
                                  <span className="icon" />
                                  {AppConstants.umpires}
                                </NavLink>
                              </div>
                            </li>

                            <li
                              className={menuName === AppConstants.finance ? 'active' : ''}
                              style={{
                                display: showRoleLevelPermission(userRoleId, 'finance')
                                  ? 'visible'
                                  : 'none',
                              }}
                            >
                              <div
                                className="finance-menu menu-wrap"
                                onClick={() => this.props.clearDataOnCompChangeAction()}
                              >
                                <NavLink to="/paymentDashboard">
                                  <span className="icon" />
                                  {AppConstants.finance}
                                </NavLink>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>

                    <li>
                      {this.props.isManuNotVisible !== true && (
                        <div className="user-profile-box">{this.userProfileDropdown()}</div>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Modal
            className="add-membership-type-modal"
            title={AppConstants.impersonationOrgSelect}
            visible={this.state.openImpersonationModal}
            onOk={() => this.handleImpersonationModal('ok')}
            onCancel={() => this.handleImpersonationModal('cancel')}
          >
            <Select
              className="w-100 reg-filter-select-competition"
              onChange={this.handleImpersonationOrg}
              placeholder="Organisation"
              showSearch
              filterOption={(input, data) =>
                data.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={userState.onImpersonationLoad}
            >
              {(userState.impersonationList || []).map(affiliate => (
                <Option
                  key={`organization_${affiliate.affiliateOrgId}`}
                  value={affiliate.affiliateOrgId}
                >
                  {affiliate.affiliateName}
                </Option>
              ))}
            </Select>
          </Modal>

          <Loader visible={userState.impersonationLoad} />
        </header>
      </>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getUreAction,
      getUserOrganisationAction,
      onOrganisationChangeAction,
      clearHomeDashboardData,
      getOrganisationAction,
      impersonationAction,
      getAffiliatesListingAction,
      clearDataOnCompChangeAction,
    },
    dispatch,
  );
}

function mapStateToProps(state) {
  return {
    userState: state.UserState,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardLayout);
