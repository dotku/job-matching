import { signOut } from "firebase/auth";
import { userAuth } from ".";

export default function SignOutButton() {
  const handleButtonClick = () => {
    signOut(userAuth)
      .then(() => {
        // Sign-out successful.
      })
      .catch((error) => {
        // An error happened.
      });
  };
  return (
    <button className="btn btn-outline-primary" onClick={handleButtonClick}>
      Sign Out
    </button>
  );
}
