import RegisterSignInForm from "./RegisterSignInForm";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../user/UserConfig";
import { getAuth } from "firebase/auth";

export const userApp = initializeApp(firebaseConfig, "user");
export const userAuth = getAuth(userApp);

export default RegisterSignInForm;
