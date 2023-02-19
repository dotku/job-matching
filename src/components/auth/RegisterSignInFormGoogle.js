import { useEffect, useState } from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

import SignOutButton from "./SignOutButton";
import { userAuth } from ".";

export default function RegisterSignInFormGoogle() {
  const [user, setUser] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const newProvider = new GoogleAuthProvider();
    newProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    setProvider(newProvider);
  }, []);

  const handleGoogleSignIn = () => {
    signInWithPopup(userAuth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // const credential = provider.credentialFromResult(result);
        // const token = credential.accessToken;
        // The signed-in user info.
        setUser(result.user);
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
    <div>
      {user ? (
        <>
          <p>Hello, {user.displayName}!</p>
          <SignOutButton />
        </>
      ) : (
        <button onClick={handleGoogleSignIn} className="btn btn-danger">
          Sign in with Google
        </button>
      )}
    </div>
  );
}
