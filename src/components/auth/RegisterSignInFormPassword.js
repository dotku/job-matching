import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useContext, useState } from "react";
import { userAuth } from ".";
import { AppContext } from "../../App";

export default function RegisterSignInFormPassword() {
  const { appState, setAppState } = useContext(AppContext);
  const [user, setUser] = useState(null);

  const handleInputChange = (prop) => (e) => {
    console.log("handleInputChange");
    setUser({
      ...user,
      [prop]: e.target.value,
    });
  };

  const handleRegistration = (e) => {
    e.preventDefault();
    createUserWithEmailAndPassword(userAuth, user.email, user.password)
      .then((userCredential) => {
        setAppState({
          ...appState,
          userCredential,
        });
        console.log("userCredential", userCredential);
      })
      .catch((error) => {
        alert(`creat account failed :(, ${error.message}`);
        console.error(error.message);
      });
  };

  const handleSignIn = (e) => {
    e.preventDefault();

    signInWithEmailAndPassword(userAuth, user.email, user.password)
      .then((_userCredential) => {})
      .catch((e) => {
        alert("Login failed :(");
        console.error(e);
      });
  };

  return (
    <form onSubmit={handleRegistration}>
      <div>
        <div>
          <div className="m-3">
            <div className="display-6">Welcome</div>
          </div>
          <div className="m-3">
            <label htmlFor="email">Email</label>
            <input
              className="form-control"
              type="email"
              id="email"
              onChange={handleInputChange("email")}
            />
          </div>
          <div className="m-3">
            <label htmlFor="password">Password</label>
            <input
              className="form-control"
              type="password"
              id="password"
              onChange={handleInputChange("password")}
            />
          </div>
          <div className="m-3 text-center">
            <button
              className="btn btn-outline-primary me-3 mt-3"
              onClick={handleSignIn}
            >
              Sign in
            </button>
            <button className="btn btn-primary mt-3" type="submit">
              Register
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
