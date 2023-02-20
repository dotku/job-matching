import { useEffect, useState } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../config/UserConfig";
import SignOutButton from "./SignOutButton";

export const userApp = initializeApp(firebaseConfig, "user");
export const newAuth = getAuth(userApp);

export default function RegisterSignInGoogleButton() {
  const [auth, setAuth] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    setAuth(newAuth);
    const newProvider = new GoogleAuthProvider();
    newProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    setProvider(newProvider);
  }, []);

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // const credential = provider.credentialFromResult(result);
        // const token = credential.accessToken;
        // The signed-in user info.
        // setUser(result.user);
        // IdP data available using getAdditionalUserInfo(result)
        console.log("result", result);
        // ...
      })
      .catch((error) => {
        console.error(error);
        // Handle Errors here.
        // const errorCode = error.code;
        // const errorMessage = error.message;
        // // The email of the user's account used.
        // const email = error.customData.email;
        // // The AuthCredential type that was used.
        // const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  };

  return (
    <button onClick={handleGoogleSignIn} className="btn btn-danger">
      Sign in with Google
    </button>
  );
}
