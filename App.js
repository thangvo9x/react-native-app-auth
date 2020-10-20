import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UIManager, Linking, Alert } from 'react-native';
import { authorize, refresh, revoke, prefetchConfiguration } from 'react-native-app-auth';
import { Page, Button, ButtonContainer, Form, FormLabel, FormValue, Heading } from './components';

import {WebView} from 'react-native-webview';

const configs = {
  identityserver: {
    issuer: 'https://hungthinhid.ddns.net:9443', //'https://demo.identityserver.io',
    clientId: 'lM7xJj9W6eXRpF0od8qTfVNb62sa',
    redirectUrl: 'http://localhost:8080/demo',
    additionalParameters: {
      name: "Tony Ne",
      age: 16,
      single: true
    },
    scopes: ['openid', 'profile', 'email', 'offline_access'],

    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://demo.identityserver.io/connect/authorize',
    //   tokenEndpoint: 'https://demo.identityserver.io/connect/token',
    //   revocationEndpoint: 'https://demo.identityserver.io/connect/revoke'
    // }
  },
  auth0: {
    // From https://openidconnect.net/
    issuer: 'https://samples.auth0.com',
    clientId: 'kbyuFDidLLm280LIwVFiazOqjO3ty8KH',
    redirectUrl: 'https://openidconnect.net/callback',
    additionalParameters: {},
    scopes: ['openid', 'profile', 'email', 'phone', 'address'],
    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://samples.auth0.com/authorize',
    //   tokenEndpoint: 'https://samples.auth0.com/oauth/token',
    //   revocationEndpoint: 'https://samples.auth0.com/oauth/revoke'
    // }
  },
  hdid: {
    issuer: 'https://hungthinhid.ddns.net:9443',
    clientId: 'lM7xJj9W6eXRpF0od8qTfVNb62sa',
    // From https://openidconnect.net/
    redirectUrl: 'localhost:8080/demo',
    additionalParameters: {},
    scopes: ['openid', 'offline_access'],

    serviceConfiguration: {
      authorizationEndpoint: 'https://hungthinhid.ddns.net:9443/oauth2/authorize',
      // tokenEndpoint: 'https://samples.auth0.com/oauth/token',
      // revocationEndpoint: 'https://samples.auth0.com/oauth/revoke'
    }
  }
};

const defaultAuthState = {
  hasLoggedInOnce: false,
  provider: '',
  accessToken: '',
  accessTokenExpirationDate: '',
  refreshToken: ''
};

const App = () => {
  const [authState, setAuthState] = useState(defaultAuthState);
  React.useEffect(() => {
    prefetchConfiguration({
      warmAndPrefetchChrome: true,
      // ...configs.identityserver
    });
  }, []);

  const handleAuthorize = useCallback(
    async provider => {
      try {
        const config = configs[provider];
        const newAuthState = await authorize(config);
        console.log(newAuthState)
        setAuthState({
          hasLoggedInOnce: true,
          provider: provider,
          ...newAuthState
        });
        
      } catch (error) {
        Alert.alert('Failed to log in', error.message);
      }
    },
    [authState]
  );

  const handleRefresh = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      const newAuthState = await refresh(config, {
        refreshToken: authState.refreshToken
      });

      setAuthState(current => ({
        ...current,
        ...newAuthState,
        refreshToken: newAuthState.refreshToken || current.refreshToken
      }))

    } catch (error) {
      Alert.alert('Failed to refresh token', error.message);
    }
  }, [authState]);

  const handleRevoke = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      await revoke(config, {
        tokenToRevoke: authState.accessToken,
        sendClientId: true
      });

      setAuthState({
        provider: '',
        accessToken: '',
        accessTokenExpirationDate: '',
        refreshToken: ''
      });
    } catch (error) {
      Alert.alert('Failed to revoke token', error.message);
    }
  }, [authState]);

  const showRevoke = useMemo(() => {
    if (authState.accessToken) {
      const config = configs[authState.provider];
      if (config.issuer || config.serviceConfiguration.revocationEndpoint) {
        return true;
      }
    }
    return false;
  }, [authState]);

  // return <WebView source={{uri:'https://hungthinhid.ddns.net:9443/oauth2/authorize?response_type=code&scope=openid offline_access&client_id=lM7xJj9W6eXRpF0od8qTfVNb62sa&redirect_uri=http://localhost:8080/demo'}} />
  return (
    <Page>
      {!!authState.accessToken ? (
        <Form>
          <FormLabel>accessToken</FormLabel>
          <FormValue>{authState.accessToken}</FormValue>
          <FormLabel>accessTokenExpirationDate</FormLabel>
          <FormValue>{authState.accessTokenExpirationDate}</FormValue>
          <FormLabel>refreshToken</FormLabel>
          <FormValue>{authState.refreshToken}</FormValue>
          <FormLabel>scopes</FormLabel>
          <FormValue>{authState.scopes.join(', ')}</FormValue>
        </Form>
      ) : (
        <Heading>{authState.hasLoggedInOnce ? 'Goodbye.' : 'Hello, stranger.'}</Heading>
      )}

      <ButtonContainer>
        {!authState.accessToken ? (
          <>
            <Button
              onPress={() => handleAuthorize('auth0')}
              text="Authorize Auth0"
              color="#DA2536"
            />
            <Button
              onPress={() => handleAuthorize('hdid')}
              text="Authorize HTID"
              color="#DA2536"
            />
          </>
        ) : null}
        {!!authState.refreshToken ? (
          <Button onPress={handleRefresh} text="Refresh" color="#24C2CB" />
        ) : null}
        {showRevoke ? (
          <Button onPress={handleRevoke} text="Revoke" color="#EF525B" />
        ) : null}
      </ButtonContainer>
    </Page>
  );
}

export default App;