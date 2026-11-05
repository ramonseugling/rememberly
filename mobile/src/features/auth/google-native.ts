import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { fetch as expoFetch } from 'expo/fetch';
import { apiConfiguration } from '../../config/environment';
import { googleLogin } from './google';

export const googleNeedsBuild =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const authorizeGoogle = googleLogin(
  apiConfiguration.apiOrigin,
  expoFetch,
  {
    random: () =>
      Array.from(Crypto.getRandomBytes(32), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    challenge: async (verifier) =>
      (
        await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          verifier,
          { encoding: Crypto.CryptoEncoding.BASE64 },
        )
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''),
    open: (url, returnUrl) => WebBrowser.openAuthSessionAsync(url, returnUrl),
  },
);
