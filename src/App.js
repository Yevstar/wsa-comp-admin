import React, { useEffect } from 'react';
import { Offline } from 'react-detect-offline';
import {
  // MemoryRouter,
  Router,
  Route,
  Redirect,
  Switch,
} from 'react-router-dom';
// import FullStory from 'react-fullstory';
import TagManager from 'react-gtm-module';

import Routes from './pages/routes';
import history from './util/history';
import PrivateRoute from './util/protectedRoute';
import Login from './components/login';
import ForgotPassword from './components/ForgotPassword';
import lazyLoad from './components/lazyLoad';
import ErrorBoundary from './components/emptyComponent/errorBoundary';
import { getOrganisationData, getRoleId, getSignDate, removeSignDate } from 'util/sessionStorage';
import { Alert } from 'antd';
import './customStyles/customStyles.css';
import './customStyles/antdStyles.css';

// const ORG_ID = 'Netball';
const tagManagerArgs = {
  gtmId: process.env.REACT_APP_GTM_ID,
};
// const tawkTo = require('tawkto-react');
// const tawkToPropertyId = '5ef6f3ca4a7c6258179b6f5c';
const organisationData = getOrganisationData();
const userData = {
  name: organisationData
    ? organisationData.firstName + ' ' + organisationData.lastName + ' | ' + organisationData.name
    : '',
  email: organisationData ? organisationData.userEmail : '',
};

TagManager.initialize(tagManagerArgs);

function App() {
  useEffect(() => {
    if (localStorage.token) {
      if (getSignDate() && Date.now() - localStorage.signDate > 60 * 60 * 24) {
        removeSignDate();
      }

      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
      (function () {
        var s1 = document.createElement('script'),
          s0 = document.getElementsByTagName('script')[0];
        s1.async = true;
        s1.src = 'https://embed.tawk.to/5ef6f3ca4a7c6258179b6f5c/default';
        s1.charset = 'UTF-8';
        s1.setAttribute('crossorigin', '*');
        s0.parentNode.insertBefore(s1, s0);
      })();
      window.Tawk_API.onLoad = function () {
        window.Tawk_API.setAttributes(
          {
            name: userData.name,
            email: userData.email,
          },
          function (error) {},
        );
      };
    }
  }, []);

  return (
    <div className="App">
      <ErrorBoundary>
        <Offline
          polling={{
            url: 'https://ipv4.icanhazip.com',
            interval: 10000,
            timeout: 10000,
          }}
        >
          <div className="offlineAlert">
            <Alert message="You're offline right now. Check your connection." banner />
          </div>
        </Offline>
        {/* <FullStory org={ORG_ID} /> */}
        {/* <MemoryRouter> */}
        <Router history={history}>
          <Switch>
            <Route
              exact
              path="/"
              render={() =>
                localStorage.token ? <Redirect to="/homeDashboard" /> : <Redirect to="/login" />
              }
            />

            <Route path="/login" component={lazyLoad(Login)} />
            <Route path="/forgotPassword" component={lazyLoad(ForgotPassword)} />

            <PrivateRoute path="/" component={lazyLoad(Routes)} />
          </Switch>
        </Router>
        {/* </MemoryRouter> */}
      </ErrorBoundary>
    </div>
  );
}

export default App;
