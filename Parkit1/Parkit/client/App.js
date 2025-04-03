// Polyfill for setImmediate if it doesn't exist
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}

import * as React from 'react';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spinner from 'react-native-loading-spinner-overlay';

import Login from './app/screens/Login';
import SignUp from './app/screens/SignUp';
import Home from './app/screens/Home';
import UserBookings from './app/screens/UserBookings';
import PaymentScreen from './app/screens/PaymentScreen';
import VehicleDetails from './app/screens/VehicleDetails';
import BookingDetails from './app/screens/BookingDetails';
import SelectSlot from './app/screens/SelectSlot';
import BookingConfirmation from './app/screens/BookingConfirmation';

const Stack = createNativeStackNavigator();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function checkLoginStatus() {
    try {
      const data = await AsyncStorage.getItem('isLoggedIn');
      console.log('isLoggedIn from AsyncStorage:', data);
      setIsLoggedIn(data === 'true');
    } catch (error) {
      console.error("Error checking login status:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log('App.js: useEffect triggered');
    checkLoginStatus();
  }, []);

  console.log('App.js: Rendering, isLoading:', isLoading, 'isLoggedIn:', isLoggedIn);

  return (
    <NavigationContainer>
      {isLoading ? (
        <Spinner
          visible={isLoading}
          textContent={'Loading...'}
          textStyle={{ color: '#FFF' }}
        />
      ) : (
        <Stack.Navigator
          initialRouteName={isLoggedIn ? 'Home' : 'Login'} // Changed to 'Login'
          screenOptions={{
            headerShown: false,
            headerTitleStyle: { fontSize: 20 },
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#000',
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="UserBookings" component={UserBookings} />
          <Stack.Screen name="BookingDetails" component={BookingDetails} />
          <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
          <Stack.Screen name="VehicleDetails" component={VehicleDetails} />
          <Stack.Screen name="SelectSlot" component={SelectSlot} />
          <Stack.Screen name="BookingConfirmation" component={BookingConfirmation} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default App;