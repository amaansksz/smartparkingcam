import './polyfills'; // Load polyfill first
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { unstable_enableLogBox } from 'react-native';

// Bridgeless mode disable karo
global.__REACT_NATIVE_BRIDGELESS__ = false;

AppRegistry.registerComponent('main', () => App);