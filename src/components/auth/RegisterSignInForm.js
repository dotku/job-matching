import { onAuthStateChanged } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { userAuth } from ".";
import { AppContext } from "../../App";
import RegisterSignInFormPassword from "./RegisterSignInFormPassword";
import RegisterSignInGoogleButton from "./RegisterSignInGoogleButton";
import SignOutButton from "./SignOutButton";

export default function RegisterSignInForm() {
  const [user, setUser] = useState();
  const { appState, setAppState } = useContext(AppContext);

  useEffect(() => {
    console.log("appState", appState);
    const unsubscribe = onAuthStateChanged(userAuth, (user) => {
      if (user) {
        console.log("user", user);
        setAppState({
          ...appState,
          user,
        });
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div>
      {user ? (
        <>
          <p>Hello, {user.displayName || user.email}!</p>
          <SignOutButton />
        </>
      ) : (
        <>
          <RegisterSignInFormPassword />
          <div className="text-center">
            <RegisterSignInGoogleButton />
          </div>
        </>
      )}
    </div>
  );
}
