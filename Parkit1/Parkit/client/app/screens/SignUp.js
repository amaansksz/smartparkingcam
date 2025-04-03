import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { firestore_DB } from '../../db/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const SignUp = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState('');
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState('');

  const handleEmailChange = (text) => setEmail(text);
  const handleNameChange = (text) => setName(text);
  const handlePasswordChange = (text) => setPassword(text);
  const handleConfirmedPasswordChange = (text) => setConfirmedPassword(text);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addUserInDB = async (name, email, pass) => {
    try {
      const collectionRef = collection(firestore_DB, 'users');
      await addDoc(collectionRef, { name, email, password: pass });
      console.log("User data inserted successfully");
    } catch (error) {
      console.error("Error in addUserInDB:", error);
      throw error;
    }
  };

  const handleButtonPress = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setPasswordMatchError('');

    if (!isValidEmail(email)) {
      setEmailError('Invalid email');
      return;
    }

    try {
      const q = query(collection(firestore_DB, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setPasswordMatchError("User exists! Try logging in.");
        return;
      }
    } catch (error) {
      console.error("Firestore query error:", error);
      return;
    }

    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Minimum length is 8 characters');
      return;
    }

    if (password !== confirmedPassword) {
      setPasswordMatchError("Passwords do not match");
      return;
    }

    try {
      await addUserInDB(name, email, password);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmedPassword('');
      navigation.navigate('Login');
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.signInText}>Sign In</Text>
      <Text style={styles.signInTextDesc}>Please fill in the details to create your account.</Text>
      <TextInput style={styles.input} onChangeText={handleEmailChange} autoCapitalize="none" value={email} placeholder="Enter email" />
      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

      <TextInput style={styles.input} onChangeText={handleNameChange} value={name} placeholder="Enter name" />
      {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

      <TextInput style={styles.input} autoCapitalize="none" onChangeText={handlePasswordChange} value={password} secureTextEntry placeholder="Enter password" />
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

      <TextInput style={styles.input} autoCapitalize="none" onChangeText={handleConfirmedPasswordChange} value={confirmedPassword} secureTextEntry placeholder="Confirm password" />
      {passwordMatchError ? <Text style={styles.error}>{passwordMatchError}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'rgb(214 255 118)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    height: 47,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 2,
    marginBottom: 10,
    borderRadius: 5,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: 'rgba(255, 210, 0, 1)',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signInText: {
    marginBottom: 10,
    fontSize: 25,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
  },
  signInTextDesc: {
    fontSize: 18,
    fontWeight: '400',
    color: 'grey',
    textAlign: 'center',
    marginBottom: 25,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  loginText: {
    color: 'grey',
    marginTop: 20,
  },
});

export default SignUp;
